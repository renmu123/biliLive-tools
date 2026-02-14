import { BaseNode } from "../base/BaseNode.js";
import type { PortDefinition } from "../../types.js";
import type { NodeExecutionContext } from "../base/BaseNode.js";

/**
 * 文件输入节点 - 作为工作流的起始节点
 */
export class FileInputNode extends BaseNode {
  readonly type = "file-input";
  readonly displayName = "文件输入";
  readonly description = "指定输入文件路径";
  readonly category = "trigger" as const;

  readonly configSchema = [
    {
      key: "filePath",
      label: "文件路径",
      type: "file",
      required: true,
      description: "选择要处理的文件",
      placeholder: "请选择文件",
    },
  ];

  readonly inputs: PortDefinition[] = [];

  readonly outputs: PortDefinition[] = [
    {
      id: "filePath",
      name: "文件路径",
      type: "file",
      required: true,
      description: "输出文件的完整路径",
    },
  ];

  validate(config: Record<string, any>): true | string {
    if (!config.filePath || typeof config.filePath !== "string") {
      return "必须指定文件路径";
    }
    return true;
  }

  async execute(
    inputs: Record<string, any>,
    config: Record<string, any>,
    context: NodeExecutionContext,
  ): Promise<Record<string, any>> {
    const { filePath } = config;
    const output: Record<string, any> = {
      filePath,
    };
    // if (filePath.endsWith(".xml")) {
    //   output.xmlFile = filePath;
    // }
    // if (filePath.endsWith(".ass")) {
    //   output.assFile = filePath;
    // }
    // if (
    //   filePath.endsWith(".mp4") ||
    //   filePath.endsWith(".mkv") ||
    //   filePath.endsWith(".flv") ||
    //   filePath.endsWith(".ts") ||
    //   filePath.endsWith(".m4s")
    // ) {
    //   output.videoFile = filePath;
    // }

    // console.log("FileInputNode output:", output);

    return output;
  }
}
