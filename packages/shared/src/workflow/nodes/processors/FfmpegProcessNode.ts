import { BaseNode } from "../base/BaseNode.js";
import type { PortDefinition } from "../../types.js";
import type { NodeExecutionContext } from "../base/BaseNode.js";

/**
 * FFmpeg 处理节点 - 执行视频转码等操作
 */
export class FfmpegProcessNode extends BaseNode {
  readonly type = "ffmpeg-process";
  readonly displayName = "FFmpeg 处理";
  readonly description = "使用 FFmpeg 处理视频";
  readonly category = "processor" as const;

  readonly configSchema = [
    {
      key: "presetId",
      label: "预设",
      type: "preset",
      presetType: "ffmpeg",
      required: false,
      description: "选择 FFmpeg 预设",
      placeholder: "请选择预设",
    },
    {
      key: "outputPath",
      label: "输出路径",
      type: "file",
      required: false,
      description: "指定输出文件路径（可选，留空自动生成）",
      placeholder: "留空自动生成",
    },
  ];

  readonly inputs: PortDefinition[] = [
    {
      id: "inputFile",
      name: "输入文件",
      type: "file",
      required: true,
      description: "要处理的视频文件路径",
    },
  ];

  readonly outputs: PortDefinition[] = [
    {
      id: "outputFile",
      name: "输出文件",
      type: "file",
      required: true,
      description: "处理后的视频文件路径",
    },
    // {
    //   id: "taskId",
    //   name: "任务ID",
    //   type: "string",
    //   required: false,
    //   description: "关联的任务ID",
    // },
  ];

  validate(config: Record<string, any>): true | string {
    if (!config.presetId && !config.outputPath) {
      return "必须指定预设ID或输出路径";
    }
    return true;
  }

  async execute(
    inputs: Record<string, any>,
    config: Record<string, any>,
    context: NodeExecutionContext,
  ): Promise<Record<string, any>> {
    const { inputFile } = inputs;
    const { presetId, outputPath, options } = config;

    // TODO: 集成现有的 FFmpeg 任务系统
    // 这需要导入 taskQueue 和相关配置
    // const task = new FfmpegTask({ input: inputFile, output: outputPath, ... });
    // const taskId = await taskQueue.addTask(task);

    // 暂时返回模拟数据
    return {
      outputFile: outputPath || inputFile.replace(/\.[^.]+$/, "_processed.mp4"),
      taskId: "mock-task-id",
    };
  }
}
