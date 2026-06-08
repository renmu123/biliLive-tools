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

import { buildSummaryExportMarkdown, getEnabledSummaryExportTargetNames } from "../../src/ai/summaryExport.js";

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
});
