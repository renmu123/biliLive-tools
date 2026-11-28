// Ported from the user-provided YAMNet demo; see README.md.
import type { AudioFrame } from "./types.js";
import { detectSegments } from "./segments.js";

// These are a tuning preset for the reviewed recording, not calibrated probabilities.
export const CONTEXT_DEFAULTS = Object.freeze({
  contextFrames: 21,
  boundarySmoothingFrames: 5,
  decisionHopSeconds: 0.96,
  startThreshold: 0.015,
  sustainThreshold: 0.01,
  maximumSeedSpeech: 0.15,
  minimumSeedSeconds: 4.8,
  mergeGapSeconds: 12,
  minimumSeconds: 20,
  nativeHopSeconds: 0.48,
});

export function normalizeContextOptions(
  options: Partial<Record<keyof typeof CONTEXT_DEFAULTS, number>> = {},
) {
  const c: Record<keyof typeof CONTEXT_DEFAULTS, number> = { ...CONTEXT_DEFAULTS, ...options };
  for (const [key, value] of Object.entries(c)) {
    if (!(key in CONTEXT_DEFAULTS)) throw new Error(`Unknown context option: ${key}`);
    if (!Number.isFinite(value)) throw new Error(`Invalid ${key}`);
  }
  for (const key of ["contextFrames", "boundarySmoothingFrames"]) {
    if (!Number.isInteger(c[key]) || c[key] < 1 || c[key] % 2 !== 1)
      throw new Error(`${key} must be a positive odd integer`);
  }
  if (
    !(
      c.startThreshold > 0 &&
      c.startThreshold <= 1 &&
      c.sustainThreshold > 0 &&
      c.sustainThreshold <= c.startThreshold
    )
  )
    throw new Error("Invalid context thresholds");
  if (c.maximumSeedSpeech < 0 || c.maximumSeedSpeech > 1)
    throw new Error("Invalid maximumSeedSpeech");
  if (
    c.nativeHopSeconds <= 0 ||
    c.decisionHopSeconds <= 0 ||
    c.minimumSeedSeconds <= 0 ||
    c.minimumSeconds <= 0 ||
    c.mergeGapSeconds < 0
  )
    throw new Error("Invalid temporal context option");
  const stride = c.decisionHopSeconds / c.nativeHopSeconds;
  if (Math.abs(stride - Math.round(stride)) > 1e-8 || stride < 1)
    throw new Error(
      "decisionHopSeconds must be an integer multiple of nativeHopSeconds (0.48 s for this model)",
    );
  return c;
}

export function detectContextSegments(
  frames: AudioFrame[],
  audioSeconds: number,
  options: Partial<Record<keyof typeof CONTEXT_DEFAULTS, number>> = {},
) {
  const c = normalizeContextOptions(options);
  if (!Number.isFinite(audioSeconds) || audioSeconds <= 0) throw new Error("Invalid audioSeconds");
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (
      ![f.startSeconds, f.endSeconds, f.singingScore, f.speechScore].every(Number.isFinite) ||
      f.startSeconds < 0 ||
      f.endSeconds <= f.startSeconds ||
      f.endSeconds > audioSeconds + 1e-8 ||
      f.singingScore < 0 ||
      f.singingScore > 1 ||
      f.speechScore < 0 ||
      f.speechScore > 1 ||
      (i > 0 && Math.abs(f.startSeconds - frames[i - 1].startSeconds - c.nativeHopSeconds) > 1e-6)
    )
      throw new Error(`Invalid native frame ${i}`);
  }
  const prefix = (key) => {
    const p = new Float64Array(frames.length + 1);
    for (let i = 0; i < frames.length; i++) p[i + 1] = p[i] + frames[i][key];
    return p;
  };
  const singing = prefix("singingScore"),
    speech = prefix("speechScore");
  const average = (p, lo, hi) => (p[hi] - p[lo]) / (hi - lo);
  const half = (c.contextFrames - 1) / 2,
    stride = Math.round(c.decisionHopSeconds / c.nativeHopSeconds);
  const decisions: {
    frameIndex: number;
    startSeconds: number;
    endSeconds: number;
    contextStartSeconds: number;
    contextEndSeconds: number;
    contextFrameCount: number;
    singingMean: number;
    speechMean: number;
    seed: boolean;
  }[] = [];
  for (let i = 0; i < frames.length; i += stride) {
    const lo = Math.max(0, i - half),
      hi = Math.min(frames.length, i + half + 1);
    const singingMean = average(singing, lo, hi),
      speechMean = average(speech, lo, hi);
    decisions.push({
      frameIndex: i,
      startSeconds: frames[i].startSeconds,
      endSeconds: i + stride < frames.length ? frames[i + stride].startSeconds : audioSeconds,
      contextStartSeconds: frames[lo].startSeconds,
      contextEndSeconds: frames[hi - 1].endSeconds,
      contextFrameCount: hi - lo,
      singingMean,
      speechMean,
      seed: singingMean >= c.startThreshold && speechMean <= c.maximumSeedSpeech,
    });
  }

  // Fine-scale support determines boundaries; a broader context only decides whether
  // a candidate contains a sustained seed. Speech does not trim a whole mixed segment.
  const candidates = detectSegments(frames, audioSeconds, {
    startThreshold: c.sustainThreshold,
    sustainThreshold: c.sustainThreshold,
    smoothingFrames: c.boundarySmoothingFrames,
    highEvidenceSeconds: 0,
    mergeGapSeconds: c.mergeGapSeconds,
    minimumSeconds: c.minimumSeconds,
    hopSeconds: c.nativeHopSeconds,
  });
  const diagnostics = candidates.map((candidate) => {
    const points = decisions.filter(
      (d) => d.endSeconds > candidate.startSeconds && d.startSeconds < candidate.endSeconds,
    );
    let run = 0,
      longestSeedRunSeconds = 0,
      seedDecisionSeconds = 0;
    for (const point of points) {
      if (point.seed) {
        const duration = Math.max(
          0,
          Math.min(point.endSeconds, candidate.endSeconds) -
            Math.max(point.startSeconds, candidate.startSeconds),
        );
        run += duration;
        seedDecisionSeconds += duration;
        longestSeedRunSeconds = Math.max(longestSeedRunSeconds, run);
      } else run = 0;
    }
    const selected = longestSeedRunSeconds + 1e-8 >= c.minimumSeedSeconds;
    const coveredFrames = frames.filter(
      (f) => f.startSeconds >= candidate.startSeconds && f.startSeconds < candidate.endSeconds,
    );
    const mean = (key) =>
      coveredFrames.reduce((sum, f) => sum + f[key], 0) / (coveredFrames.length || 1);
    const { highEvidenceSeconds, ...boundary } = candidate;
    return {
      ...boundary,
      selected,
      rejectionReason: selected ? null : "no_sustained_low_speech_singing_seed",
      longestSeedRunSeconds,
      seedDecisionSeconds,
      peakContextSinging: Math.max(0, ...points.map((d) => d.singingMean)),
      fullIntervalMeanSinging: mean("singingScore"),
      fullIntervalMeanSpeech: mean("speechScore"),
      thresholds: {
        start: c.startThreshold,
        sustain: c.sustainThreshold,
        maximumSeedSpeech: c.maximumSeedSpeech,
        minimumSeedSeconds: c.minimumSeedSeconds,
      },
    };
  });
  const support = frames.length ? frames[0].endSeconds - frames[0].startSeconds : 0.975;
  return {
    segments: diagnostics.filter((d) => d.selected),
    diagnostics,
    decisions,
    configuration: {
      algorithm: "context_seed_v1",
      ...c,
      contextCenterSpanSeconds: (c.contextFrames - 1) * c.nativeHopSeconds,
      contextWaveformSupportSeconds: (c.contextFrames - 1) * c.nativeHopSeconds + support,
      boundaryWaveformSupportSeconds:
        (c.boundarySmoothingFrames - 1) * c.nativeHopSeconds + support,
      decisionCount: decisions.length,
      timingSemantics:
        "Centered means, truncated at file ends and normalized by available frames. Decisions are sampled on native-frame starts and held until the next decision; continuous seed seconds measure this condition, not independent audio evidence. Fine-scale boundaries are not expanded by the context width.",
    },
  };
}
