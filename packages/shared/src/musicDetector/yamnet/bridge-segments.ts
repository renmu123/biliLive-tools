// Ported from the user-provided YAMNet demo; see README.md.
import type { AudioFrame, SingingSegment } from "./types.js";
export const BRIDGE_DEFAULTS = Object.freeze({
  maximumGapSeconds: 30,
  minimumMusicScore: 0.6,
  maximumSpeechScore: 0.2,
  minimumSupportRatio: 0.9,
  maximumBreakSeconds: 3,
  nativeHopSeconds: 0.48,
});

export function normalizeBridgeOptions(
  options: Partial<Record<keyof typeof BRIDGE_DEFAULTS, number>> = {},
) {
  const c: Record<keyof typeof BRIDGE_DEFAULTS, number> = { ...BRIDGE_DEFAULTS, ...options };
  for (const [key, value] of Object.entries(c)) {
    if (!(key in BRIDGE_DEFAULTS) || !Number.isFinite(value))
      throw new Error(`Invalid bridge option: ${key}`);
  }
  for (const key of ["minimumMusicScore", "maximumSpeechScore", "minimumSupportRatio"]) {
    if (c[key] < 0 || c[key] > 1) throw new Error(`Invalid bridge ${key}`);
  }
  if (c.maximumGapSeconds < 0 || c.maximumBreakSeconds < 0 || c.nativeHopSeconds <= 0)
    throw new Error("Invalid bridge timing");
  return c;
}

// A music bridge connects two already-qualified singing regions. It never promotes
// a rejected speech/BGM candidate, and it does not establish song identity.
export function bridgeMusicGaps(
  frames: AudioFrame[],
  audioSeconds: number,
  segments: SingingSegment[],
  options: Partial<Record<keyof typeof BRIDGE_DEFAULTS, number>> = {},
) {
  const c = normalizeBridgeOptions(options);
  if (!Number.isFinite(audioSeconds) || audioSeconds <= 0) throw new Error("Invalid audioSeconds");
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (
      !Number.isFinite(f.startSeconds) ||
      f.startSeconds < 0 ||
      f.startSeconds >= audioSeconds ||
      (i > 0 &&
        Math.abs(f.startSeconds - frames[i - 1].startSeconds - c.nativeHopSeconds) > 1e-6) ||
      !["musicScore", "speechScore", "singingScore"].every(
        (key) => Number.isFinite(f[key]) && f[key] >= 0 && f[key] <= 1,
      )
    )
      throw new Error(`Invalid bridge frame ${i}`);
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
      throw new Error(`Invalid or overlapping singing segment ${i}`);
  }
  function intervalStats(start, end) {
    let coveredSeconds = 0,
      supportSeconds = 0,
      run = 0,
      longestBreakSeconds = 0;
    let musicSum = 0,
      speechSum = 0,
      singingSum = 0,
      peakSingingScore = 0;
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      const binEnd = i + 1 < frames.length ? frames[i + 1].startSeconds : audioSeconds;
      const duration = Math.max(0, Math.min(end, binEnd) - Math.max(start, f.startSeconds));
      if (duration <= 0) continue;
      coveredSeconds += duration;
      musicSum += duration * f.musicScore;
      speechSum += duration * f.speechScore;
      singingSum += duration * f.singingScore;
      peakSingingScore = Math.max(peakSingingScore, f.singingScore);
      if (f.musicScore >= c.minimumMusicScore && f.speechScore <= c.maximumSpeechScore) {
        supportSeconds += duration;
        run = 0;
      } else {
        run += duration;
        longestBreakSeconds = Math.max(longestBreakSeconds, run);
      }
    }
    const gap = end - start;
    return {
      coveredSeconds,
      supportSeconds,
      supportRatio: gap > 0 ? supportSeconds / gap : 1,
      longestBreakSeconds,
      meanMusicScore: musicSum / (coveredSeconds || 1),
      meanSpeechScore: speechSum / (coveredSeconds || 1),
      meanSingingScore: singingSum / (coveredSeconds || 1),
      peakSingingScore,
    };
  }

  type Bridge = {
    leftRegionNumber: number;
    rightRegionNumber: number;
    startSeconds: number;
    endSeconds: number;
    gapSeconds: number;
    merged: boolean;
    rejectionReasons: string[];
  } & ReturnType<typeof intervalStats>;
  const bridges: Bridge[] = [];
  const groups: { regions: SingingSegment[]; bridges: Bridge[] }[] = [];
  for (let i = 0; i < ordered.length; i++) {
    if (i === 0) {
      groups.push({ regions: [ordered[i]], bridges: [] });
      continue;
    }
    const previous = ordered[i - 1],
      next = ordered[i];
    const startSeconds = previous.endSeconds,
      endSeconds = next.startSeconds,
      gapSeconds = endSeconds - startSeconds;
    const stats = intervalStats(startSeconds, endSeconds),
      rejectionReasons: string[] = [];
    if (gapSeconds > c.maximumGapSeconds + 1e-8) rejectionReasons.push("gap_too_long");
    if (stats.coveredSeconds + 1e-8 < gapSeconds)
      rejectionReasons.push("incomplete_frame_coverage");
    if (stats.supportRatio + 1e-8 < c.minimumSupportRatio)
      rejectionReasons.push("insufficient_music_without_speech");
    if (stats.longestBreakSeconds > c.maximumBreakSeconds + 1e-8)
      rejectionReasons.push("continuous_music_break_or_speech");
    const bridge = {
      leftRegionNumber: i,
      rightRegionNumber: i + 1,
      startSeconds,
      endSeconds,
      gapSeconds,
      ...stats,
      merged: rejectionReasons.length === 0,
      rejectionReasons,
    };
    bridges.push(bridge);
    if (bridge.merged) {
      groups.at(-1)!.regions.push(next);
      groups.at(-1)!.bridges.push(bridge);
    } else groups.push({ regions: [next], bridges: [] });
  }
  return {
    segments: groups.map((group) => {
      const startSeconds = group.regions[0].startSeconds,
        endSeconds = group.regions.at(-1)!.endSeconds;
      const stats = intervalStats(startSeconds, endSeconds);
      return {
        startSeconds,
        endSeconds,
        status: "candidate_singing_with_instrumental_bridges_not_verified_song_identity",
        singingRegions: group.regions,
        instrumentalBridges: group.bridges,
        fullIntervalMeanSinging: stats.meanSingingScore,
        fullIntervalMeanMusic: stats.meanMusicScore,
        fullIntervalMeanSpeech: stats.meanSpeechScore,
        peakSingingScore: stats.peakSingingScore,
        longestSeedRunSeconds: Math.max(
          0,
          ...group.regions.map((s) => s.longestSeedRunSeconds ?? 0),
        ),
        seedDecisionSeconds: group.regions.reduce(
          (sum, s) => sum + (s.seedDecisionSeconds ?? 0),
          0,
        ),
      };
    }),
    bridges,
    configuration: {
      algorithm: "music_gap_bridge_v1",
      ...c,
      timingSemantics:
        "Native scores held on [frame start, next frame start), with the final frame held to audio end. Gap-edge bins are clipped and duration weighted, without double-counting overlapping model windows.",
      limitation:
        "Continuous music between singing regions is a merge heuristic, not proof of the same song.",
    },
  };
}
