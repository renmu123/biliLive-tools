import { describe, expect, it } from "vitest";

import {
  extractFeishuDocumentId,
  extractFeishuFolderToken,
  formatFeishuError,
  markdownToFeishuBlocks,
} from "../../src/ai/feishu.js";

describe("feishu doc helpers", () => {
  it("extracts document id from docx url", () => {
    expect(extractFeishuDocumentId("https://example.feishu.cn/docx/AbCdEf123?from=from_copylink")).toBe(
      "AbCdEf123",
    );
    expect(extractFeishuDocumentId("AbCdEf123")).toBe("AbCdEf123");
  });

  it("extracts folder token from drive folder url", () => {
    expect(extractFeishuFolderToken("https://example.feishu.cn/drive/folder/fldAbCdEf123?from=from_copylink")).toBe(
      "fldAbCdEf123",
    );
    expect(extractFeishuFolderToken("fldAbCdEf123")).toBe("fldAbCdEf123");
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

  it("formats Feishu axios errors with status and response body", () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 403,
        data: {
          code: 99991663,
          msg: "Forbidden",
        },
      },
    };

    expect(formatFeishuError(error)).toBe("飞书 API 调用失败：HTTP 403，code 99991663，Forbidden");
  });
});
