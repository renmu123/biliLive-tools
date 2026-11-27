import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  songRecognize: vi.fn(),
  addExtractAudioTask: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@biliLive-tools/shared/musicDetector/index.js", () => ({
  songRecognize: mocks.songRecognize,
}));
vi.mock("@biliLive-tools/shared/musicDetector/subtitle.js", () => ({ subtitleRecognize: vi.fn() }));
vi.mock("@biliLive-tools/shared/utils/index.js", () => ({
  getTempPath: () => "temp",
  uuid: () => "audio",
}));
vi.mock("@biliLive-tools/shared/task/video.js", () => ({
  addExtractAudioTask: mocks.addExtractAudioTask,
}));
vi.mock("@biliLive-tools/shared/config.js", () => ({ appConfig: {} }));
vi.mock("fs-extra", () => ({ default: { remove: mocks.remove } }));

import router from "../src/routes/ai.js";

const handler = router.stack.find((route) => route.path === "/ai/song-recognize")!.stack[0];

beforeEach(() => {
  vi.resetAllMocks();
  mocks.addExtractAudioTask.mockImplementation(async () => {
    const task = Object.assign(new EventEmitter(), { output: "temp/audio.mp3" });
    setTimeout(() => task.emit("task-end"), 0);
    return task;
  });
  mocks.songRecognize.mockResolvedValue({ name: "歌曲" });
  mocks.remove.mockResolvedValue(undefined);
});

function createContext(mode?: string) {
  return {
    request: { body: { file: "video.mp4", startTime: 30, endTime: 75, mode } },
    body: undefined,
    status: 200,
  } as any;
}

describe("POST /ai/song-recognize", () => {
  it.each(["name", "lyrics", undefined])("转发识别模式 %s 并清理临时音频", async (mode) => {
    const ctx = createContext(mode);

    await handler(ctx, async () => {});

    expect(mocks.songRecognize).toHaveBeenCalledWith("temp/audio.mp3", 30, mode ?? "name");
    expect(mocks.remove).toHaveBeenCalledWith("temp/audio.mp3");
    expect(ctx.body).toEqual({ name: "歌曲" });
  });

  it("拒绝无效模式，不提取音频", async () => {
    const ctx = createContext("invalid");

    await handler(ctx, async () => {});

    expect(ctx.status).toBe(400);
    expect(mocks.addExtractAudioTask).not.toHaveBeenCalled();
    expect(mocks.songRecognize).not.toHaveBeenCalled();
  });

  it("识别抛出异常时仍清理临时音频", async () => {
    mocks.songRecognize.mockRejectedValue(new Error("识别失败"));

    await expect(handler(createContext("lyrics"), async () => {})).rejects.toThrow("识别失败");

    expect(mocks.remove).toHaveBeenCalledWith("temp/audio.mp3");
  });

  it("没有识别结果时返回空对象", async () => {
    mocks.songRecognize.mockResolvedValue(undefined);
    const ctx = createContext("lyrics");

    await handler(ctx, async () => {});

    expect(ctx.body).toEqual({});
  });
});
