// Ported from the user-provided YAMNet demo; see README.md.
import type { AudioFrame, SingingSegment } from "./types.js";
export const EDGE_DEFAULTS = Object.freeze({
  maximumLeadSeconds: 30,
  maximumTailSeconds: 30,
  minimumMusicScore: 0.6,
  maximumSpeechScore: 0.2,
  minimumSupportRatio: 0.9,
  maximumBreakSeconds: 1.44,
  nativeHopSeconds: 0.48,
});

export function normalizeEdgeOptions(
  options: Partial<Record<keyof typeof EDGE_DEFAULTS, number>> = {},
) {
  const c: Record<keyof typeof EDGE_DEFAULTS, number> = { ...EDGE_DEFAULTS, ...options };
  for (const [key, value] of Object.entries(c)) {
    if (!(key in EDGE_DEFAULTS) || !Number.isFinite(value))
      throw new Error(`Invalid edge option: ${key}`);
  }
  for (const key of ["minimumMusicScore", "maximumSpeechScore", "minimumSupportRatio"]) {
    if (c[key] < 0 || c[key] > 1) throw new Error(`Invalid edge ${key}`);
  }
  if (
    c.maximumLeadSeconds < 0 ||
    c.maximumTailSeconds < 0 ||
    c.maximumBreakSeconds < 0 ||
    c.nativeHopSeconds <= 0
  )
    throw new Error("Invalid edge timing");
  return c;
}

// Extend only existing candidates, retaining their original singing evidence.
// Scores are held on non-overlapping native-hop bins, including the file tail.
export function extendMusicEdges(
  frames: AudioFrame[],
  audioSeconds: number,
  segments: SingingSegment[],
  options: Partial<Record<keyof typeof EDGE_DEFAULTS, number>> = {},
) {
  const c = normalizeEdgeOptions(options);
  if (!Number.isFinite(audioSeconds) || audioSeconds <= 0) throw new Error("Invalid audioSeconds");
  if (segments.length && !frames.length) throw new Error("Cannot extend segments without frames");
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (
      !Number.isFinite(f.startSeconds) ||
      f.startSeconds < 0 ||
      f.startSeconds >= audioSeconds ||
      (i === 0 && Math.abs(f.startSeconds) > 1e-8) ||
      (i > 0 &&
        Math.abs(f.startSeconds - frames[i - 1].startSeconds - c.nativeHopSeconds) > 1e-6) ||
      !["musicScore", "speechScore", "singingScore"].every(
        (key) => Number.isFinite(f[key]) && f[key] >= 0 && f[key] <= 1,
      )
    )
      throw new Error(`Invalid edge frame ${i}`);
  }
  const ordered = [...segments].sort((a, b) => a.startSeconds - b.startSeconds);
  for (let i = 0; i < ordered.length; i++) {
    const s = ordered[i];
    if (
      ![s.startSeconds, s.endSeconds].every(Number.isFinite) ||
      s.startSeconds < 0 ||
      s.startSeconds >= s.endSeconds ||
      s.endSeconds > audioSeconds ||
      (i > 0 && s.startSeconds < ordered[i - 1].endSeconds)
    )
      throw new Error(`Invalid or overlapping segment ${i}`);
  }
  function binsBetween(start, end) {
    const bins: {
      start: number;
      end: number;
      duration: number;
      frame: AudioFrame;
      supported: boolean;
    }[] = [];
    const firstIndex = Math.max(
      0,
      Math.min(frames.length - 1, Math.floor(start / c.nativeHopSeconds)),
    );
    for (let i = firstIndex; i < frames.length && frames[i].startSeconds < end; i++) {
      const f = frames[i],
        nextStart = frames[i + 1]?.startSeconds ?? audioSeconds;
      const a = Math.max(start, f.startSeconds),
        b = Math.min(end, nextStart);
      if (b > a)
        bins.push({
          start: a,
          end: b,
          duration: b - a,
          frame: f,
          supported: f.musicScore >= c.minimumMusicScore && f.speechScore <= c.maximumSpeechScore,
        });
    }
    return bins;
  }
  function extendEdge(index, before) {
    const s = ordered[index],
      origin = before ? s.startSeconds : s.endSeconds;
    const maximum = before ? c.maximumLeadSeconds : c.maximumTailSeconds;
    const neighborLimit = before
      ? index > 0
        ? (ordered[index - 1].endSeconds + origin) / 2
        : 0
      : index + 1 < ordered.length
        ? (origin + ordered[index + 1].startSeconds) / 2
        : audioSeconds;
    const limit = before
      ? Math.max(origin - maximum, neighborLimit)
      : Math.min(origin + maximum, neighborLimit);
    const boundKind =
      Math.abs(limit - neighborLimit) < 1e-8
        ? neighborLimit === 0 || neighborLimit === audioSeconds
          ? "file_boundary"
          : "neighbor_midpoint"
        : "maximum_extension";
    const bins = binsBetween(Math.min(origin, limit), Math.max(origin, limit));
    if (before) bins.reverse();
    let scannedSeconds = 0,
      supportSeconds = 0,
      badRun = 0,
      longestBreakSeconds = 0;
    let boundarySeconds = origin,
      acceptedEvidence: {
        extensionSeconds: number;
        supportSeconds: number;
        supportRatio: number;
        longestBreakSeconds: number;
      } | null = null,
      stopReason = maximum === 0 ? "disabled" : boundKind;
    for (const bin of bins) {
      scannedSeconds += bin.duration;
      if (bin.supported) {
        supportSeconds += bin.duration;
        badRun = 0;
      } else badRun += bin.duration;
      longestBreakSeconds = Math.max(longestBreakSeconds, badRun);
      if (badRun > c.maximumBreakSeconds + 1e-8) {
        stopReason = "sustained_nonmusic_or_speech";
        break;
      }
      if (bin.supported && supportSeconds / scannedSeconds + 1e-8 >= c.minimumSupportRatio) {
        boundarySeconds = before ? bin.start : bin.end;
        acceptedEvidence = {
          extensionSeconds: scannedSeconds,
          supportSeconds,
          supportRatio: supportSeconds / scannedSeconds,
          longestBreakSeconds,
        };
      }
    }
    return {
      originalBoundarySeconds: origin,
      boundarySeconds,
      addedSeconds: Math.abs(origin - boundarySeconds),
      searchLimitSeconds: limit,
      stopReason,
      scannedSeconds,
      searchReachedLimit: stopReason === boundKind && maximum > 0,
      acceptedBoundaryAtLimit: Math.abs(boundarySeconds - limit) < 1e-8,
      acceptedEvidence,
    };
  }
  const diagnostics: {
    segmentNumber: number;
    originalStartSeconds: number;
    originalEndSeconds: number;
    startSeconds: number;
    endSeconds: number;
    before: ReturnType<typeof extendEdge>;
    after: ReturnType<typeof extendEdge>;
  }[] = [];
  const extended = ordered.map((s, index) => {
    const before = extendEdge(index, true),
      after = extendEdge(index, false);
    const startSeconds = before.boundarySeconds,
      endSeconds = after.boundarySeconds;
    const bins = binsBetween(startSeconds, endSeconds);
    const mean = (key) =>
      bins.reduce((sum, bin) => sum + bin.duration * bin.frame[key], 0) /
      (endSeconds - startSeconds);
    const edgeExtensions = { before, after };
    diagnostics.push({
      segmentNumber: index + 1,
      originalStartSeconds: s.startSeconds,
      originalEndSeconds: s.endSeconds,
      startSeconds,
      endSeconds,
      ...edgeExtensions,
    });
    return {
      ...s,
      originalStartSeconds: s.startSeconds,
      originalEndSeconds: s.endSeconds,
      startSeconds,
      endSeconds,
      edgeExtensions,
      fullIntervalMeanSinging: mean("singingScore"),
      fullIntervalMeanMusic: mean("musicScore"),
      fullIntervalMeanSpeech: mean("speechScore"),
      peakSingingScore: bins.reduce((peak, bin) => Math.max(peak, bin.frame.singingScore), 0),
    };
  });
  return {
    segments: extended,
    diagnostics,
    configuration: {
      algorithm: "bounded_music_edges_v1",
      ...c,
      timingSemantics:
        "Scan outward using duration-weighted native-hop bins. Short unsupported runs may be crossed, but accepted edges end on supported bins with sufficient cumulative support. File limits and original inter-segment gap midpoints bound each side. Touching segments stay separate.",
      limitation:
        "Extended ranges satisfy music/low-speech rules; they are not independently verified song boundaries. A maximum_extension stop means a natural boundary may remain outside the search range.",
    },
  };
}
