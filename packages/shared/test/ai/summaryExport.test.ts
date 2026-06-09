import { beforeEach, describe, expect, it, vi } from "vitest";

const logger = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}));

vi.mock("../../src/utils/log.js", () => ({
  default: logger,
}));

import {
  buildSummaryExportMarkdown,
  buildSummaryExportTitle,
  getEnabledSummaryExportTargetNames,
} from "../../src/ai/summaryExport.js";

describe("summary export helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(logger.error).toHaveBeenCalledWith(
      "导出直播总结到飞书文档失败",
      expect.any(Error),
    );
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
