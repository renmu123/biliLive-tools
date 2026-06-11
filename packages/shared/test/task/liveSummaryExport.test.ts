import { beforeEach, describe, expect, it, vi } from "vitest";

import { exportExistingLiveSummaryWithDeps, type LiveSummaryExportDeps } from "../../src/task/liveSummaryExport.js";

const createDeps = (): LiveSummaryExportDeps => ({
  getRecord: vi.fn().mockReturnValue({
    id: 38,
    title: "直播标题",
    record_start_time: 1781105107602,
    ai_summary: "已经生成的总结",
    streamer: {
      name: "主播",
      room_id: "123",
      platform: "Bilibili",
    },
  }),
  getSummaryConfig: vi.fn().mockReturnValue({
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
  }),
  getEnabledTargetNames: vi.fn().mockReturnValue(["飞书文档"]),
  exportSummary: vi.fn().mockRejectedValue(new Error("总结已生成，但导出失败：飞书文档：no folder permission")),
  updateRecord: vi.fn(),
  logSuccess: vi.fn(),
});

describe("exportExistingLiveSummaryWithDeps", () => {
  let deps: LiveSummaryExportDeps;

  beforeEach(() => {
    deps = createDeps();
  });

  it("keeps an existing summary when re-export fails", async () => {
    await expect(exportExistingLiveSummaryWithDeps(38, deps)).rejects.toThrow("总结已生成，但导出失败");

    expect(deps.getRecord).toHaveBeenCalledWith(38);
    expect(deps.exportSummary).toHaveBeenCalledWith(
      "已经生成的总结",
      expect.objectContaining({
        title: "直播标题",
        streamer: "主播",
        roomId: "123",
        platform: "Bilibili",
        recordStartTime: 1781105107602,
      }),
      expect.any(Object),
    );
    expect(deps.updateRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 38,
        ai_summary_status: "error",
        ai_summary: "已经生成的总结",
      }),
    );
    expect(vi.mocked(deps.updateRecord).mock.calls[0][0].ai_summary_error).toContain("总结已生成，但导出失败");
  });
});
