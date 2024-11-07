import { describe, it, expect } from "vitest";
import { matchDanmaTimestamp } from "../../src/task/video.js";

describe("matchDanmaTimestamp", () => {
  it("should return the correct timestamp from a valid string", () => {
    const str = 'start_time = "2024-08-20T09:48:07.7164935+08:00"';
    const result = matchDanmaTimestamp(str);
    expect(result).toBe(1724118487); // Expected timestamp
  });

  it("should return the correct timestamp from a string with record_start_time", () => {
    const str = "<video_start_time>2024-11-06T15:14:02.000Z</video_start_time>";
    const result = matchDanmaTimestamp(str);
    expect(result).toBe(1730906042); // Expected timestamp
  });

  it("should return the correct timestamp from a string with record_start_time", () => {
    const str = "2121<record_start_time>2024-07-23T18:26:30+08:00</record_start_time>212";
    const result = matchDanmaTimestamp(str);
    expect(result).toBe(1721730390); // Expected timestamp
  });

  it("should return null if no timestamp is found", () => {
    const str = "no timestamp here";
    const result = matchDanmaTimestamp(str);
    expect(result).toBeNull();
  });
});
