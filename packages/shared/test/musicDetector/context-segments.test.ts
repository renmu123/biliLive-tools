import { test } from "vitest";
import assert from "node:assert/strict";
import {
  detectContextSegments,
  normalizeContextOptions,
} from "../../src/musicDetector/yamnet/context-segments.js";

const NATIVE_HOP = 0.48;
const WAVEFORM_SUPPORT = 0.975;
const options = {
  contextFrames: 1,
  boundarySmoothingFrames: 1,
  decisionHopSeconds: 0.96,
  startThreshold: 0.6,
  sustainThreshold: 0.25,
  maximumSeedSpeech: 0.2,
  minimumSeedSeconds: 2.88,
  mergeGapSeconds: 4,
  minimumSeconds: 20,
};

// Simulate the native score timeline, including its final padded waveform frame.
function nativeFrames(audioSeconds, getScores) {
  const count = 1 + Math.ceil(Math.max(0, audioSeconds - WAVEFORM_SUPPORT) / NATIVE_HOP);
  return Array.from({ length: count }, (_, frameIndex) => {
    const startSeconds = frameIndex * NATIVE_HOP;
    return {
      frameIndex,
      startSeconds,
      endSeconds: Math.min(audioSeconds, startSeconds + WAVEFORM_SUPPORT),
      singingScore: 0,
      speechScore: 0,
      ...getScores(frameIndex),
    };
  });
}

function near(actual, expected, message) {
  assert.ok(
    Math.abs(actual - expected) < 1e-8,
    `${message}: expected ${expected}, received ${actual}`,
  );
}

test("separated high-score blips do not become a sustained seed when their candidate is merged", () => {
  const duration = 40;
  const frames = nativeFrames(duration, (i) => ({ singingScore: i % 8 === 0 ? 0.9 : 0 }));
  const result = detectContextSegments(frames, duration, options);

  assert.equal(result.diagnostics.length, 1, "the short gaps produce one candidate for evaluation");
  assert.ok(result.diagnostics[0].endSeconds - result.diagnostics[0].startSeconds > 20);
  assert.ok(
    result.diagnostics[0].seedDecisionSeconds > options.minimumSeedSeconds,
    "there is enough cumulative evidence, but it is not sustained",
  );
  assert.ok(result.diagnostics[0].longestSeedRunSeconds < options.minimumSeedSeconds);
  assert.equal(result.segments.length, 0);
});

test("a sustained low-speech seed preserves fine boundaries despite speech around it", () => {
  const duration = 40;
  const frames = nativeFrames(duration, (i) => ({
    singingScore: i >= 8 && i < 72 ? 0.8 : 0,
    speechScore: i >= 30 && i < 50 ? 0.02 : 0.9,
  }));
  const result = detectContextSegments(frames, duration, {
    ...options,
    contextFrames: 5,
    minimumSeedSeconds: 4.8,
  });

  assert.equal(result.segments.length, 1);
  const [segment] = result.segments;
  near(segment.startSeconds, frames[8].startSeconds, "start stays at fine-scale singing support");
  near(segment.endSeconds, frames[71].endSeconds, "end stays at fine-scale singing support");
  assert.ok(
    segment.fullIntervalMeanSpeech > options.maximumSeedSpeech,
    "surrounding speech must not veto or trim a segment that contains a qualifying seed",
  );
  assert.ok(segment.longestSeedRunSeconds >= 4.8);
});

test("singing scores with speech dominant throughout do not produce a selected segment", () => {
  const duration = 40;
  const frames = nativeFrames(duration, (i) => ({
    singingScore: i >= 8 && i < 72 ? 0.8 : 0,
    speechScore: 0.9,
  }));
  const result = detectContextSegments(frames, duration, { ...options, contextFrames: 5 });

  assert.equal(result.diagnostics.length, 1);
  assert.equal(result.segments.length, 0);
  assert.equal(result.diagnostics[0].longestSeedRunSeconds, 0);
  assert.equal(result.diagnostics[0].rejectionReason, "no_sustained_low_speech_singing_seed");
});

test("seed duration uses held decision intervals at each supported stride", () => {
  const duration = 40;
  // A 9.6-second low-speech interval aligned to all three decision grids.
  const frames = nativeFrames(duration, (i) => ({
    singingScore: 0.8,
    speechScore: i >= 20 && i < 40 ? 0.02 : 0.9,
  }));

  for (const decisionHopSeconds of [0.48, 0.96, 1.92]) {
    const result = detectContextSegments(frames, duration, {
      ...options,
      decisionHopSeconds,
      minimumSeedSeconds: 9.5,
    });
    assert.equal(result.segments.length, 1, `qualifies at stride ${decisionHopSeconds}`);
    near(
      result.segments[0].longestSeedRunSeconds,
      9.6,
      `continuous duration at stride ${decisionHopSeconds}`,
    );
    near(
      result.segments[0].seedDecisionSeconds,
      9.6,
      `total duration at stride ${decisionHopSeconds}`,
    );
  }
});

test("a held seed that crosses the candidate start contributes its overlapping duration", () => {
  const duration = 40;
  const frames = nativeFrames(duration, (i) => ({
    singingScore: i >= 1 && i < 70 ? 0.8 : 0,
    speechScore: i < 10 ? 0 : 0.9,
  }));
  const result = detectContextSegments(frames, duration, {
    ...options,
    contextFrames: 5,
    startThreshold: 0.5,
    minimumSeedSeconds: 4.3,
  });

  assert.equal(
    result.decisions[0].seed,
    true,
    "the broad context establishes the initial held seed",
  );
  near(
    result.diagnostics[0].startSeconds,
    0.48,
    "fine support starts halfway through the first bin",
  );
  near(
    result.diagnostics[0].longestSeedRunSeconds,
    4.32,
    "only the seed overlap with the candidate counts",
  );
  assert.equal(result.segments.length, 1, "the partial first bin makes the sustained seed qualify");
});

test("the last decision covers the remaining waveform support without extending past the audio", () => {
  const duration = 28.1;
  const frames = nativeFrames(duration, () => ({ singingScore: 0.8, speechScore: 0 }));
  const result = detectContextSegments(frames, duration, options);

  assert.equal(result.segments.length, 1);
  near(result.decisions.at(-1).endSeconds, duration, "final decision reaches the audio end");
  for (let i = 0; i < result.decisions.length; i++) {
    const decision = result.decisions[i];
    assert.ok(decision.endSeconds > decision.startSeconds);
    assert.ok(decision.endSeconds <= duration);
    if (i > 0)
      near(
        result.decisions[i - 1].endSeconds,
        decision.startSeconds,
        "adjacent decisions cover continuously",
      );
  }
  near(result.segments[0].endSeconds, duration, "segment end is clamped");
  near(
    result.segments[0].longestSeedRunSeconds,
    duration,
    "the held seed includes the final waveform tail",
  );
});

test("an audio shorter than one decision bin contributes only its real duration", () => {
  const duration = 0.31;
  const frames = nativeFrames(duration, () => ({ singingScore: 0.8, speechScore: 0 }));
  const result = detectContextSegments(frames, duration, {
    ...options,
    contextFrames: 21,
    minimumSeconds: 0.1,
    minimumSeedSeconds: 0.1,
  });

  assert.equal(result.decisions.length, 1);
  assert.equal(result.decisions[0].contextFrameCount, 1);
  near(result.decisions[0].singingMean, 0.8, "truncated context is normalized by available frames");
  near(result.decisions[0].endSeconds, duration, "short bin end");
  assert.equal(result.segments.length, 1);
  near(result.segments[0].longestSeedRunSeconds, duration, "no artificial duration from padding");
  near(result.segments[0].endSeconds, duration, "short segment end");
});

test("a two-second decision hop is rejected instead of silently becoming 1.92 seconds", () => {
  assert.throws(
    () => normalizeContextOptions({ decisionHopSeconds: 2 }),
    /integer multiple of nativeHopSeconds/,
  );
  assert.equal(normalizeContextOptions({ decisionHopSeconds: 1.92 }).decisionHopSeconds, 1.92);
});
