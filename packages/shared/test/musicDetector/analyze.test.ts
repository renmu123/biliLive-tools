import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mkdtemp, rm, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
const mocks = vi.hoisted(() => ({
  run: vi.fn(),
  release: vi.fn(),
  dispose: vi.fn(),
  create: vi.fn(),
}));
vi.mock("onnxruntime-node", () => ({
  Tensor: class {
    dispose = mocks.dispose;
    constructor(
      public type: string,
      public data: Float32Array,
      public dims: number[],
    ) {}
  },
  InferenceSession: { create: mocks.create },
}));
import { analyzeAudio, analyzePcm } from "../../src/musicDetector/yamnet/analyze.js";

let directory: string;
beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "yamnet-pcm-test-"));
  vi.clearAllMocks();
  mocks.create.mockResolvedValue({ inputNames: ["wave"], run: mocks.run, release: mocks.release });
  mocks.run.mockImplementation(async ({ wave }) => {
    const count = 1 + (wave.data.length - 15600) / 7680;
    const data = new Float32Array((count + 1) * 521);
    for (let i = 0; i < count; i++) {
      data[i * 521 + 24] = 0.1;
      data[i * 521 + 29] = 0.25;
      data[i * 521 + 2] = 0.5;
      data[i * 521 + 132] = 0.75;
    }
    return { scores: { dims: [count + 1, 521], data, dispose: mocks.dispose } };
  });
});
afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

it("preserves native timing across batches, ignores extra output, and pads only the file tail", async () => {
  const pcm = path.join(directory, "input.pcm");
  const wave = new Float32Array(16000 * 2).fill(0.5);
  await writeFile(pcm, Buffer.from(wave.buffer));
  const result = await analyzePcm(pcm, "model", undefined, 2);
  expect(result.audioSeconds).toBe(2);
  expect(result.frames).toHaveLength(4);
  expect(result.frames.map((f) => f.startSeconds)).toEqual([0, 0.48, 0.96, 1.44]);
  expect(result.frames.at(-1)?.endSeconds).toBe(2);
  expect(result.frames[0]).toMatchObject({
    singingScore: 0.25,
    speechScore: 0.5,
    musicScore: 0.75,
  });
  const inputs = mocks.run.mock.calls.map(([feeds]) => feeds.wave.data);
  expect(inputs[0].every((value: number) => value === 0.5)).toBe(true);
  expect(inputs[1][16639]).toBe(0.5);
  expect(inputs[1][16640]).toBe(0);
  expect(mocks.release).toHaveBeenCalledTimes(1);
  expect(mocks.dispose).toHaveBeenCalledTimes(4);
});
it("releases tensors and session after an inference failure", async () => {
  const pcm = path.join(directory, "input.pcm");
  await writeFile(pcm, Buffer.alloc(400));
  mocks.run.mockRejectedValueOnce(new Error("inference failed"));
  await expect(analyzePcm(pcm, "model")).rejects.toThrow("inference failed");
  expect(mocks.dispose).toHaveBeenCalledTimes(1);
  expect(mocks.release).toHaveBeenCalledTimes(1);
});
it("rejects an empty audio file before loading the runtime", async () => {
  const pcm = path.join(directory, "input.pcm");
  await writeFile(pcm, "");
  await expect(analyzePcm(pcm, "model")).rejects.toThrow("音频为空");
  expect(mocks.create).not.toHaveBeenCalled();
});
it("cleans up after FFmpeg cannot start", async () => {
  await expect(
    analyzeAudio("missing.mp4", "model", directory, path.join(directory, "missing-ffmpeg")),
  ).rejects.toThrow();
  expect(await readdir(directory)).toEqual([]);
});
