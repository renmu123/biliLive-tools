import { test } from "vitest";
import assert from "node:assert/strict";
import { extendMusicEdges } from "../../src/musicDetector/yamnet/extend-segments.js";

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
      musicScore: 1,
      speechScore: 0.05,
      singingScore: 0,
      ...getScores(frameIndex, startSeconds),
    };
  });
}

function region(startSeconds, endSeconds) {
  return {
    startSeconds,
    endSeconds,
    singingRegions: [{ startSeconds, endSeconds, selected: true }],
    instrumentalBridges: [],
  };
}

function near(actual, expected, message) {
  assert.ok(
    Math.abs(actual - expected) < 1e-8,
    `${message}: expected ${expected}, received ${actual}`,
  );
}

test("music intro and outro extend both edges while preserving singing regions and bridges", () => {
  const duration = 45;
  const frames = nativeFrames(duration, (i) => ({
    musicScore: i >= 10 && i < 70 ? 0.9 : 0,
    singingScore: (i >= 20 && i < 36) || (i >= 40 && i < 60) ? 0.8 : 0,
  }));
  const source = [
    {
      ...region(9.6, 28.8),
      singingRegions: [
        { startSeconds: 9.6, endSeconds: 17.28, selected: true },
        { startSeconds: 19.2, endSeconds: 28.8, selected: true },
      ],
      instrumentalBridges: [{ startSeconds: 17.28, endSeconds: 19.2, merged: true }],
      fullIntervalMeanMusic: 0.1,
    },
  ];
  const original = structuredClone(source);
  const result = extendMusicEdges(frames, duration, source);

  assert.equal(result.segments.length, 1);
  const [extended] = result.segments;
  near(extended.startSeconds, 4.8, "intro start");
  near(extended.endSeconds, 33.6, "outro end");
  assert.equal(extended.originalStartSeconds, 9.6);
  assert.equal(extended.originalEndSeconds, 28.8);
  near(extended.edgeExtensions.before.addedSeconds, 4.8, "intro added duration");
  near(extended.edgeExtensions.after.addedSeconds, 4.8, "outro added duration");
  assert.deepEqual(extended.singingRegions, original[0].singingRegions);
  assert.deepEqual(extended.instrumentalBridges, original[0].instrumentalBridges);
  near(extended.fullIntervalMeanMusic, 0.9, "updated whole-interval music mean");
  near(extended.fullIntervalMeanSinging, 0.48, "updated whole-interval singing mean");
  assert.deepEqual(source, original, "extension must not mutate the caller's regions");
});

test("speech over continuous BGM blocks expansion at both existing boundaries", () => {
  const duration = 45;
  const frames = nativeFrames(duration, (i) => ({ speechScore: i < 20 || i >= 60 ? 0.9 : 0.05 }));
  const result = extendMusicEdges(frames, duration, [region(9.6, 28.8)]);

  const [segment] = result.segments;
  near(segment.startSeconds, 9.6, "start stays at singing evidence");
  near(segment.endSeconds, 28.8, "end stays at singing evidence");
  for (const edge of Object.values(segment.edgeExtensions)) {
    assert.equal(edge.addedSeconds, 0);
    assert.equal(edge.stopReason, "sustained_nonmusic_or_speech");
    assert.equal(edge.acceptedEvidence, null);
  }
});

test("sustained silence prevents a leap to otherwise suitable music farther away", () => {
  const duration = 60;
  const frames = nativeFrames(duration, (i) => ({
    musicScore: (i >= 30 && i < 35) || (i >= 85 && i < 90) ? 0 : 1,
  }));
  const result = extendMusicEdges(frames, duration, [region(19.2, 38.4)]);

  const [segment] = result.segments;
  near(segment.startSeconds, 16.8, "left edge stops at the near side of silence");
  near(segment.endSeconds, 40.8, "right edge stops at the near side of silence");
  assert.equal(segment.edgeExtensions.before.stopReason, "sustained_nonmusic_or_speech");
  assert.equal(segment.edgeExtensions.after.stopReason, "sustained_nonmusic_or_speech");
});

test("a brief internal dropout is tolerated but terminal unsupported audio is not appended", () => {
  const duration = 30;
  const frames = nativeFrames(duration, (i) => ({
    musicScore: i >= 10 && i < 40 && i !== 30 ? 1 : 0,
  }));
  const result = extendMusicEdges(frames, duration, [region(4.8, 9.6)]);

  const [segment] = result.segments;
  near(segment.startSeconds, 4.8, "no music before the source region");
  near(segment.endSeconds, 19.2, "accepted tail ends on supported audio");
  near(segment.edgeExtensions.after.addedSeconds, 9.6, "tail includes the short internal dropout");
  near(
    segment.edgeExtensions.after.acceptedEvidence.supportRatio,
    0.95,
    "duration-weighted accepted support",
  );
  near(segment.edgeExtensions.after.acceptedEvidence.longestBreakSeconds, 0.48, "one-bin dropout");
});

test("default and fractional custom extension caps bound otherwise continuous music", () => {
  const duration = 120;
  const frames = nativeFrames(duration);
  for (const options of [{}, { maximumLeadSeconds: 2.3, maximumTailSeconds: 3.7 }]) {
    const result = extendMusicEdges(frames, duration, [region(40, 60)], options);
    const [segment] = result.segments;
    const lead = options.maximumLeadSeconds ?? 30;
    const tail = options.maximumTailSeconds ?? 30;
    near(segment.startSeconds, 40 - lead, "bounded intro start");
    near(segment.endSeconds, 60 + tail, "bounded outro end");
    for (const edge of Object.values(segment.edgeExtensions)) {
      assert.equal(edge.stopReason, "maximum_extension");
      assert.equal(edge.acceptedBoundaryAtLimit, true);
    }
  }
});

test("neighbor midpoints prevent overlap while touching expanded segments stay separate", () => {
  const duration = 60;
  const source = [region(10, 20), region(30, 40)];
  const result = extendMusicEdges(nativeFrames(duration), duration, source);

  assert.equal(result.segments.length, 2, "expansion must not merge touching regions");
  const [first, second] = result.segments;
  near(first.startSeconds, 0, "first region reaches file start");
  near(first.endSeconds, 25, "first region ends at midpoint");
  near(second.startSeconds, 25, "second region starts at midpoint");
  near(second.endSeconds, duration, "second region reaches file end");
  assert.equal(first.edgeExtensions.after.stopReason, "neighbor_midpoint");
  assert.equal(second.edgeExtensions.before.stopReason, "neighbor_midpoint");
  assert.deepEqual(
    result.segments.map((s) => s.singingRegions),
    source.map((s) => s.singingRegions),
  );
});

test("fractional file endpoints clip expansion and its duration statistics", () => {
  const duration = 10.13;
  const result = extendMusicEdges(nativeFrames(duration), duration, [region(2.13, 7.91)]);

  const [segment] = result.segments;
  near(segment.startSeconds, 0, "file start");
  near(segment.endSeconds, duration, "file end");
  near(segment.edgeExtensions.before.addedSeconds, 2.13, "clipped intro duration");
  near(segment.edgeExtensions.after.addedSeconds, 2.22, "clipped outro duration");
  near(segment.fullIntervalMeanMusic, 1, "whole interval is covered exactly once");
});

test("a boundary inside the final held frame can extend beyond its nominal next hop to EOF", () => {
  const duration = 10.13;
  const frames = nativeFrames(duration);
  near(frames.at(-1).startSeconds, 9.6, "last native frame start");
  assert.ok(10.1 > frames.at(-1).startSeconds + NATIVE_HOP);
  const result = extendMusicEdges(frames, duration, [region(1, 10.1)], { maximumLeadSeconds: 0 });

  near(
    result.segments[0].endSeconds,
    duration,
    "the last held frame remains available through EOF",
  );
  near(result.segments[0].edgeExtensions.after.addedSeconds, 0.03, "remaining held tail duration");
});

test("without accepted singing regions, music does not create a new candidate", () => {
  for (const frames of [[], nativeFrames(20)]) {
    const result = extendMusicEdges(frames, 20, []);
    assert.deepEqual(result.segments, []);
    assert.deepEqual(result.diagnostics, []);
  }
});

test("missing frames or invalid audio duration fail explicitly", () => {
  assert.throws(() => extendMusicEdges([], 20, [region(1, 5)]), /without frames/);
  for (const duration of [0, -1, NaN, Infinity]) {
    assert.throws(() => extendMusicEdges([], duration, []), /Invalid audioSeconds/);
  }
});

test("fractional bins determine support by elapsed time rather than number of bins", () => {
  const duration = 4;
  // Tail [1.6, 2.1): unsupported [1.6, 1.92) is 0.32 seconds;
  // supported [1.92, 2.1) is 0.18 seconds, giving a support ratio of 0.36.
  const frames = nativeFrames(duration, (i) => ({ musicScore: i === 3 ? 0 : 1 }));
  const options = { maximumLeadSeconds: 0, maximumTailSeconds: 0.5 };
  const blocked = extendMusicEdges(frames, duration, [region(0.48, 1.6)], {
    ...options,
    minimumSupportRatio: 0.4,
  });
  const accepted = extendMusicEdges(frames, duration, [region(0.48, 1.6)], {
    ...options,
    minimumSupportRatio: 0.35,
  });

  near(blocked.segments[0].endSeconds, 1.6, "0.36 support does not meet a 0.4 threshold");
  near(accepted.segments[0].endSeconds, 2.1, "0.36 support meets a 0.35 threshold");
  near(
    accepted.segments[0].edgeExtensions.after.acceptedEvidence.supportRatio,
    0.36,
    "weighted tail support",
  );
  near(
    accepted.segments[0].fullIntervalMeanMusic,
    1.14 / 1.62,
    "weighted whole-interval music mean",
  );
});
