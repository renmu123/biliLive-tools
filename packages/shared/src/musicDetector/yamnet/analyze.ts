import { spawn } from "node:child_process";
import { open, stat, rm } from "node:fs/promises";
import { availableParallelism } from "node:os";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { AudioAnalysis, AudioFrame, ProgressCallback } from "./types.js";

const SAMPLE_RATE = 16000;
const HOP_SAMPLES = 7680;
const RECEPTIVE_SAMPLES = 15600;
const CLASS_COUNT = 521;
// yamnet_class_map.csv from the pinned fc1697c model (see README.md).
const SINGING_IDS = [24, 25, 29, 31]; // Singing, Choir, Child singing, Rapping
const SPEECH_IDS = [0, 1, 2, 3]; // Speech, Child speech, Conversation, Narration
const MUSIC_ID = 132;

async function decodeAudio(input: string, output: string, ffmpegPath: string) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      ffmpegPath,
      [
        "-nostdin",
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        input,
        "-map",
        "0:a:0",
        "-vn",
        "-ac",
        "1",
        "-ar",
        String(SAMPLE_RATE),
        "-c:a",
        "pcm_f32le",
        "-f",
        "f32le",
        output,
      ],
      { windowsHide: true, shell: false, stdio: ["ignore", "ignore", "pipe"] },
    );
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr = (stderr + chunk.toString()).slice(-4000);
    });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`音频提取失败 (${code})：${stderr}`)),
    );
  });
}

/** Bounded-memory native YAMNet batches. Overlap is 7,920 samples, matching the demo. */
export async function analyzePcm(
  pcmPath: string,
  modelPath: string,
  onProgress?: ProgressCallback,
  batchFrames = 64,
): Promise<AudioAnalysis> {
  if (!Number.isInteger(batchFrames) || batchFrames < 1 || batchFrames > 256)
    throw new Error("Invalid batch size");
  const size = (await stat(pcmPath)).size;
  if (!size || size % 4) throw new Error("音频为空或 PCM 格式无效");
  const samples = size / 4;
  const audioSeconds = samples / SAMPLE_RATE;
  const totalFrames = 1 + Math.ceil(Math.max(0, samples - RECEPTIVE_SAMPLES) / HOP_SAMPLES);
  const ort = await import("onnxruntime-node");
  const session = await ort.InferenceSession.create(modelPath, {
    executionProviders: ["cpu"],
    intraOpNumThreads: Math.min(6, availableParallelism()),
    interOpNumThreads: 1,
    executionMode: "sequential",
    graphOptimizationLevel: "all",
  });
  let pcm: Awaited<ReturnType<typeof open>> | undefined;
  try {
    if (session.inputNames.length !== 1) throw new Error("YAMNet 输入格式不匹配");
    pcm = await open(pcmPath, "r");
    const frames: AudioFrame[] = [];
    for (let first = 0; first < totalFrames; first += batchFrames) {
      const count = Math.min(batchFrames, totalFrames - first);
      const length = RECEPTIVE_SAMPLES + (count - 1) * HOP_SAMPLES;
      const availableBytes = Math.min(length, samples - first * HOP_SAMPLES) * 4;
      const buffer = Buffer.alloc(length * 4);
      let read = 0;
      while (read < availableBytes) {
        const { bytesRead } = await pcm.read(
          buffer,
          read,
          availableBytes - read,
          first * HOP_SAMPLES * 4 + read,
        );
        if (!bytesRead) throw new Error("音频数据意外结束");
        read += bytesRead;
      }
      const wave = new Float32Array(buffer.buffer, buffer.byteOffset, length);
      const tensor = new ort.Tensor("float32", wave, [length]);
      let outputs: Awaited<ReturnType<typeof session.run>> | undefined;
      try {
        outputs = await session.run({ [session.inputNames[0]]: tensor });
        const candidates = Object.values(outputs).filter(
          (value) => value.dims.length === 2 && value.dims[1] === CLASS_COUNT,
        );
        if (candidates.length !== 1) throw new Error("YAMNet 输出格式不匹配");
        const scores = candidates[0];
        if (
          !(scores.data instanceof Float32Array) ||
          scores.dims[0] < count ||
          scores.dims[0] > count + 1
        )
          throw new Error("YAMNet 输出帧数或类型不匹配");
        // This export may emit one extra padded frame at a batch end. Discard it.
        const data = scores.data;
        for (let i = 0; i < count; i++) {
          const row = data.subarray(i * CLASS_COUNT, (i + 1) * CLASS_COUNT);
          if (!row.every((score) => Number.isFinite(score) && score >= 0 && score <= 1))
            throw new Error("YAMNet 返回了无效分数");
          const startSeconds = ((first + i) * HOP_SAMPLES) / SAMPLE_RATE;
          frames.push({
            startSeconds,
            endSeconds: Math.min(audioSeconds, startSeconds + RECEPTIVE_SAMPLES / SAMPLE_RATE),
            singingScore: Math.max(...SINGING_IDS.map((id) => row[id])),
            speechScore: Math.max(...SPEECH_IDS.map((id) => row[id])),
            musicScore: row[MUSIC_ID],
          });
        }
      } finally {
        tensor.dispose();
        if (outputs) for (const output of Object.values(outputs)) output.dispose();
      }
      const fraction = frames.length / totalFrames;
      onProgress?.({
        stage: "analyze",
        percentage: 30 + Math.floor(fraction * 60),
        message: `分析演唱分数：${(fraction * 100).toFixed(1)}%`,
      });
    }
    return { audioSeconds, frames };
  } finally {
    try {
      await pcm?.close();
    } finally {
      await session.release();
    }
  }
}

export async function analyzeAudio(
  input: string,
  modelPath: string,
  cacheDirectory: string,
  ffmpegPath: string,
  onProgress?: ProgressCallback,
) {
  const pcmPath = path.join(cacheDirectory, `${randomUUID()}.f32le`);
  try {
    onProgress?.({ stage: "extract", percentage: 0, message: "正在提取单声道音频" });
    await decodeAudio(input, pcmPath, ffmpegPath);
    onProgress?.({ stage: "analyze", percentage: 30, message: "正在加载 YAMNet 并分析演唱分数" });
    return await analyzePcm(pcmPath, modelPath, onProgress);
  } finally {
    await rm(pcmPath, { force: true });
  }
}
