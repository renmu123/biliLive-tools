import { BaseNode } from "../base/BaseNode.js";
import type { PortDefinition } from "../../types.js";
import type { NodeExecutionContext } from "../base/BaseNode.js";

/**
 * 并行分发节点 - 将输入数据分发到多个输出
 */
export class ParallelSplitNode extends BaseNode {
  readonly type = "parallel-split";
  readonly displayName = "并行分发";
  readonly description = "将数据同时输出到多个分支";
  readonly category = "util" as const;

  readonly inputs: PortDefinition[] = [
    {
      id: "input",
      name: "输入",
      type: "object",
      required: true,
      description: "要分发的数据",
    },
  ];

  readonly outputs: PortDefinition[] = [
    {
      id: "output1",
      name: "输出1",
      type: "object",
      required: true,
      description: "第一个输出分支",
    },
    {
      id: "output2",
      name: "输出2",
      type: "object",
      required: true,
      description: "第二个输出分支",
    },
    {
      id: "output3",
      name: "输出3",
      type: "object",
      required: false,
      description: "第三个输出分支（可选）",
    },
  ];

  async execute(
    inputs: Record<string, any>,
    config: Record<string, any>,
    context: NodeExecutionContext,
  ): Promise<Record<string, any>> {
    const { input } = inputs;

    // 将输入数据复制到所有输出
    return {
      output1: input,
      output2: input,
      output3: input,
    };
  }
}
