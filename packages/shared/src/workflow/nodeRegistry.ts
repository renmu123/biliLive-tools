import { BaseNode } from "./nodes/base/BaseNode.js";
import logger from "../utils/log.js";

/**
 * 节点注册表 - 管理所有可用的节点类型
 */
export class NodeRegistry {
  private nodes: Map<string, typeof BaseNode> = new Map();

  /**
   * 注册一个节点类型
   */
  register(NodeClass: typeof BaseNode): void {
    const instance = new (NodeClass as any)() as BaseNode;
    const type = instance.type;

    if (this.nodes.has(type)) {
      logger.warn(`节点类型 "${type}" 已存在，将被覆盖`);
    }

    this.nodes.set(type, NodeClass);
    logger.info(`注册节点类型: ${type} (${instance.displayName})`);
  }

  /**
   * 批量注册节点
   */
  registerMany(NodeClasses: Array<typeof BaseNode>): void {
    for (const NodeClass of NodeClasses) {
      this.register(NodeClass);
    }
  }

  /**
   * 获取节点实例
   */
  getNode(type: string): BaseNode | null {
    const NodeClass = this.nodes.get(type);
    if (!NodeClass) {
      logger.error(`未找到节点类型: ${type}`);
      return null;
    }

    return new (NodeClass as any)() as BaseNode;
  }

  /**
   * 检查节点类型是否存在
   */
  has(type: string): boolean {
    return this.nodes.has(type);
  }

  /**
   * 获取所有已注册的节点类型
   */
  getAllTypes(): string[] {
    return Array.from(this.nodes.keys());
  }

  /**
   * 获取所有节点的元数据 (用于 UI 显示)
   */
  getAllMetadata(): Array<{
    type: string;
    displayName: string;
    description: string;
    category: string;
    inputs: any[];
    outputs: any[];
  }> {
    const metadata: any[] = [];

    for (const [type, NodeClass] of this.nodes) {
      const instance = new (NodeClass as any)() as BaseNode;
      metadata.push({
        type: instance.type,
        displayName: instance.displayName,
        description: instance.description,
        category: instance.category,
        inputs: instance.inputs,
        outputs: instance.outputs,
      });
    }

    return metadata;
  }

  /**
   * 按分类获取节点
   */
  getByCategory(category: string): Array<{
    type: string;
    displayName: string;
    description: string;
  }> {
    const nodes: any[] = [];

    for (const NodeClass of this.nodes.values()) {
      const instance = new (NodeClass as any)() as BaseNode;
      if (instance.category === category) {
        nodes.push({
          type: instance.type,
          displayName: instance.displayName,
          description: instance.description,
        });
      }
    }

    return nodes;
  }
}

// 全局单例
export const nodeRegistry = new NodeRegistry();
