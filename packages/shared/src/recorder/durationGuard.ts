export interface RecordingDurationAnomaly {
  wallDuration: number;
  mediaDuration: number;
  durationRatio: number;
}

export interface RecordingDurationCheckOptions {
  recordStartTime: number;
  recordEndTime: number;
  mediaDuration: number;
  minWallDuration?: number;
  minDurationRatio?: number;
}

/**
 * Detects a media timeline that advanced significantly slower than wall-clock time.
 * Durations are expressed in seconds, timestamps in milliseconds.
 */
export function checkRecordingDuration({
  recordStartTime,
  recordEndTime,
  mediaDuration,
  minWallDuration = 60,
  minDurationRatio = 0.8,
}: RecordingDurationCheckOptions): RecordingDurationAnomaly | null {
  const wallDuration = (recordEndTime - recordStartTime) / 1000;
  if (
    !Number.isFinite(wallDuration) ||
    !Number.isFinite(mediaDuration) ||
    wallDuration <= minWallDuration ||
    mediaDuration <= 0
  ) {
    return null;
  }

  const durationRatio = mediaDuration / wallDuration;
  if (durationRatio >= minDurationRatio) return null;

  return {
    wallDuration,
    mediaDuration,
    durationRatio,
  };
}

export function getRecordingCompletionAction(anomaly: RecordingDurationAnomaly | null): {
  shouldRunPostProcess: boolean;
  externalEvent: "file_completed" | "file_error";
  webhookEvent: "FileClosed" | "FileError";
} {
  if (anomaly) {
    return {
      shouldRunPostProcess: false,
      externalEvent: "file_error",
      webhookEvent: "FileError",
    };
  }

  return {
    shouldRunPostProcess: true,
    externalEvent: "file_completed",
    webhookEvent: "FileClosed",
  };
}
