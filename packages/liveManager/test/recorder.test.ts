import { describe, expect, it } from "vitest";

import { selectRecorder, getSourceFormatName } from "../src/recorder/index";

describe.concurrent("selectRecorder", () => {
  it("should return 'ffmpeg' when preferredRecorder is 'auto'", () => {
    const result = selectRecorder("auto");
    expect(result).toBe("ffmpeg");
  });

  it("should return 'ffmpeg' when preferredRecorder is 'ffmpeg'", () => {
    const result = selectRecorder("ffmpeg");
    expect(result).toBe("ffmpeg");
  });

  it("should return 'mesio' when preferredRecorder is 'mesio'", () => {
    const result = selectRecorder("mesio");
    expect(result).toBe("mesio");
  });

  it("should return 'bililive' when preferredRecorder is 'bililive'", () => {
    const result = selectRecorder("bililive");
    expect(result).toBe("bililive");
  });

  it("should return 'ffmpeg' as default for any other value", () => {
    // @ts-ignore - testing runtime behavior with invalid input
    const result = selectRecorder("invalid");
    expect(result).toBe("ffmpeg");
  });
});

describe.concurrent("getSourceFormatName", () => {
  it("should return the provided formatName when it is defined", () => {
    const result = getSourceFormatName("https://example.com/stream", "flv");
    expect(result).toBe("flv");
  });

  it("should return 'ts' when streamUrl contains '.m3u8'", () => {
    const result = getSourceFormatName("https://example.com/stream.m3u8", undefined);
    expect(result).toBe("ts");
  });

  it("should return 'fmp4' when streamUrl contains '.m4s'", () => {
    const result = getSourceFormatName("https://example.com/stream.m4s", undefined);
    expect(result).toBe("fmp4");
  });

  it("should return 'flv' as default when streamUrl doesn't contain '.m3u8' or '.m4s'", () => {
    const result = getSourceFormatName("https://example.com/stream.mp4", undefined);
    expect(result).toBe("flv");
  });

  it("should prioritize formatName over streamUrl detection", () => {
    const result = getSourceFormatName("https://example.com/stream.m3u8", "fmp4");
    expect(result).toBe("fmp4");
  });

  it("should handle empty streamUrl and return 'flv' when formatName is undefined", () => {
    const result = getSourceFormatName("", undefined);
    expect(result).toBe("flv");
  });

  it("should handle streamUrl with multiple format extensions and detect the first match", () => {
    const result = getSourceFormatName("https://example.com/stream.m3u8.m4s", undefined);
    expect(result).toBe("ts");
  });
});
