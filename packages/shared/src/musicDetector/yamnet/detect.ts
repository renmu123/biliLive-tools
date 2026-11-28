import { DEFAULT_MUSIC_DETECTION_CONFIG } from "@biliLive-tools/types/musicDetection.js";
import type { MusicDetectionConfig } from "@biliLive-tools/types/musicDetection.js";
import { detectContextSegments, normalizeContextOptions } from "./context-segments.js";
import { bridgeMusicGaps } from "./bridge-segments.js";
import { extendMusicEdges } from "./extend-segments.js";
import type { AudioAnalysis, SingingSegment } from "./types.js";

export function normalizeConfig(options: Partial<MusicDetectionConfig> = {}): MusicDetectionConfig {
  if (!options || typeof options !== "object" || Array.isArray(options))
    throw new Error("演唱检测配置无效");
  const config = { ...DEFAULT_MUSIC_DETECTION_CONFIG };
  for (const key of Object.keys(config) as (keyof MusicDetectionConfig)[]) {
    if (Object.hasOwn(options, key)) {
      if (typeof options[key] !== typeof config[key])
        throw new Error(`演唱检测参数 ${key} 类型无效`);
      Object.assign(config, { [key]: options[key] });
    }
  }
  normalizeContextOptions(contextOptions(config));
  for (const key of ["bridgeMaxGapSeconds", "maximumLeadSeconds", "maximumTailSeconds"] as const) {
    if (!Number.isFinite(config[key]) || config[key] < 0 || config[key] > 1200)
      throw new Error(`演唱检测参数 ${key} 无效`);
  }
  if (config.contextFrames > 1001 || config.boundarySmoothingFrames > 1001)
    throw new Error("平滑窗口不能超过 1001 帧");
  return config;
}

function contextOptions(config: MusicDetectionConfig) {
  return {
    startThreshold: config.startThreshold,
    sustainThreshold: config.sustainThreshold,
    maximumSeedSpeech: config.maximumSeedSpeech,
    contextFrames: config.contextFrames,
    boundarySmoothingFrames: config.boundarySmoothingFrames,
    decisionHopSeconds: config.decisionHopSeconds,
    minimumSeedSeconds: config.minimumSeedSeconds,
    minimumSeconds: config.minSegmentDuration,
    mergeGapSeconds: config.maxGapDuration,
  };
}

export function detectSingingSegments(analysis: AudioAnalysis, config: MusicDetectionConfig) {
  const { frames, audioSeconds } = analysis;
  let segments: SingingSegment[] = detectContextSegments(
    frames,
    audioSeconds,
    contextOptions(config),
  ).segments;
  if (config.bridgeMusicGaps)
    segments = bridgeMusicGaps(frames, audioSeconds, segments, {
      maximumGapSeconds: config.bridgeMaxGapSeconds,
    }).segments;
  if (config.extendMusicEdges)
    segments = extendMusicEdges(frames, audioSeconds, segments, {
      maximumLeadSeconds: config.maximumLeadSeconds,
      maximumTailSeconds: config.maximumTailSeconds,
    }).segments;
  return segments.map((segment) => ({
    startTime: segment.startSeconds,
    endTime: segment.endSeconds,
  }));
}

/** Check inference timing and score schema before reusing a cache. */
export function isAudioAnalysis(value: unknown): value is AudioAnalysis {
  const data = value as AudioAnalysis | undefined;
  if (
    !data ||
    !Number.isFinite(data.audioSeconds) ||
    data.audioSeconds <= 0 ||
    !Array.isArray(data.frames)
  )
    return false;
  const count = 1 + Math.ceil(Math.max(0, data.audioSeconds * 16000 - 15600) / 7680);
  return (
    data.frames.length === count &&
    data.frames.every(
      (frame, i) =>
        frame &&
        Number.isFinite(frame.startSeconds) &&
        Math.abs(frame.startSeconds - i * 0.48) < 1e-6 &&
        Number.isFinite(frame.endSeconds) &&
        Math.abs(frame.endSeconds - Math.min(data.audioSeconds, i * 0.48 + 0.975)) < 1e-6 &&
        [frame.singingScore, frame.speechScore, frame.musicScore].every(
          (score) => Number.isFinite(score) && score >= 0 && score <= 1,
        ),
    )
  );
}
