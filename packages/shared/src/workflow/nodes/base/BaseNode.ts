import type { PortDefinition } from "../../types.js";

export interface NodeExecutionContext {
  workflowId: string;
  executionId: string;
  nodeId: string;
  // 可以包含全局变量等
  variables?: Record<string, any>;
}

/**
 * 节点基类 - 所有工作流节点都需要继承此类
 */
export abstract class BaseNode {
  /**
   * 节点类型标识符 (唯一)
   */
  abstract readonly type: string;

  /**
   * 节点显示名称
   */
  abstract readonly displayName: string;

  /**
   * 节点描述
   */
  abstract readonly description: string;

  /**
   * 输入端口定义
   */
  abstract readonly inputs: PortDefinition[];

  /**
   * 输出端口定义
   */
  abstract readonly outputs: PortDefinition[];

  /**
   * 节点分类 (用于 UI 分组)
   */
  abstract readonly category: "trigger" | "processor" | "action" | "util";

  /**
   * 执行节点逻辑
   *
   * @param inputs - 输入数据，键为端口ID，值为数据
   * @param config - 节点配置，来自 WorkflowNode.data.config
   * @param context - 执行上下文
   * @returns 输出数据，键为端口ID，值为数据
   */
  abstract execute(
    inputs: Record<string, any>,
    config: Record<string, any>,
    context: NodeExecutionContext,
  ): Promise<Record<string, any>>;

  /**
   * 验证节点配置是否有效
   *
   * @param config - 要验证的配置
   * @returns 验证通过返回 true，否则返回错误消息
   */
  validate(config: Record<string, any>): true | string {
    // 默认不验证，子类可覆盖
    return true;
  }

  /**
   * 在节点执行前调用 (钩子)
   */
  async beforeExecute?(
    inputs: Record<string, any>,
    config: Record<string, any>,
    context: NodeExecutionContext,
  ): Promise<void>;

  /**
   * 在节点执行后调用 (钩子)
   */
  async afterExecute?(
    outputs: Record<string, any>,
    config: Record<string, any>,
    context: NodeExecutionContext,
  ): Promise<void>;

  /**
   * 清理资源 (例如临时文件)
   */
  async cleanup?(context: NodeExecutionContext): Promise<void>;
}
