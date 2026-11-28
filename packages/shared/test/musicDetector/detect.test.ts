import { describe, expect, it } from "vitest";
import {
  detectSingingSegments,
  isAudioAnalysis,
  normalizeConfig,
} from "../../src/musicDetector/yamnet/detect.js";

describe("YAMNet configuration and score cache", () => {
  it("uses the final demo preset, including bridges and edges", () => {
    expect(normalizeConfig()).toMatchObject({
      disableCache: true,
      startThreshold: 0.015,
      sustainThreshold: 0.01,
      contextFrames: 21,
      boundarySmoothingFrames: 5,
      decisionHopSeconds: 0.96,
      minimumSeedSeconds: 4.8,
      minSegmentDuration: 20,
      maxGapDuration: 12,
      bridgeMusicGaps: true,
      extendMusicEdges: true,
    });
  });
  it.each([
    { startThreshold: 0 },
    { sustainThreshold: 0.9 },
    { maximumSeedSpeech: 2 },
    { contextFrames: 20 },
    { boundarySmoothingFrames: 0 },
    { decisionHopSeconds: 1 },
    { bridgeMaxGapSeconds: -1 },
    { maximumLeadSeconds: NaN },
    { minimumSeedSeconds: Infinity },
    { disableCache: "false" },
    { minSegmentDuration: null },
  ])("rejects invalid options %j", (options) => {
    expect(() => normalizeConfig(options as any)).toThrow();
  });
  it("does not interpret legacy energy settings as singing scores", () => {
    expect(normalizeConfig({ energyPercentile: 90, smoothWindowSize: 4 } as any)).toEqual(
      normalizeConfig(),
    );
  });
  it("rejects stale feature formats, invalid scores and missing tail frames", () => {
    const valid = {
      audioSeconds: 0.5,
      frames: [
        { startSeconds: 0, endSeconds: 0.5, singingScore: 0, speechScore: 0, musicScore: 0 },
      ],
    };
    expect(isAudioAnalysis(valid)).toBe(true);
    expect(isAudioAnalysis([])).toBe(false);
    expect(isAudioAnalysis({ ...valid, frames: [] })).toBe(false);
    expect(isAudioAnalysis({ ...valid, frames: [{ ...valid.frames[0], musicScore: NaN }] })).toBe(
      false,
    );
    expect(isAudioAnalysis({ ...valid, audioSeconds: 3 })).toBe(false);
    expect(detectSingingSegments(valid, normalizeConfig())).toEqual([]);
  });
  it("returns the existing API time fields in seconds", () => {
    const audioSeconds = 40;
    const frames = Array.from({ length: 83 }, (_, i) => ({
      startSeconds: i * 0.48,
      endSeconds: Math.min(audioSeconds, i * 0.48 + 0.975),
      singingScore: 0.1,
      speechScore: 0,
      musicScore: 0.9,
    }));
    expect(detectSingingSegments({ audioSeconds, frames }, normalizeConfig())).toEqual([
      { startTime: 0, endTime: 40 },
    ]);
  });
});
