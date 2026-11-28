import { test } from "vitest";
import assert from "node:assert/strict";
import { bridgeMusicGaps } from "../../src/musicDetector/yamnet/bridge-segments.js";

const NATIVE_HOP = 0.48;
const WAVEFORM_SUPPORT = 0.975;

function nativeFrames(audioSeconds, getScores = () => ({})) {
  const count = 1 + Math.ceil(Math.max(0, audioSeconds - WAVEFORM_SUPPORT) / NATIVE_HOP);
  return Array.from({ length: count }, (_, frameIndex) => {
    const startSeconds = frameIndex * NATIVE_HOP;
    return {
      frameIndex,
      startSeconds,
      endSeconds: Math.min(audioSeconds, startSeconds + WAVEFORM_SUPPORT),
      musicScore: 0.95,
      speechScore: 0.05,
      singingScore: 0.02,
      ...getScores(frameIndex, startSeconds),
    };
  });
}

function region(startSeconds, endSeconds, name = "") {
  return {
    startSeconds,
    endSeconds,
    name,
    selected: true,
    longestSeedRunSeconds: 8,
    seedDecisionSeconds: 10,
  };
}

function near(actual, expected, message) {
  assert.ok(
    Math.abs(actual - expected) < 1e-8,
    `${message}: expected ${expected}, received ${actual}`,
  );
}

test("continuous low-speech music bridges a 23-second gap and preserves its source regions", () => {
  const duration = 70;
  const frames = nativeFrames(duration);
  const source = [region(43, 65, "later"), region(0, 20, "earlier")];
  const original = structuredClone(source);
  const result = bridgeMusicGaps(frames, duration, source);

  assert.equal(result.segments.length, 1);
  const [merged] = result.segments;
  assert.equal(merged.startSeconds, 0);
  assert.equal(merged.endSeconds, 65);
  assert.deepEqual(
    merged.singingRegions.map((s) => s.name),
    ["earlier", "later"],
  );
  assert.equal(merged.instrumentalBridges.length, 1);
  assert.equal(merged.instrumentalBridges[0].startSeconds, 20);
  assert.equal(merged.instrumentalBridges[0].endSeconds, 43);
  assert.equal(result.bridges[0].gapSeconds, 23);
  assert.equal(result.bridges[0].merged, true);
  near(result.bridges[0].supportRatio, 1, "all gap time has joint music and low speech");
  assert.deepEqual(
    source,
    original,
    "sorting and merging must not mutate the caller's source regions",
  );
});

test("strong speech over background music prevents bridging", () => {
  const duration = 70;
  const frames = nativeFrames(duration, (_i, start) => ({
    speechScore: start >= 19.68 && start < 43.2 ? 0.9 : 0.05,
  }));
  const result = bridgeMusicGaps(frames, duration, [region(0, 20), region(43, 65)]);

  assert.equal(result.segments.length, 2);
  assert.equal(result.bridges[0].merged, false);
  assert.ok(result.bridges[0].meanMusicScore > 0.9, "music alone is not sufficient");
  assert.ok(result.bridges[0].rejectionReasons.includes("insufficient_music_without_speech"));
  assert.equal(result.segments[0].instrumentalBridges.length, 0);
});

test("a continuous dropout blocks merging even when average music and support ratio pass", () => {
  const duration = 70;
  // Nine native decision bins produce 4.32 seconds of silence inside a 23-second gap.
  const frames = nativeFrames(duration, (i) => ({ musicScore: i >= 50 && i < 59 ? 0 : 0.95 }));
  // Relax the ratio to isolate the maximum-break rule from the stricter default ratio.
  const result = bridgeMusicGaps(frames, duration, [region(0, 20), region(43, 65)], {
    minimumSupportRatio: 0.8,
  });

  const [gap] = result.bridges;
  assert.ok(gap.meanMusicScore > result.configuration.minimumMusicScore);
  assert.ok(gap.supportRatio >= result.configuration.minimumSupportRatio);
  near(gap.longestBreakSeconds, 4.32, "continuous silence duration");
  assert.deepEqual(gap.rejectionReasons, ["continuous_music_break_or_speech"]);
  assert.equal(gap.merged, false);
  assert.equal(result.segments.length, 2);
});

test("continuous music cannot bridge a gap longer than the configured limit", () => {
  const duration = 80;
  const result = bridgeMusicGaps(nativeFrames(duration), duration, [region(0, 20), region(51, 75)]);

  assert.equal(result.bridges[0].gapSeconds, 31);
  near(result.bridges[0].supportRatio, 1, "music support still passes");
  assert.deepEqual(result.bridges[0].rejectionReasons, ["gap_too_long"]);
  assert.equal(result.segments.length, 2);
});

test("a passing gap followed by a failed gap merges only the first pair", () => {
  const duration = 95;
  const frames = nativeFrames(duration, (_i, start) => ({
    speechScore: start >= 64.8 && start < 75.36 ? 0.9 : 0.05,
  }));
  const source = [region(0, 20), region(43, 65), region(75, 90)];
  const result = bridgeMusicGaps(frames, duration, source);

  assert.deepEqual(
    result.bridges.map((gap) => gap.merged),
    [true, false],
  );
  assert.deepEqual(
    result.segments.map((s) => [s.startSeconds, s.endSeconds]),
    [
      [0, 65],
      [75, 90],
    ],
  );
  assert.deepEqual(
    result.segments.map((s) => s.singingRegions.length),
    [2, 1],
  );
  assert.deepEqual(
    result.segments.map((s) => s.instrumentalBridges.length),
    [1, 0],
  );
  assert.deepEqual(
    result.segments.flatMap((s) => s.singingRegions),
    source,
    "the rejected second gap must neither discard nor extend a source region",
  );
});

test("fractional gap-edge bins are weighted by their actual overlap, not their count", () => {
  const duration = 3;
  // Gap [1.1, 1.6): good bin [0.96, 1.44) contributes 0.34 seconds;
  // bad bin [1.44, 1.92) contributes only 0.16 seconds.
  const frames = nativeFrames(duration, (i) => ({ musicScore: i === 3 ? 0 : 1 }));
  const result = bridgeMusicGaps(frames, duration, [region(0, 1.1), region(1.6, 3)], {
    minimumSupportRatio: 0.6,
  });

  const [gap] = result.bridges;
  near(gap.coveredSeconds, 0.5, "gap coverage");
  near(gap.supportSeconds, 0.34, "clipped good bin duration");
  near(gap.supportRatio, 0.68, "time-weighted support, rather than 1 / 2");
  near(gap.meanMusicScore, 0.68, "time-weighted mean music");
  near(gap.longestBreakSeconds, 0.16, "clipped failed bin duration");
  assert.equal(gap.merged, true);
  assert.equal(result.segments.length, 1);
  assert.equal(result.segments[0].endSeconds, duration);
});
