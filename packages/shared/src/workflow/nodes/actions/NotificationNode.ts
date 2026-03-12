import { BaseNode } from "../base/BaseNode.js";
import type { PortDefinition } from "../../types.js";
import type { NodeExecutionContext } from "../base/BaseNode.js";

/**
 * 通知节点 - 发送通知消息
 */
export class NotificationNode extends BaseNode {
  readonly type = "notification";
  readonly displayName = "发送通知";
  readonly description = "通过配置的通知渠道发送消息";
  readonly category = "action" as const;

  readonly configSchema = [
    {
      key: "notifyOnSuccess",
      label: "成功时通知",
      type: "boolean",
      required: false,
      defaultValue: true,
      description: "工作流成功时是否发送通知",
    },
    {
      key: "notifyOnError",
      label: "错误时通知",
      type: "boolean",
      required: false,
      defaultValue: true,
      description: "工作流失败时是否发送通知",
    },
  ];

  readonly inputs: PortDefinition[] = [
    {
      id: "message",
      name: "消息内容",
      type: "string",
      required: true,
      description: "要发送的通知内容",
    },
    {
      id: "title",
      name: "标题",
      type: "string",
      required: false,
      description: "通知标题（可选）",
    },
  ];

  readonly outputs: PortDefinition[] = [
    {
      id: "success",
      name: "发送结果",
      type: "boolean",
      required: true,
      description: "通知是否发送成功",
    },
  ];

  validate(config: Record<string, any>): true | string {
    // 可以在这里验证是否配置了通知方式
    return true;
  }

  async execute(
    inputs: Record<string, any>,
    config: Record<string, any>,
    context: NodeExecutionContext,
  ): Promise<Record<string, any>> {
    const { message, title } = inputs;

    try {
      // TODO: 集成现有的通知系统
      // 这里需要导入项目中的通知服务
      // await sendNotification({ title, message, ...config });

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
      };
    }
  }
}
