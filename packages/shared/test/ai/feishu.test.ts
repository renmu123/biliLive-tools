import { describe, expect, it } from "vitest";

import { extractFeishuDocumentId, markdownToFeishuBlocks } from "../../src/ai/feishu.js";

describe("feishu doc helpers", () => {
  it("extracts document id from docx url", () => {
    expect(extractFeishuDocumentId("https://example.feishu.cn/docx/AbCdEf123?from=from_copylink")).toBe(
      "AbCdEf123",
    );
    expect(extractFeishuDocumentId("AbCdEf123")).toBe("AbCdEf123");
  });

  it("converts common markdown lines to doc blocks", () => {
    const blocks = markdownToFeishuBlocks(`# 标题

- 要点一
1. 步骤一
普通段落
第二行`);

    expect(blocks.map((item) => item.block_type)).toEqual([3, 12, 13, 2]);
    expect(blocks[3].text).toEqual({
      elements: [
        {
          text_run: {
            content: "普通段落\n第二行",
          },
        },
      ],
    });
  });
});
