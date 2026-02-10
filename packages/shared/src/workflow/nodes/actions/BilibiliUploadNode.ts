import { BaseNode } from "../base/BaseNode.js";
import type { PortDefinition } from "../../types.js";
import type { NodeExecutionContext } from "../base/BaseNode.js";

/**
 * B站上传节点
 */
export class BilibiliUploadNode extends BaseNode {
  readonly type = "bilibili-upload";
  readonly displayName = "B站上传";
  readonly description = "上传视频到哔哩哔哩";
  readonly category = "action" as const;

  readonly inputs: PortDefinition[] = [
    {
      id: "videoFile",
      name: "视频文件",
      type: "file",
      required: true,
      description: "要上传的视频文件路径",
    },
    {
      id: "cover",
      name: "封面图片",
      type: "file",
      required: false,
      description: "视频封面图片路径（可选）",
    },
    {
      id: "title",
      name: "标题",
      type: "string",
      required: false,
      description: "视频标题（可选，使用预设中的配置）",
    },
  ];

  readonly outputs: PortDefinition[] = [
    {
      id: "bvid",
      name: "BV号",
      type: "string",
      required: false,
      description: "上传成功后的视频BV号",
    },
    {
      id: "success",
      name: "上传结果",
      type: "boolean",
      required: true,
      description: "是否上传成功",
    },
    {
      id: "taskId",
      name: "任务ID",
      type: "string",
      required: false,
      description: "关联的任务ID",
    },
  ];

  validate(config: Record<string, any>): true | string {
    if (!config.presetId) {
      return "必须指定上传预设ID";
    }
    return true;
  }

  async execute(
    inputs: Record<string, any>,
    config: Record<string, any>,
    context: NodeExecutionContext,
  ): Promise<Record<string, any>> {
    const { videoFile, cover, title } = inputs;
    const { presetId, options } = config;

    // TODO: 集成现有的上传任务
    // const task = new BiliUploadTask({ videoPath: videoFile, cover, presetId, ... });
    // const taskId = await taskQueue.addTask(task);

    return {
      bvid: "BV1xx411c7mD", // 模拟数据
      success: true,
      taskId: "mock-upload-task-id",
    };
  }
}
