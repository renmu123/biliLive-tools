import { BaseNode } from "../base/BaseNode.js";
import type { PortDefinition } from "../../types.js";
import type { NodeExecutionContext } from "../base/BaseNode.js";

/**
 * 弹幕转换节点 - XML 转 ASS
 */
export class DanmuConvertNode extends BaseNode {
  readonly type = "danmu-convert";
  readonly displayName = "弹幕转换";
  readonly description = "将 XML 弹幕转换为 ASS 格式";
  readonly category = "processor" as const;

  readonly configSchema = [
    {
      key: "presetId",
      label: "弹幕预设",
      type: "preset",
      presetType: "danmu",
      required: false,
      description: "选择弹幕转换预设",
      placeholder: "请选择预设",
    },
    {
      key: "outputPath",
      label: "输出路径",
      type: "file",
      required: false,
      description: "指定输出ASS文件路径（可选，留空自动生成）",
      placeholder: "留空自动生成",
    },
  ];

  readonly inputs: PortDefinition[] = [
    {
      id: "xmlFile",
      name: "XML 文件",
      type: "file",
      required: true,
      description: "弹幕 XML 文件路径",
    },
  ];

  readonly outputs: PortDefinition[] = [
    {
      id: "assFile",
      name: "ASS 文件",
      type: "file",
      required: true,
      description: "转换后的 ASS 文件路径",
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
    // 可以验证预设ID是否存在
    return true;
  }

  async execute(
    inputs: Record<string, any>,
    config: Record<string, any>,
    context: NodeExecutionContext,
  ): Promise<Record<string, any>> {
    const { xmlFile } = inputs;
    const { presetId, outputPath, options } = config;

    // TODO: 集成现有的弹幕转换任务
    // const task = new DanmuTask({ input: xmlFile, output: outputPath, presetId, ... });
    // const taskId = await taskQueue.addTask(task);

    return {
      assFile: outputPath || xmlFile.replace(/\.xml$/i, ".ass"),
      taskId: "mock-danmu-task-id",
    };
  }
}
