// Ported from the user-provided YAMNet demo; see README.md.
import type { AudioFrame } from "./types.js";
/** Provisional thresholds: calibrate against labeled positive and negative clips. */
export function detectSegments(
  frames: AudioFrame[],
  audioSeconds: number,
  {
    startThreshold = 0.3,
    sustainThreshold = 0.15,
    smoothingFrames = 5,
    highEvidenceSeconds = 2,
    mergeGapSeconds = 12,
    minimumSeconds = 20,
    hopSeconds = 0.48,
  } = {},
) {
  if (
    !(
      startThreshold > 0 &&
      startThreshold <= 1 &&
      sustainThreshold > 0 &&
      sustainThreshold <= startThreshold
    )
  )
    throw new Error("Invalid detection thresholds");
  if (!Number.isInteger(smoothingFrames) || smoothingFrames < 1 || smoothingFrames % 2 !== 1)
    throw new Error("smoothingFrames must be positive and odd");
  const half = Math.floor(smoothingFrames / 2);
  const smoothed = frames.map((frame, i) => {
    const neighbors = frames.slice(Math.max(0, i - half), Math.min(frames.length, i + half + 1));
    return {
      ...frame,
      smoothSinging: neighbors.reduce((sum, f) => sum + f.singingScore, 0) / neighbors.length,
    };
  });
  const groups: (AudioFrame & { smoothSinging: number })[][] = [];
  let current: (AudioFrame & { smoothSinging: number })[] | undefined;
  for (const frame of smoothed) {
    if (frame.smoothSinging < sustainThreshold) continue;
    if (!current || frame.startSeconds - current.at(-1)!.startSeconds > mergeGapSeconds) {
      current = [];
      groups.push(current);
    }
    current.push(frame);
  }
  return groups
    .filter(
      (group) =>
        group.filter((f) => f.smoothSinging >= startThreshold).length * hopSeconds >=
        highEvidenceSeconds,
    )
    .map((group) => ({
      startSeconds: group[0].startSeconds,
      endSeconds: Math.min(audioSeconds, group.at(-1)!.endSeconds),
      peakSingingScore: Math.max(...group.map((f) => f.singingScore)),
      meanSingingScore: group.reduce((sum, f) => sum + f.singingScore, 0) / group.length,
      evidenceFrames: group.length,
      highEvidenceSeconds:
        group.filter((f) => f.smoothSinging >= startThreshold).length * hopSeconds,
      status: "candidate_singing_not_verified_cover",
    }))
    .filter((segment) => segment.endSeconds - segment.startSeconds >= minimumSeconds);
}
