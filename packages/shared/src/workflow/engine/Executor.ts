import { EventEmitter } from "node:events";
import { nanoid } from "nanoid";
import { DataBus } from "./DataBus.js";
import { nodeRegistry } from "../nodeRegistry.js";
import logger from "../../utils/log.js";

import type { Workflow, WorkflowNode, ExecutionStatus, NodeExecutionStatus } from "../types.js";
import type { BaseNode, NodeExecutionContext } from "../nodes/base/BaseNode.js";

/**
 * 工作流执行事件
 */
type WorkflowExecutorEvents = {
  "workflow-start": { executionId: string; workflowId: string };
  "workflow-complete": { executionId: string; status: ExecutionStatus };
  "node-start": { executionId: string; nodeId: string; nodeName: string };
  "node-complete": {
    executionId: string;
    nodeId: string;
    status: NodeExecutionStatus;
    outputs?: Record<string, any>;
  };
  "node-error": { executionId: string; nodeId: string; error: string };
};

/**
 * 执行结果
 */
export interface ExecutionResult {
  executionId: string;
  status: ExecutionStatus;
  startTime: number;
  endTime: number;
  duration: number;
  nodeResults: Record<string, { status: NodeExecutionStatus; outputs?: Record<string, any> }>;
  error?: string;
}

/**
 * DAG 执行引擎
 */
export class WorkflowExecutor extends EventEmitter {
  constructor() {
    super();
  }

  /**
   * 发射事件（兼容旧的 emit 方法）
   */
  private emitEvent<K extends keyof WorkflowExecutorEvents>(
    event: K,
    data: WorkflowExecutorEvents[K],
  ): void {
    this.emit(event, data);
  }

  /**
   * 监听事件（提供类型安全的 on 方法）
   */
  onEvent<K extends keyof WorkflowExecutorEvents>(
    event: K,
    handler: (data: WorkflowExecutorEvents[K]) => void,
  ): void {
    this.on(event, handler);
  }

  /**
   * 取消监听（提供类型安全的 off 方法）
   */
  offEvent<K extends keyof WorkflowExecutorEvents>(
    event: K,
    handler: (data: WorkflowExecutorEvents[K]) => void,
  ): void {
    this.off(event, handler);
  }

  /**
   * 执行工作流
   *
   * @param workflow 工作流定义
   * @param initialInputs 初始输入数据（可选，用于触发节点）
   * @returns 执行结果
   */
  async execute(workflow: Workflow, initialInputs?: Record<string, any>): Promise<ExecutionResult> {
    const executionId = nanoid();
    const startTime = Date.now();

    logger.info(`开始执行工作流: ${workflow.name} (${executionId})`);
    this.emitEvent("workflow-start", { executionId, workflowId: workflow.id });

    try {
      // 构建 DAG
      const { nodes, edges } = workflow.definition;
      const dataBus = new DataBus(edges);

      // 拓扑排序
      const sortedNodes = this.topologicalSort(nodes, edges);
      if (!sortedNodes) {
        throw new Error("工作流包含循环依赖，无法执行");
      }

      logger.debug(`节点执行顺序: ${sortedNodes.map((n) => n.id).join(" -> ")}`);

      // 执行节点
      const nodeResults: Record<
        string,
        { status: NodeExecutionStatus; outputs?: Record<string, any> }
      > = {};
      const completedNodes = new Set<string>();

      // 按层级并行执行
      const levels = this.buildExecutionLevels(sortedNodes, edges);

      for (const level of levels) {
        logger.debug(`执行层级: [${level.map((n) => n.id).join(", ")}]`);

        // 并行执行同一层级的节点
        await Promise.all(
          level.map(async (node) => {
            try {
              const result = await this.executeNode(
                node,
                dataBus,
                {
                  workflowId: workflow.id,
                  executionId,
                  nodeId: node.id,
                  variables: workflow.definition.variables,
                },
                initialInputs,
              );

              nodeResults[node.id] = { status: "success", outputs: result };
              completedNodes.add(node.id);
            } catch (error: any) {
              logger.error(`节点 ${node.id} 执行失败:`, error);
              nodeResults[node.id] = { status: "failed" };
              this.emitEvent("node-error", {
                executionId,
                nodeId: node.id,
                error: error.message,
              });
              throw error; // 阻止后续节点执行
            }
          }),
        );
      }

      const endTime = Date.now();
      logger.info(`工作流执行完成: ${workflow.name} (耗时: ${endTime - startTime}ms)`);

      this.emitEvent("workflow-complete", { executionId, status: "success" });

      return {
        executionId,
        status: "success",
        startTime,
        endTime,
        duration: endTime - startTime,
        nodeResults,
      };
    } catch (error: any) {
      const endTime = Date.now();
      logger.error(`工作流执行失败: ${workflow.name}`, error);

      this.emitEvent("workflow-complete", { executionId, status: "failed" });

      return {
        executionId,
        status: "failed",
        startTime,
        endTime,
        duration: endTime - startTime,
        nodeResults: {},
        error: error.message,
      };
    }
  }

  /**
   * 执行单个节点
   */
  private async executeNode(
    workflowNode: WorkflowNode,
    dataBus: DataBus,
    context: NodeExecutionContext,
    initialInputs?: Record<string, any>,
  ): Promise<Record<string, any>> {
    const { id, type, data } = workflowNode;
    const { config } = data;

    logger.info(`执行节点: ${id} (${type})`);
    this.emitEvent("node-start", {
      executionId: context.executionId,
      nodeId: id,
      nodeName: data.label,
    });

    // 获取节点实例
    const nodeInstance = nodeRegistry.getNode(type);
    if (!nodeInstance) {
      throw new Error(`未找到节点类型: ${type}`);
    }

    // 验证配置
    const validationResult = nodeInstance.validate(config);
    if (validationResult !== true) {
      throw new Error(`节点配置验证失败: ${validationResult}`);
    }

    // 收集输入数据
    let inputs: Record<string, any>;
    const predecessors = dataBus.getPredecessors(id);

    if (predecessors.length === 0) {
      // 无前置节点，使用初始输入或空对象
      inputs = initialInputs || {};
    } else {
      // 从 DataBus 收集输入
      inputs = dataBus.collectInputsForNode(id);
    }

    // 执行前钩子
    if (nodeInstance.beforeExecute) {
      await nodeInstance.beforeExecute(inputs, config, context);
    }

    // 执行节点
    const startTime = Date.now();
    const outputs = await nodeInstance.execute(inputs, config, context);
    const duration = Date.now() - startTime;

    logger.info(`节点 ${id} 执行完成 (耗时: ${duration}ms)`);

    // 执行后钩子
    if (nodeInstance.afterExecute) {
      await nodeInstance.afterExecute(outputs, config, context);
    }

    // 保存输出到 DataBus
    dataBus.setNodeOutput(id, outputs);

    this.emitEvent("node-complete", {
      executionId: context.executionId,
      nodeId: id,
      status: "success",
      outputs,
    });

    return outputs;
  }

  /**
   * 拓扑排序 (Kahn 算法)
   */
  private topologicalSort(
    nodes: WorkflowNode[],
    edges: Array<{ source: string; target: string }>,
  ): WorkflowNode[] | null {
    // 计算每个节点的入度
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    for (const node of nodes) {
      inDegree.set(node.id, 0);
      adjList.set(node.id, []);
    }

    for (const edge of edges) {
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      adjList.get(edge.source)!.push(edge.target);
    }

    // 找到所有入度为 0 的节点
    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    const sorted: WorkflowNode[] = [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      sorted.push(nodeMap.get(nodeId)!);

      for (const neighbor of adjList.get(nodeId)!) {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    // 检查是否存在循环
    if (sorted.length !== nodes.length) {
      return null;
    }

    return sorted;
  }

  /**
   * 构建执行层级 - 用于并行执行
   */
  private buildExecutionLevels(
    sortedNodes: WorkflowNode[],
    edges: Array<{ source: string; target: string }>,
  ): WorkflowNode[][] {
    const levels: WorkflowNode[][] = [];
    const nodeLevel = new Map<string, number>();

    // 构建边映射
    const edgeMap = new Map<string, string[]>();
    for (const edge of edges) {
      if (!edgeMap.has(edge.source)) {
        edgeMap.set(edge.source, []);
      }
      edgeMap.get(edge.source)!.push(edge.target);
    }

    // 计算每个节点的层级
    for (const node of sortedNodes) {
      let maxPredLevel = -1;

      // 找到所有前置节点的最大层级
      for (const [source, targets] of edgeMap) {
        if (targets.includes(node.id)) {
          const predLevel = nodeLevel.get(source) ?? 0;
          maxPredLevel = Math.max(maxPredLevel, predLevel);
        }
      }

      const currentLevel = maxPredLevel + 1;
      nodeLevel.set(node.id, currentLevel);

      if (!levels[currentLevel]) {
        levels[currentLevel] = [];
      }
      levels[currentLevel].push(node);
    }

    return levels;
  }
}

// 全局单例
export const workflowExecutor = new WorkflowExecutor();
