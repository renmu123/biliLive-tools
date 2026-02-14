import type { WorkflowEdge } from "../types.js";
import logger from "../../utils/log.js";

/**
 * 数据总线 - 管理节点间的数据流转
 */
export class DataBus {
  // 存储每个节点的输出数据: nodeId -> { portId: data }
  private nodeOutputs: Map<string, Record<string, any>> = new Map();

  // 存储边的连接关系: sourceNodeId -> edges[]
  private edgeMap: Map<string, WorkflowEdge[]> = new Map();

  constructor(edges: WorkflowEdge[]) {
    this.buildEdgeMap(edges);
  }

  /**
   * 构建边映射表
   */
  private buildEdgeMap(edges: WorkflowEdge[]): void {
    for (const edge of edges) {
      if (!this.edgeMap.has(edge.source)) {
        this.edgeMap.set(edge.source, []);
      }
      this.edgeMap.get(edge.source)!.push(edge);
    }
  }

  /**
   * 设置节点的输出数据
   */
  setNodeOutput(nodeId: string, outputs: Record<string, any>): void {
    this.nodeOutputs.set(nodeId, outputs);
    logger.debug(`DataBus: 节点 ${nodeId} 输出数据:`, outputs);
  }

  /**
   * 获取节点的输出数据
   */
  getNodeOutput(nodeId: string): Record<string, any> | undefined {
    return this.nodeOutputs.get(nodeId);
  }

  /**
   * 为目标节点收集输入数据
   *
   * @param targetNodeId 目标节点ID
   * @returns 组装好的输入数据 { portId: data }
   */
  collectInputsForNode(targetNodeId: string): Record<string, any> {
    const inputs: Record<string, any> = {};

    // 遍历所有边，找到指向目标节点的边
    for (const edges of this.edgeMap.values()) {
      for (const edge of edges) {
        if (edge.target !== targetNodeId) continue;

        const sourceOutput = this.nodeOutputs.get(edge.source);
        if (!sourceOutput) {
          logger.warn(
            `DataBus: 源节点 ${edge.source} 尚未产生输出数据，目标节点 ${targetNodeId} 输入可能不完整`,
          );
          continue;
        }

        // 确定源端口（如果没有指定，尝试使用默认或第一个输出）
        const sourcePortId = edge.sourceHandle || Object.keys(sourceOutput)[0];
        const targetPortId = edge.targetHandle || sourcePortId;

        if (sourceOutput[sourcePortId] !== undefined) {
          inputs[targetPortId] = sourceOutput[sourcePortId];
        } else {
          logger.warn(`DataBus: 源节点 ${edge.source} 的输出端口 ${sourcePortId} 没有数据`);
        }
      }
    }

    logger.debug(`DataBus: 为节点 ${targetNodeId} 收集的输入:`, inputs);
    return inputs;
  }

  /**
   * 检查节点的所有前置节点是否已完成
   */
  arePredecessorsComplete(nodeId: string, completedNodes: Set<string>): boolean {
    for (const edges of this.edgeMap.values()) {
      for (const edge of edges) {
        if (edge.target === nodeId && !completedNodes.has(edge.source)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * 获取节点的所有前置节点
   */
  getPredecessors(nodeId: string): string[] {
    const predecessors: string[] = [];

    for (const edges of this.edgeMap.values()) {
      for (const edge of edges) {
        if (edge.target === nodeId && !predecessors.includes(edge.source)) {
          predecessors.push(edge.source);
        }
      }
    }

    return predecessors;
  }

  /**
   * 获取节点的所有后继节点
   */
  getSuccessors(nodeId: string): string[] {
    const edges = this.edgeMap.get(nodeId) || [];
    return edges.map((edge) => edge.target);
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.nodeOutputs.clear();
  }

  /**
   * 获取所有节点的输出数据（用于日志记录）
   */
  getAllOutputs(): Record<string, Record<string, any>> {
    const result: Record<string, Record<string, any>> = {};
    for (const [nodeId, outputs] of this.nodeOutputs) {
      result[nodeId] = outputs;
    }
    return result;
  }
}
