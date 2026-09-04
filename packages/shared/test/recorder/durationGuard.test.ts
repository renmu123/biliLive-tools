import { describe, expect, it } from "vitest";

import {
  checkRecordingDuration,
  getRecordingCompletionAction,
} from "../../src/recorder/durationGuard.js";

describe("checkRecordingDuration", () => {
  it("accepts a normal 30-minute recording", () => {
    expect(
      checkRecordingDuration({
        recordStartTime: 0,
        recordEndTime: 30 * 60 * 1000,
        mediaDuration: 29 * 60 + 58,
      }),
    ).toBeNull();
  });

  it("detects the incident where 1:41:25 of recording became 23:40 of media", () => {
    const result = checkRecordingDuration({
      recordStartTime: 0,
      recordEndTime: 6085 * 1000,
      mediaDuration: 1420,
    });

    expect(result).not.toBeNull();
    expect(result?.wallDuration).toBe(6085);
    expect(result?.mediaDuration).toBe(1420);
    expect(result?.durationRatio).toBeCloseTo(1420 / 6085);
  });

  it("does not judge recordings at or below the minimum wall duration", () => {
    expect(
      checkRecordingDuration({
        recordStartTime: 0,
        recordEndTime: 60 * 1000,
        mediaDuration: 10,
      }),
    ).toBeNull();
  });

  it("does not treat missing ffprobe duration as a proven timeline anomaly", () => {
    expect(
      checkRecordingDuration({
        recordStartTime: 0,
        recordEndTime: 10 * 60 * 1000,
        mediaDuration: 0,
      }),
    ).toBeNull();
  });

  it("accepts the configured ratio boundary", () => {
    expect(
      checkRecordingDuration({
        recordStartTime: 0,
        recordEndTime: 100 * 1000,
        mediaDuration: 80,
      }),
    ).toBeNull();
  });

  it("routes anomalous files to error events without automatic post-processing", () => {
    const anomaly = checkRecordingDuration({
      recordStartTime: 0,
      recordEndTime: 6085 * 1000,
      mediaDuration: 1420,
    });

    expect(getRecordingCompletionAction(anomaly)).toEqual({
      shouldRunPostProcess: false,
      externalEvent: "file_error",
      webhookEvent: "FileError",
    });
  });

  it("keeps the normal completion route for healthy files", () => {
    expect(getRecordingCompletionAction(null)).toEqual({
      shouldRunPostProcess: true,
      externalEvent: "file_completed",
      webhookEvent: "FileClosed",
    });
  });
});
