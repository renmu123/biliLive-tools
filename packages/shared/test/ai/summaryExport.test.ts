import { beforeEach, describe, expect, it, vi } from "vitest";

const logger = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}));

const axiosMocks = vi.hoisted(() => {
  const client = {
    post: vi.fn(),
    patch: vi.fn(),
    request: vi.fn(),
  };
  return {
    client,
    create: vi.fn(() => client),
  };
});

vi.mock("../../src/utils/log.js", () => ({
  default: logger,
}));

vi.mock("axios", () => ({
  default: {
    create: axiosMocks.create,
    isAxiosError: vi.fn(() => false),
  },
}));

import {
  buildFeishuDocumentUrl,
  buildLiveSummaryNotification,
  buildNotionPageUrl,
  buildSummaryExportMarkdown,
  buildSummaryExportTitle,
  getEnabledSummaryExportTargetNames,
} from "../../src/ai/summaryExport.js";

describe("summary export helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axiosMocks.client.post.mockReset();
    axiosMocks.client.patch.mockReset();
    axiosMocks.client.request.mockReset();
  });

  it("builds shared export markdown with metadata", () => {
    expect(
      buildSummaryExportMarkdown("总结内容", {
        title: "直播标题",
        streamer: "主播",
        platform: "Bilibili",
        roomId: "123",
      }),
    ).toContain("- 主播：主播");
  });

  it("builds export title from room and record time", () => {
    expect(
      buildSummaryExportTitle(
        {
          streamer: "主播",
          roomId: "123",
          recordStartTime: new Date("2026-06-09T13:30:00+08:00").getTime(),
        },
        "",
      ),
    ).toBe("主播 - 2026-06-09 13:30");
  });

  it("builds document links for notification content", () => {
    expect(buildFeishuDocumentUrl("doccnABC123")).toBe("https://feishu.cn/docx/doccnABC123");
    expect(buildNotionPageUrl("01234567-89ab-cdef-0123-456789abcdef")).toBe(
      "https://www.notion.so/0123456789abcdef0123456789abcdef",
    );
  });

  it("builds live summary notification with exported document links", () => {
    expect(
      buildLiveSummaryNotification(
        {
          title: "直播标题",
          streamer: "主播",
          platform: "Bilibili",
          roomId: "123",
        },
        [
          { target: "feishu", name: "飞书文档", url: "https://feishu.cn/docx/doccnABC123" },
          { target: "notion", name: "Notion", url: "https://www.notion.so/0123" },
        ],
      ),
    ).toEqual({
      title: "直播总结已生成：直播标题",
      desp: [
        "主播：主播",
        "直播标题：直播标题",
        "平台：Bilibili",
        "房间号：123",
        "",
        "飞书文档：https://feishu.cn/docx/doccnABC123",
        "Notion：https://www.notion.so/0123",
      ].join("\n"),
    });
  });

  it("keeps legacy feishu config readable", () => {
    expect(
      getEnabledSummaryExportTargetNames({
        enabled: true,
        prompt: "",
        maxInputLength: 24000,
        saveTranscript: true,
        exportTargets: {
          feishu: {
            enabled: false,
            appId: "",
            appSecret: "",
            documentId: "",
          },
          notion: {
            enabled: false,
            token: "",
            pageId: "",
          },
        },
        feishu: {
          enabled: true,
          appId: "cli_xxx",
          appSecret: "secret",
          documentId: "doc",
        },
      }),
    ).toEqual(["飞书文档"]);
  });

  it("logs target export failures", async () => {
    const { exportSummaryToTargets } = await import("../../src/ai/summaryExport.js");

    await expect(
      exportSummaryToTargets(
        "总结内容",
        { title: "直播标题" },
        {
          enabled: true,
          prompt: "",
          maxInputLength: 24000,
          saveTranscript: true,
          exportTargets: {
            feishu: {
              enabled: true,
              mode: "append",
              appId: "",
              appSecret: "",
              documentId: "",
              folderToken: "",
              titleTemplate: "",
            },
            notion: {
              enabled: false,
              token: "",
              pageId: "",
            },
          },
        },
      ),
    ).rejects.toThrow("总结已生成，但导出失败");

    expect(logger.info).toHaveBeenCalledWith(
      "开始导出直播总结到飞书文档",
      expect.objectContaining({ title: "直播标题" }),
    );
    expect(logger.error).toHaveBeenCalledWith("导出直播总结到飞书文档失败", expect.any(Error));
  });

  it("returns exported document links", async () => {
    const { exportSummaryToTargets } = await import("../../src/ai/summaryExport.js");

    axiosMocks.client.post.mockResolvedValueOnce({
      data: {
        code: 0,
        tenant_access_token: "tenant-token",
        expire: 7200,
      },
    });
    axiosMocks.client.request.mockResolvedValue({
      data: {
        code: 0,
        msg: "ok",
      },
    });
    axiosMocks.client.patch.mockResolvedValue({ data: {} });

    await expect(
      exportSummaryToTargets(
        "总结内容",
        { title: "直播标题" },
        {
          enabled: true,
          prompt: "",
          maxInputLength: 24000,
          saveTranscript: true,
          exportTargets: {
            feishu: {
              enabled: true,
              mode: "append",
              appId: "cli_xxx",
              appSecret: "secret",
              documentId: "https://example.feishu.cn/docx/doccnABC123",
              folderToken: "",
              titleTemplate: "",
            },
            notion: {
              enabled: true,
              mode: "append",
              token: "secret_xxx",
              pageId: "https://www.notion.so/Live-Summary-0123456789abcdef0123456789abcdef",
              titleTemplate: "",
            },
          },
        },
      ),
    ).resolves.toEqual([
      {
        target: "feishu",
        name: "飞书文档",
        documentId: "doccnABC123",
        url: "https://feishu.cn/docx/doccnABC123",
        mode: "append",
      },
      {
        target: "notion",
        name: "Notion",
        pageId: "01234567-89ab-cdef-0123-456789abcdef",
        url: "https://www.notion.so/0123456789abcdef0123456789abcdef",
        mode: "append",
      },
    ]);
  });

  it("validates feishu create mode folder token", async () => {
    const { exportSummaryToTargets } = await import("../../src/ai/summaryExport.js");

    await expect(
      exportSummaryToTargets(
        "总结内容",
        { streamer: "主播", roomId: "123" },
        {
          enabled: true,
          prompt: "",
          maxInputLength: 24000,
          saveTranscript: true,
          exportTargets: {
            feishu: {
              enabled: true,
              mode: "create",
              appId: "cli_xxx",
              appSecret: "secret",
              documentId: "",
              folderToken: "",
              titleTemplate: "",
            },
            notion: {
              enabled: false,
              token: "",
              pageId: "",
            },
          },
        },
      ),
    ).rejects.toThrow("飞书云空间文件夹 Token");
  });

  it("validates notion create child page mode parent page", async () => {
    const { exportSummaryToTargets } = await import("../../src/ai/summaryExport.js");

    await expect(
      exportSummaryToTargets(
        "总结内容",
        { streamer: "主播", roomId: "123" },
        {
          enabled: true,
          prompt: "",
          maxInputLength: 24000,
          saveTranscript: true,
          exportTargets: {
            feishu: {
              enabled: false,
              mode: "append",
              appId: "",
              appSecret: "",
              documentId: "",
              folderToken: "",
              titleTemplate: "",
            },
            notion: {
              enabled: true,
              mode: "create_child_page",
              token: "secret_xxx",
              pageId: "",
              titleTemplate: "",
            },
          },
        },
      ),
    ).rejects.toThrow("Notion Token 和父页面 ID/链接");
  });
});
