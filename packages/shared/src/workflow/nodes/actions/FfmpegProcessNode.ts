import { burn } from "../../../task/video.js";
import { container } from "../../../index.js";
import { BaseNode } from "../base/BaseNode.js";
import type { PortDefinition } from "../../types.js";
import type { NodeExecutionContext } from "../base/BaseNode.js";
import { replaceExtName } from "../../../utils/index.js";

/**
 * FFmpeg 处理节点 - 执行视频转码等操作
 */
export class FfmpegProcessNode extends BaseNode {
  readonly type = "ffmpeg-process";
  readonly displayName = "FFmpeg 处理";
  readonly description = "使用 FFmpeg 处理视频";
  readonly category = "action" as const;

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
      name: "视频输入文件",
      type: "file",
      required: true,
      description: "要处理的视频文件路径",
    },
    {
      id: "inputAssFile",
      name: "ass输入文件",
      type: "file",
      required: true,
      description: "要处理的ass文件路径",
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
    console.log("FfmpegProcessNode execute", { inputs, config, context });
    const { inputFile, inputAssFile } = inputs;
    const { presetId, outputPath, options } = config;
    const ffmpegPreset = container.resolve("ffmpegPreset");
    const preset = await ffmpegPreset.get(presetId);
    if (!preset) {
      throw new Error("Can not found ffmpeg preset");
    }

    const output = outputPath || replaceExtName(inputFile, "_弹幕版.mp4");
    const task = await burn(
      {
        videoFilePath: inputFile,
        subtitleFilePath: inputAssFile,
      },
      output,
      {
        // @ts-ignore
        danmaOptions: {},
        ffmpegOptions: preset.config,
        hasHotProgress: false,
        override: false,
        removeOrigin: false,
      },
    );
    const outputFile = await new Promise((resolve, reject) => {
      task.on("task-end", () => {
        resolve(task.output);
      });
      task.on("task-error", (err) => {
        reject(err);
      });
    });

    return {
      outputFile: outputFile,
    };
  }
}
