import { describe, it, expect } from "vitest";
import { FFmpegPreset } from "../../src/presets/ffmpegPreset.js";
import type { VideoCodec, FfmpegOptions } from "@biliLive-tools/types";

describe("FFmpegPreset", () => {
  const mockGlobalConfig = {
    ffmpegPresetPath: "test/path",
  };

  describe("validate", () => {
    const ffmpegPreset = new FFmpegPreset({ globalConfig: mockGlobalConfig });

    it("应该通过有效的配置验证", () => {
      const validConfig: FfmpegOptions = {
        encoder: "libx264" as VideoCodec,
        preset: "fast",
        resetResolution: false,
        resolutionWidth: 1920,
        resolutionHeight: 1080,
      };

      expect(() => ffmpegPreset.validate(validConfig)).not.toThrow();
    });

    it("应该抛出错误当使用无效的编码器", () => {
      const invalidEncoderConfig: FfmpegOptions = {
        encoder: "invalid_encoder" as VideoCodec,
        preset: "fast",
        resetResolution: false,
      };

      expect(() => ffmpegPreset.validate(invalidEncoderConfig)).toThrow("无效的编码器");
    });

    it("应该抛出错误当使用无效的preset参数", () => {
      const invalidPresetConfig: FfmpegOptions = {
        encoder: "libx264" as VideoCodec,
        preset: "invalid_preset" as any,
        resetResolution: false,
      };

      expect(() => ffmpegPreset.validate(invalidPresetConfig)).toThrow("无效的preset参数");
    });

    it("应该抛出错误当分辨率为0", () => {
      const zeroResolutionConfig: FfmpegOptions = {
        encoder: "libx264" as VideoCodec,
        preset: "fast",
        resetResolution: true,
        resolutionWidth: 0,
        resolutionHeight: 1080,
      };

      expect(() => ffmpegPreset.validate(zeroResolutionConfig)).toThrow("分辨率参数不得为0");
    });

    it("应该抛出错误当分辨率都为负数", () => {
      const negativeResolutionConfig: FfmpegOptions = {
        encoder: "libx264" as VideoCodec,
        preset: "fast",
        resetResolution: true,
        resolutionWidth: -1920,
        resolutionHeight: -1080,
      };

      expect(() => ffmpegPreset.validate(negativeResolutionConfig)).toThrow(
        "分辨率参数不得都为负数",
      );
    });

    it("应该通过验证当resetResolution为false时忽略分辨率参数", () => {
      const config: FfmpegOptions = {
        encoder: "libx264" as VideoCodec,
        preset: "fast",
        resetResolution: false,
        resolutionWidth: 0,
        resolutionHeight: 0,
      };

      expect(() => ffmpegPreset.validate(config)).not.toThrow();
    });
  });
});
