import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, describe, it } from "vitest";
import { escaped, countByIntervalInSeconds, getHardwareAcceleration } from "../../src/utils/index";

export const __dirname = dirname(fileURLToPath(import.meta.url));

describe("escaped", () => {
  it("should escape special characters in the string", () => {
    const input = "C:\\path\\to\\file.txt";
    const output = escaped(input);
    expect(output).toEqual("C\\\\:/path/to/file.txt");
  });

  it("should escape colons in the string", () => {
    const input = "file:with:colons.txt";
    const output = escaped(input);
    expect(output).toEqual("file\\\\:with\\\\:colons.txt");
  });

  // Add more test cases if needed
});

describe.concurrent("getHardwareAcceleration", () => {
  it("should return 'nvenc' for NVIDIA encoder", () => {
    const encoder = "h264_nvenc";
    const acceleration = getHardwareAcceleration(encoder);
    expect(acceleration).toEqual("nvenc");
  });

  it("should return 'qsv' for Intel Quick Sync Video encoder", () => {
    const encoder = "h264_qsv";
    const acceleration = getHardwareAcceleration(encoder);
    expect(acceleration).toEqual("qsv");
  });

  it("should return 'amf' for AMD Advanced Media Framework encoder", () => {
    const encoder = "h264_amf";
    const acceleration = getHardwareAcceleration(encoder);
    expect(acceleration).toEqual("amf");
  });

  it("should return 'copy' for 'copy' encoder", () => {
    const encoder = "copy";
    const acceleration = getHardwareAcceleration(encoder);
    expect(acceleration).toEqual("copy");
  });

  it("should return 'cpu' for software encoders", () => {
    const encoder = "libx264";
    const acceleration = getHardwareAcceleration(encoder);
    expect(acceleration).toEqual("cpu");
  });

  it("should throw an error for unknown encoder", () => {
    const encoder = "unknown_encoder";
    expect(() => {
      // @ts-ignore
      getHardwareAcceleration(encoder);
    }).toThrowError("未知的编码器: unknown_encoder");
  });

  describe("countByIntervalInSeconds", () => {
    it("should return an empty array when times array is empty", () => {
      const times: number[] = [];
      const interval = 10;
      const maxTime = 100;
      const result = countByIntervalInSeconds(times, interval, maxTime);
      expect(result).toEqual([
        {
          start: 0,
          count: 0,
        },
        {
          start: 10,
          count: 0,
        },
        {
          start: 20,
          count: 0,
        },
        {
          start: 30,
          count: 0,
        },
        {
          start: 40,
          count: 0,
        },
        {
          start: 50,
          count: 0,
        },
        {
          start: 60,
          count: 0,
        },
        {
          start: 70,
          count: 0,
        },
        {
          start: 80,
          count: 0,
        },
        {
          start: 90,
          count: 0,
        },
        {
          start: 100,
          count: 0,
        },
      ]);
    });

    it("should count times correctly within intervals", () => {
      const times = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];
      const interval = 10;
      const maxTime = 100;
      const result = countByIntervalInSeconds(times, interval, maxTime);
      expect(result).toEqual([
        { start: 0, count: 1 },
        { start: 10, count: 1 },
        { start: 20, count: 1 },
        { start: 30, count: 1 },
        { start: 40, count: 1 },
        { start: 50, count: 1 },
        { start: 60, count: 1 },
        { start: 70, count: 1 },
        { start: 80, count: 1 },
        { start: 90, count: 1 },
        { start: 100, count: 0 },
      ]);
    });

    it("should handle times that exceed maxTime", () => {
      const times = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 105];
      const interval = 10;
      const maxTime = 100;
      const result = countByIntervalInSeconds(times, interval, maxTime);
      expect(result).toEqual([
        { start: 0, count: 1 },
        { start: 10, count: 1 },
        { start: 20, count: 1 },
        { start: 30, count: 1 },
        { start: 40, count: 1 },
        { start: 50, count: 1 },
        { start: 60, count: 1 },
        { start: 70, count: 1 },
        { start: 80, count: 1 },
        { start: 90, count: 1 },
        { start: 100, count: 0 },
      ]);
    });

    it("should fill intervals with zero counts if no times fall within them", () => {
      const times = [25, 45, 65, 85];
      const interval = 10;
      const maxTime = 100;
      const result = countByIntervalInSeconds(times, interval, maxTime);
      expect(result).toEqual([
        { start: 0, count: 0 },
        { start: 10, count: 0 },
        { start: 20, count: 1 },
        { start: 30, count: 0 },
        { start: 40, count: 1 },
        { start: 50, count: 0 },
        { start: 60, count: 1 },
        { start: 70, count: 0 },
        { start: 80, count: 1 },
        { start: 90, count: 0 },
        { start: 100, count: 0 },
      ]);
    });

    it("should handle times that fall exactly on interval boundaries", () => {
      const times = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const interval = 10;
      const maxTime = 100;
      const result = countByIntervalInSeconds(times, interval, maxTime);
      expect(result).toEqual([
        { start: 0, count: 0 },
        { start: 10, count: 1 },
        { start: 20, count: 1 },
        { start: 30, count: 1 },
        { start: 40, count: 1 },
        { start: 50, count: 1 },
        { start: 60, count: 1 },
        { start: 70, count: 1 },
        { start: 80, count: 1 },
        { start: 90, count: 1 },
        { start: 100, count: 0 },
      ]);
    });

    it("should handle times that with other interval", () => {
      const times = [10, 20, 30];
      const interval = 6;
      const maxTime = 31;
      const result = countByIntervalInSeconds(times, interval, maxTime);
      expect(result).toEqual([
        { start: 0, count: 0 },
        { start: 6, count: 1 },
        { start: 12, count: 0 },
        { start: 18, count: 1 },
        { start: 24, count: 0 },
        { start: 30, count: 1 },
      ]);
    });
  });
});
