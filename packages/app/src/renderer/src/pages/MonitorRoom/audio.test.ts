import { describe, expect, it } from "vitest";
import { normalizeRoomAudio } from "./audio";

describe("monitor room audio", () => {
  it("uses safe defaults for missing or non-finite saved values", () => {
    expect(normalizeRoomAudio(undefined)).toEqual({ muted: true, volume: 0.7 });
    expect(normalizeRoomAudio({ muted: false })).toEqual({ muted: false, volume: 0.7 });
    expect(normalizeRoomAudio({ muted: false, volume: Number.NaN })).toEqual({
      muted: false,
      volume: 0.7,
    });
    expect(normalizeRoomAudio({ volume: Number.POSITIVE_INFINITY })).toEqual({
      muted: true,
      volume: 0.7,
    });
  });

  it("preserves valid volume and bounds values to the player range", () => {
    expect(normalizeRoomAudio({ muted: false, volume: 0 })).toEqual({ muted: false, volume: 0 });
    expect(normalizeRoomAudio({ muted: true, volume: 2 })).toEqual({ muted: true, volume: 1 });
  });
});
