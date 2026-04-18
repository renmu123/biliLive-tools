import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createDownloader: vi.fn(),
  getInfo: vi.fn(),
  getStream: vi.fn(),
}));

vi.mock("../src/stream.js", () => ({
  getInfo: mocks.getInfo,
  getStream: mocks.getStream,
}));

vi.mock("../src/utils.js", () => ({
  ensureFolderExist: vi.fn(),
  singleton: <T>(fn: T) => fn,
}));

vi.mock("@bililive-tools/manager", () => ({
  defaultFromJSON: vi.fn(),
  defaultToJSON: vi.fn(() => ({})),
  genRecorderUUID: vi.fn(() => "recorder-id"),
  genRecordUUID: vi.fn(() => "record-id"),
  createDownloader: mocks.createDownloader,
  utils: {
    checkTitleKeywordsWhileRecording: vi.fn().mockResolvedValue(false),
    checkTitleKeywordsBeforeRecord: vi.fn(() => false),
    shouldUseStrictQuality: vi.fn(() => false),
    singleton: <T>(fn: T) => fn,
  },
}));

vi.mock("douyin-danma-listener", () => {
  return {
    default: class MockDouYinDanmaClient {
      on() {
        return this;
      }
      connect() {
        return undefined;
      }
      close() {
        return undefined;
      }
    },
  };
});

import { provider } from "../src/index.js";

function mockLiveInfo(living: boolean) {
  mocks.getInfo.mockResolvedValue({
    living,
    owner: "主播",
    title: "标题",
    liveStartTime: new Date("2026-01-01T00:00:00.000Z"),
    recordStartTime: new Date("2026-01-01T00:00:00.000Z"),
    avatar: "avatar",
    cover: "cover",
    liveId: "live-id",
  });
}

function mockStream() {
  mocks.getStream.mockResolvedValue({
    currentStream: {
      name: "origin",
      source: "main",
      url: "https://example.com/live.flv",
      onlyAudio: false,
    },
    sources: [{ name: "main" }],
    streams: [{ desc: "origin" }],
    owner: "主播",
    title: "标题",
    cover: "cover",
    liveId: "live-id",
    avatar: "avatar",
  });
}

function createMockDownloader() {
  return {
    type: "ffmpeg",
    on: vi.fn(),
    run: vi.fn(),
    cut: vi.fn(),
    stop: vi.fn().mockResolvedValue(undefined),
    getArguments: vi.fn(() => ["-i", "https://example.com/live.flv"]),
    getExtraDataController: vi.fn(() => ({
      addMessage: vi.fn(),
      setMeta: vi.fn(),
    })),
  };
}

function createDouyinRecorder(overrides: Record<string, unknown> = {}) {
  const recorder = provider.createRecorder({
    channelId: "123456",
    quality: "highest",
    streamPriorities: [],
    sourcePriorities: [],
    auth: "sessionid=abc",
    saveGiftDanma: false,
    disableProvideCommentsWhenRecording: true,
    ...overrides,
  } as any);

  recorder.cache = {
    get: vi.fn().mockResolvedValue(undefined),
    set: vi.fn().mockResolvedValue(undefined),
  } as any;

  return recorder;
}

describe("DouYin Cookie 应用状态矩阵", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createDownloader.mockReturnValue(createMockDownloader());
  });

  it("未录制（idle）时，即使手动触发检查也不应用 Cookie", async () => {
    mockLiveInfo(false);
    const recorder = createDouyinRecorder({ douyinCookieMode: "always" });

    const result = await recorder.checkLiveStatusAndRecord({
      getSavePath: () => "D:/tmp/out.mp4",
      isManualStart: true,
    });

    expect(result).toBeNull();
    expect(recorder.state).toBe("idle");
    expect(mocks.createDownloader).not.toHaveBeenCalled();
  });

  it("录制中 + always：应持续应用 Cookie（体现在下载器请求头）", async () => {
    mockLiveInfo(true);
    mockStream();
    const recorder = createDouyinRecorder({ douyinCookieMode: "always", auth: "sid=always" });

    await recorder.checkLiveStatusAndRecord({
      getSavePath: () => "D:/tmp/out.mp4",
    });

    expect(mocks.createDownloader).toHaveBeenCalledTimes(1);
    const downloaderOpts = mocks.createDownloader.mock.calls[0][1];
    expect(downloaderOpts.headers.Cookie).toBe("sid=always");
    expect(recorder.state).toBe("recording");
  });

  it("录制中 + only-save-gift + saveGift 关闭：不应应用 Cookie", async () => {
    mockLiveInfo(true);
    mockStream();
    const recorder = createDouyinRecorder({
      douyinCookieMode: "only-save-gift",
      saveGiftDanma: false,
      auth: "sid=gift-off",
    });

    await recorder.checkLiveStatusAndRecord({
      getSavePath: () => "D:/tmp/out.mp4",
    });

    expect(mocks.createDownloader).toHaveBeenCalledTimes(1);
    const downloaderOpts = mocks.createDownloader.mock.calls[0][1];
    expect(downloaderOpts.headers.Cookie).toBeUndefined();
  });

  it("录制中 + only-save-gift + saveGift 开启：应应用 Cookie", async () => {
    mockLiveInfo(true);
    mockStream();
    const recorder = createDouyinRecorder({
      douyinCookieMode: "only-save-gift",
      saveGiftDanma: true,
      auth: "sid=gift-on",
    });

    await recorder.checkLiveStatusAndRecord({
      getSavePath: () => "D:/tmp/out.mp4",
    });

    expect(mocks.createDownloader).toHaveBeenCalledTimes(1);
    const downloaderOpts = mocks.createDownloader.mock.calls[0][1];
    expect(downloaderOpts.headers.Cookie).toBe("sid=gift-on");
  });

  it("录制结束后：应清除 Cookie 应用状态（不再处于已应用态）", async () => {
    mockLiveInfo(true);
    mockStream();
    const recorder = createDouyinRecorder({
      douyinCookieMode: "always",
      auth: "sid=stop-clear",
    });

    await recorder.checkLiveStatusAndRecord({
      getSavePath: () => "D:/tmp/out.mp4",
    });
    expect(recorder.state).toBe("recording");
    expect(recorder.recordHandle).toBeDefined();

    await recorder.recordHandle?.stop("manual stop");

    expect(recorder.state).toBe("idle");
    expect(recorder.recordHandle).toBeUndefined();
  });
});
