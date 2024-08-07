import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, describe, it } from "vitest";
import { escaped } from "../../src/utils/index";
import { getHardwareAcceleration } from "../../src/utils/index";

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
});
