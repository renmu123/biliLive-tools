import { describe, expect, it } from "vitest";

import {
  buildNotionChildPagePayload,
  extractNotionPageId,
  formatNotionError,
  markdownToNotionBlocks,
} from "../../src/ai/notion.js";

describe("notion helpers", () => {
  it("extracts page id from notion url", () => {
    expect(
      extractNotionPageId("https://www.notion.so/workspace/Live-Summary-0123456789abcdef0123456789abcdef?pvs=4"),
    ).toBe("01234567-89ab-cdef-0123-456789abcdef");
    expect(extractNotionPageId("01234567-89ab-cdef-0123-456789abcdef")).toBe(
      "01234567-89ab-cdef-0123-456789abcdef",
    );
  });

  it("converts common markdown lines to notion blocks", () => {
    const blocks = markdownToNotionBlocks(`# 标题

- 要点一
1. 步骤一
普通段落
第二行`);

    expect(blocks.map((item) => item.type)).toEqual([
      "heading_1",
      "bulleted_list_item",
      "numbered_list_item",
      "paragraph",
    ]);
    expect(blocks[3].paragraph).toEqual({
      rich_text: [
        {
          type: "text",
          text: {
            content: "普通段落\n第二行",
          },
        },
      ],
    });
  });

  it("formats Notion 404 into an actionable message", () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 404,
      },
    };

    expect(formatNotionError(error)).toBe(
      "Notion 页面不存在或当前 integration 无访问权限，请检查页面 ID/链接，并确认已将目标页面分享给该 integration",
    );
  });

  it("builds child page payload with parent page and title", () => {
    expect(buildNotionChildPagePayload("01234567-89ab-cdef-0123-456789abcdef", "主播 - 2026-06-09 13:30")).toEqual({
      parent: {
        page_id: "01234567-89ab-cdef-0123-456789abcdef",
      },
      properties: {
        title: {
          title: [
            {
              type: "text",
              text: {
                content: "主播 - 2026-06-09 13:30",
              },
            },
          ],
        },
      },
    });
  });
});
