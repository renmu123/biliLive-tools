import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mkdtemp, rm, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const mocks = vi.hoisted(() => ({ cache: "", analyze: vi.fn(), model: vi.fn() }));
vi.mock("../../src/index.js", () => ({
  container: { resolve: () => ({ defaultYamnetModelPath: "resources/models/yamnet.onnx" }) },
}));
vi.mock("../../src/utils/index.js", () => ({
  getTempPath: () => mocks.cache,
  calculateFileQuickHash: async () => "video",
}));
vi.mock("../../src/task/video.js", () => ({
  getBinPath: () => ({ ffmpegPath: "ffmpeg", yamnetModelPath: "resources/models/yamnet.onnx" }),
}));
vi.mock("../../src/utils/log.js", () => ({ default: { info: vi.fn(), warn: vi.fn() } }));
vi.mock("../../src/musicDetector/yamnet/analyze.js", () => ({ analyzeAudio: mocks.analyze }));
vi.mock("../../src/musicDetector/yamnet/model.js", () => ({
  ensureModel: mocks.model,
  MODEL_SHA256: "pinned-model",
}));
import { musicDetect } from "../../src/musicDetector/yamnet/index.js";

beforeEach(async () => {
  mocks.cache = await mkdtemp(path.join(os.tmpdir(), "yamnet-cache-test-"));
  mocks.analyze.mockReset().mockResolvedValue({
    audioSeconds: 1,
    frames: [
      { startSeconds: 0, endSeconds: 0.975, singingScore: 0, speechScore: 0, musicScore: 0 },
      { startSeconds: 0.48, endSeconds: 1, singingScore: 0, speechScore: 0, musicScore: 0 },
    ],
  });
  mocks.model.mockReset().mockResolvedValue("model.onnx");
});
afterEach(async () => {
  await rm(mocks.cache, { recursive: true, force: true });
});

it("reuses scores without loading a model when only detection parameters change", async () => {
  await musicDetect("video.mp4", { disableCache: false });
  const progress = vi.fn();
  await musicDetect("video.mp4", { startThreshold: 0.03, disableCache: false }, progress);
  expect(mocks.analyze).toHaveBeenCalledTimes(1);
  expect(mocks.model).toHaveBeenCalledTimes(1);
  expect(mocks.model).toHaveBeenCalledWith("resources/models/yamnet.onnx");
  expect(progress).toHaveBeenCalledWith(expect.objectContaining({ stage: "cache" }));
  expect(progress).toHaveBeenLastCalledWith(expect.objectContaining({ percentage: 100 }));
});
it("disableCache bypasses existing scores and removes them even on failure", async () => {
  await musicDetect("video.mp4", { disableCache: false });
  mocks.analyze.mockRejectedValueOnce(new Error("decode failed"));
  await expect(musicDetect("video.mp4", { disableCache: true })).rejects.toThrow("decode failed");
  expect(mocks.analyze).toHaveBeenCalledTimes(2);
  expect(await readdir(mocks.cache)).toEqual([]);
});
it.each([
  "invalid json",
  JSON.stringify({ version: 0 }),
  JSON.stringify({ version: 1, model: "other-model" }),
])("rebuilds invalid cache %s", async (content) => {
  await writeFile(path.join(mocks.cache, "yamnet_v1_video.json"), content);
  await musicDetect("video.mp4", { disableCache: false });
  expect(mocks.analyze).toHaveBeenCalledTimes(1);
  expect((await readdir(mocks.cache)).filter((name) => name.endsWith(".part"))).toEqual([]);
});
it("serializes simultaneous requests and shares their score cache", async () => {
  await Promise.all([
    musicDetect("video.mp4", { disableCache: false }),
    musicDetect("video.mp4", { disableCache: false }),
  ]);
  expect(mocks.analyze).toHaveBeenCalledTimes(1);
});
it("rejects invalid configuration before model loading or decoding", async () => {
  await expect(musicDetect("video.mp4", { decisionHopSeconds: 0 })).rejects.toThrow();
  expect(mocks.model).not.toHaveBeenCalled();
  expect(mocks.analyze).not.toHaveBeenCalled();
});
