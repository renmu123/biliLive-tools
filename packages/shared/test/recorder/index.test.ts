import { EventEmitter } from "node:events";

import { beforeEach, describe, expect, it, vi } from "vitest";

const fakeManager = Object.assign(new EventEmitter(), {
  autoCheckInterval: 0,
  maxThreadCount: 0,
  waitTime: 0,
  savePathRule: "",
  biliBatchQuery: false,
  recordRetryImmediately: false,
  providerCheckConfig: {},
  isCheckLoopRunning: false,
  recorders: [],
  startCheckLoop: vi.fn(),
  stopCheckLoop: vi.fn(),
  getRecorder: vi.fn(),
  addRecorder: vi.fn(),
});

const updateLiveMock = vi.fn();
const recordHistoryMock = {
  addWithStreamer: vi.fn(),
  upadteLive: updateLiveMock,
  getRecord: vi.fn(),
  getLastRecordTimesByChannels: vi.fn(() => []),
};

class MockRecorderConfig {
  constructor(_appConfig: unknown) {}

  get = vi.fn(() => undefined);

  list = vi.fn(() => []);
}

vi.mock("@bililive-tools/douyu-recorder", () => ({ provider: { id: "douyu" } }));
vi.mock("@bililive-tools/huya-recorder", () => ({ provider: { id: "huya" } }));
vi.mock("@bililive-tools/bilibili-recorder", () => ({ provider: { id: "bilibili" } }));
vi.mock("@bililive-tools/douyin-recorder", () => ({ provider: { id: "douyin" } }));
vi.mock("@bililive-tools/xhs-recorder", () => ({ provider: { id: "xhs" } }));
vi.mock("@bililive-tools/manager", () => ({
  createRecorderManager: vi.fn(() => fakeManager),
  setFFMPEGPath: vi.fn(),
  setMesioPath: vi.fn(),
  setBililivePath: vi.fn(),
  utils: {
    replaceExtName: (file: string, ext: string) => file.replace(/\.[^.]+$/, ext),
  },
}));
vi.mock("../../src/recorder/recordHistory.js", () => ({
  default: recordHistoryMock,
}));
vi.mock("../../src/db/index.js", () => ({
  danmuService: {
    addMany: vi.fn(),
  },
}));
vi.mock("../../src/task/video.js", () => ({
  getBinPath: vi.fn(() => ({
    ffmpegPath: "ffmpeg",
    mesioPath: "mesio",
    bililiveRecorderPath: "bililive",
  })),
  readVideoMeta: vi.fn(async () => ({ format: { duration: 62.5 } })),
}));
vi.mock("../../src/utils/index.js", () => ({
  replaceExtName: vi.fn((file: string, ext: string) => file.replace(/\.[^.]+$/, ext)),
  calculateFileQuickHash: vi.fn(async () => "quick-hash"),
}));
vi.mock("../../src/notify.js", () => ({
  sendBySystem: vi.fn(),
  send: vi.fn(),
}));
vi.mock("../../src/danmu/index.js", () => ({
  danmaReport: vi.fn(),
  parseDanmu: vi.fn(),
}));
vi.mock("../../src/recorder/config.js", () => ({
  default: MockRecorderConfig,
}));
vi.mock("../../src/utils/log.js", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));
vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
    isAxiosError: vi.fn(() => false),
  },
  isAxiosError: vi.fn(() => false),
}));
vi.mock("fs-extra", () => ({
  default: {
    pathExists: vi.fn(async () => false),
    appendFileSync: vi.fn(),
  },
  pathExists: vi.fn(async () => false),
  appendFileSync: vi.fn(),
}));

describe("shared recorder videoFileCompleted", () => {
  beforeEach(() => {
    fakeManager.removeAllListeners();
    updateLiveMock.mockReset();
  });

  it("should persist danma_stats_json from liveManager stats", async () => {
    const { createRecorderManager } = await import("../../src/recorder/index.js");
    const appConfig = {
      getAll: () => ({
        port: 18010,
        recorder: {
          savePath: "records",
          nameRule: "{title}",
          autoRecord: false,
          saveDanma2DB: false,
          recordRetryImmediately: false,
          bilibili: {},
          douyu: {},
          huya: {},
          douyin: {},
          xhs: {},
        },
        notification: {
          setting: {},
          taskNotificationType: {},
        },
      }),
      on: vi.fn(),
    } as any;

    await createRecorderManager(appConfig);

    fakeManager.emit("videoFileCompleted", {
      recorder: {
        id: "recorder-1",
        providerId: "Bilibili",
        channelId: "1000",
        liveInfo: {
          title: "live title",
          owner: "主播",
          liveId: "live-1",
        },
      },
      filename: "C:/records/test.ts",
      stats: {
        danmaNum: 4,
        uniqMember: 3,
        scNum: 0,
        guardNum: 0,
        danmaStats: {
          danmaTimeline: {
            interval: 5,
            data: [2, 1, 1],
          },
        },
      },
    });

    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));

    expect(updateLiveMock).toHaveBeenCalledWith(
      {
        video_file: "C:/records/test.ts",
        live_id: "live-1",
      },
      expect.objectContaining({
        danma_num: 4,
        interact_num: 3,
        danma_stats_json: JSON.stringify({
          danmaTimeline: {
            interval: 5,
            data: [2, 1, 1],
          },
        }),
      }),
    );
  });
});
