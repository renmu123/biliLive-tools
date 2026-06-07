import { describe, expect, it } from "vitest";

import { buildSummaryExportMarkdown, getEnabledSummaryExportTargetNames } from "../../src/ai/summaryExport.js";

describe("summary export helpers", () => {
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
});
