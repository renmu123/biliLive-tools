import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAll: vi.fn(),
  query: vi.fn(),
  update: vi.fn(),
}));

vi.mock("../../src/config.js", () => ({
  appConfig: {
    getAll: mocks.getAll,
  },
}));

vi.mock("../../src/db/index.js", () => ({
  recordHistoryService: {
    query: mocks.query,
    update: mocks.update,
  },
}));

vi.mock("../../src/utils/log.js", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("exportExistingLiveSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query.mockReturnValue({
      id: 38,
      title: "直播标题",
      record_start_time: 1781105107602,
      ai_summary: "已经生成的总结",
      streamer: {
        name: "主播",
        room_id: "123",
        platform: "Bilibili",
      },
    });
    mocks.getAll.mockReturnValue({
      ai: {
        liveSummary: {
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
      },
    });
  });

  it("keeps an existing summary when re-export fails", async () => {
    const { exportExistingLiveSummary } = await import("../../src/task/liveSummary.js");

    await expect(exportExistingLiveSummary(38)).rejects.toThrow("总结已生成，但导出失败");

    expect(mocks.query).toHaveBeenCalledWith({
      id: 38,
      include: {
        streamer: true,
      },
    });
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 38,
        ai_summary_status: "error",
        ai_summary: "已经生成的总结",
      }),
    );
    expect(mocks.update.mock.calls[0][0].ai_summary_error).toContain("总结已生成，但导出失败");
  });
});
