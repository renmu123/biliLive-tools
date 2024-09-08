import { expect, describe, it } from "vitest";
import { genFfmpegParams, getHardwareAcceleration } from "../src/utils/index";
import { genMergeAssMp4Command } from "../src/task/video";
import type { FfmpegOptions, VideoCodec } from "@biliLive-tools/types";

describe.concurrent("通用ffmpeg参数生成", () => {
  it("视频编码器：h264_nvenc", () => {
    const input: FfmpegOptions = {
      encoder: "h264_nvenc",
      bitrateControl: "CQ",
      crf: 34,
      preset: "p4",
      audioCodec: "copy",
      bitrate: 8000,
      decode: true,
      extraOptions: "",
      bit10: false,
      resetResolution: false,
      resolutionWidth: 3840,
      resolutionHeight: 2160,
    };
    const output1 = genFfmpegParams(input);
    expect(output1).toEqual(["-c:v h264_nvenc", "-rc vbr", "-cq 34", "-preset p4", "-c:a copy"]);
  });
  it("有无preset参数", () => {
    const videoEncoders: VideoCodec[] = [
      "libx264",
      "h264_qsv",
      "h264_nvenc",
      "h264_amf",
      "libx265",
      "hevc_qsv",
      "hevc_nvenc",
      "hevc_amf",
      "libsvtav1",
      "av1_qsv",
      "av1_amf",
    ];
    for (const encoder of videoEncoders) {
      const input: FfmpegOptions = {
        encoder: encoder,
        bitrateControl: "CQ",
        crf: 34,
        preset: "p4",
        audioCodec: "copy",
        bitrate: 8000,
        decode: true,
        extraOptions: "",
        bit10: false,
        resetResolution: false,
        resolutionWidth: 3840,
        resolutionHeight: 2160,
      };
      const output = genFfmpegParams(input);
      const result = [`-c:v ${encoder}`, "-rc vbr", "-cq 34"];
      if (["cpu", "qsv", "nvenc"].includes(getHardwareAcceleration(encoder))) {
        result.push("-preset p4");
      }
      result.push("-c:a copy");
      expect(output).toEqual(result);
    }
  });
  it("额外参数", () => {
    const input: FfmpegOptions = {
      encoder: "h264_nvenc",
      bitrateControl: "CQ",
      crf: 34,
      preset: "p4",
      audioCodec: "copy",
      bitrate: 8000,
      decode: true,
      extraOptions: "-extra 00:00:00",
      bit10: false,
      resetResolution: false,
      resolutionWidth: 3840,
      resolutionHeight: 2160,
    };
    const output1 = genFfmpegParams(input);
    expect(output1).toEqual([
      "-c:v h264_nvenc",
      "-rc vbr",
      "-cq 34",
      "-preset p4",
      "-c:a copy",
      "-extra",
      "00:00:00",
    ]);
  });
  it("视频和音频编码器都是copy", () => {
    const input: FfmpegOptions = {
      encoder: "copy",
      bitrateControl: "CRF",
      crf: 28,
      preset: "p4",
      audioCodec: "copy",
      bitrate: 8000,
      decode: false,
      extraOptions: "",
      bit10: false,
      resetResolution: false,
      resolutionWidth: 3840,
      resolutionHeight: 2160,
    };
    const output1 = genFfmpegParams(input);
    expect(output1).toEqual(["-c:v copy", "-c:a copy"]);
  });
  it("音频编码器是flac", () => {
    const input: FfmpegOptions = {
      encoder: "copy",
      bitrateControl: "CRF",
      crf: 28,
      preset: "p4",
      audioCodec: "flac",
      bitrate: 8000,
      decode: false,
      extraOptions: "",
      bit10: false,
      resetResolution: false,
      resolutionWidth: 3840,
      resolutionHeight: 2160,
    };
    const output1 = genFfmpegParams(input);
    expect(output1).toEqual(["-c:v copy", "-c:a flac"]);
  });
  it("视频编码器是libsvtav1且使用10bit", () => {
    const input: FfmpegOptions = {
      encoder: "libsvtav1",
      bitrateControl: "CRF",
      crf: 28,
      preset: "p4",
      audioCodec: "flac",
      bitrate: 8000,
      decode: false,
      extraOptions: "",
      bit10: true,
      resetResolution: false,
      resolutionWidth: 3840,
      resolutionHeight: 2160,
    };
    const output1 = genFfmpegParams(input);
    expect(output1).toEqual([
      "-c:v libsvtav1",
      "-crf 28",
      "-preset p4",
      "-pix_fmt yuv420p10le",
      "-c:a flac",
    ]);
  });
  it("视频编码器是libsvtav1且是CRF模式", () => {
    const input: FfmpegOptions = {
      encoder: "libsvtav1",
      bitrateControl: "CRF",
      crf: 28,
      preset: "p4",
      audioCodec: "flac",
      bitrate: 8000,
      decode: false,
      extraOptions: "",
      bit10: true,
      resetResolution: false,
      resolutionWidth: 3840,
      resolutionHeight: 2160,
    };
    const output1 = genFfmpegParams(input);
    expect(output1).toEqual([
      "-c:v libsvtav1",
      "-crf 28",
      "-preset p4",
      "-pix_fmt yuv420p10le",
      "-c:a flac",
    ]);
  });
  it("视频编码器是libsvtav1且是VBR模式", () => {
    const input: FfmpegOptions = {
      encoder: "libsvtav1",
      bitrateControl: "VBR",
      crf: 28,
      preset: "p4",
      audioCodec: "flac",
      bitrate: 8000,
      decode: false,
      extraOptions: "",
      bit10: true,
      resetResolution: false,
      resolutionWidth: 3840,
      resolutionHeight: 2160,
    };
    const output1 = genFfmpegParams(input);
    expect(output1).toEqual([
      "-c:v libsvtav1",
      "-b:v 8000k",
      "-preset p4",
      "-pix_fmt yuv420p10le",
      "-c:a flac",
    ]);
  });
  it("视频编码器是h264_nvenc且是CQ模式", () => {
    const input: FfmpegOptions = {
      encoder: "h264_nvenc",
      bitrateControl: "CQ",
      crf: 28,
      preset: "p4",
      audioCodec: "flac",
      bitrate: 8000,
      decode: false,
      extraOptions: "",
      bit10: true,
      resetResolution: false,
      resolutionWidth: 3840,
      resolutionHeight: 2160,
    };
    const output1 = genFfmpegParams(input);
    expect(output1).toEqual(["-c:v h264_nvenc", "-rc vbr", "-cq 28", "-preset p4", "-c:a flac"]);
  });
  it("视频编码器是h264_qsv且是ICQ模式", () => {
    const input: FfmpegOptions = {
      encoder: "h264_qsv",
      bitrateControl: "ICQ",
      crf: 28,
      preset: "p4",
      audioCodec: "flac",
      bitrate: 8000,
      decode: false,
      extraOptions: "",
      bit10: true,
      resetResolution: false,
      resolutionWidth: 3840,
      resolutionHeight: 2160,
    };
    const output1 = genFfmpegParams(input);
    expect(output1).toEqual(["-c:v h264_qsv", "-global_quality 28", "-preset p4", "-c:a flac"]);
  });
  it("设置分辨率", () => {
    const input: FfmpegOptions = {
      encoder: "h264_qsv",
      bitrateControl: "ICQ",
      crf: 28,
      preset: "p4",
      audioCodec: "flac",
      bitrate: 8000,
      decode: false,
      extraOptions: "",
      bit10: true,
      resetResolution: true,
      resolutionWidth: 3840,
      resolutionHeight: 2160,
    };
    const output1 = genFfmpegParams(input);
    expect(output1).toEqual(["-c:v h264_qsv", "-global_quality 28", "-preset p4", "-c:a flac"]);
  });
});

describe("genMergeAssMp4Command", () => {
  it("压制参数：视频，高能进度条，弹幕", () => {
    const files = {
      videoFilePath: "/path/to/video.mp4",
      assFilePath: "/path/to/subtitle.ass",
      outputPath: "/path/to/output.mp4",
      hotProgressFilePath: "/path/to/hotprogress.txt",
    };

    const ffmpegOptions: FfmpegOptions = {
      encoder: "libx264",
      audioCodec: "copy",
    };

    const command = genMergeAssMp4Command(files, ffmpegOptions);
    const args = command._getArguments();
    expect(args).toEqual([
      "-i",
      "/path/to/video.mp4",
      "-i",
      "/path/to/hotprogress.txt",
      "-y",
      "-filter_complex",
      "[0:v]subtitles=/path/to/subtitle.ass[i];[1]colorkey=black:0.1:0.1[1d];[i][1d]overlay=W-w-0:H-h-0[assOut]",
      "-map",
      "[assOut]",
      "-map",
      "0:a",
      "-c:v",
      "libx264",
      "-c:a",
      "copy",
      "/path/to/output.mp4",
    ]);
  });
  it("压制参数：视频，弹幕，无高能弹幕", () => {
    const files = {
      videoFilePath: "/path/to/video.mp4",
      assFilePath: "/path/to/subtitle.ass",
      outputPath: "/path/to/output.mp4",
      hotProgressFilePath: undefined,
    };

    const ffmpegOptions: FfmpegOptions = {
      encoder: "libx264",
      audioCodec: "copy",
    };

    const command = genMergeAssMp4Command(files, ffmpegOptions);
    const args = command._getArguments();
    expect(args).toEqual([
      "-i",
      "/path/to/video.mp4",
      "-y",
      "-filter_complex",
      "[0:v]subtitles=/path/to/subtitle.ass[assOut]",
      "-map",
      "[assOut]",
      "-map",
      "0:a",
      "-c:v",
      "libx264",
      "-c:a",
      "copy",
      "/path/to/output.mp4",
    ]);
  });
  it("压制参数：视频，无弹幕，无高能弹幕", () => {
    const files = {
      videoFilePath: "/path/to/video.mp4",
      assFilePath: undefined,
      outputPath: "/path/to/output.mp4",
      hotProgressFilePath: undefined,
    };

    const ffmpegOptions: FfmpegOptions = {
      encoder: "libx264",
      audioCodec: "copy",
    };

    const command = genMergeAssMp4Command(files, ffmpegOptions);
    const args = command._getArguments();
    expect(args).toEqual([
      "-i",
      "/path/to/video.mp4",
      "-y",
      "-c:v",
      "libx264",
      "-c:a",
      "copy",
      "/path/to/output.mp4",
    ]);
  });
  it("压制参数：视频，有弹幕，无高能弹幕，有切割参数", () => {
    const files = {
      videoFilePath: "/path/to/video.mp4",
      assFilePath: "/path/to/subtitle.ass",
      outputPath: "/path/to/output.mp4",
      hotProgressFilePath: undefined,
    };

    const ffmpegOptions: FfmpegOptions = {
      encoder: "libx264",
      audioCodec: "copy",
      ss: "00:00:00",
      to: "00:00:10",
    };

    const command = genMergeAssMp4Command(files, ffmpegOptions);
    const args = command._getArguments();
    expect(args).toEqual([
      "-ss",
      "00:00:00",
      "-copyts",
      "-to",
      "00:00:10",
      "-i",
      "/path/to/video.mp4",
      "-y",
      "-filter_complex",
      "[0:v]subtitles=/path/to/subtitle.ass[assOut]",
      "-map",
      "[assOut]",
      "-map",
      "0:a",
      "-c:v",
      "libx264",
      "-ss",
      "00:00:00",
      "-c:a",
      "copy",
      "/path/to/output.mp4",
    ]);
  });
  it("压制参数：hevc硬件解码", () => {
    const files = {
      videoFilePath: "/path/to/video.mp4",
      assFilePath: undefined,
      outputPath: "/path/to/output.mp4",
      hotProgressFilePath: undefined,
    };

    const ffmpegOptions: FfmpegOptions[] = [
      {
        encoder: "h264_nvenc",
        audioCodec: "copy",
        decode: true,
      },
      {
        encoder: "hevc_nvenc",
        audioCodec: "copy",
        decode: true,
      },
      {
        encoder: "av1_nvenc",
        audioCodec: "copy",
        decode: true,
      },
    ];
    for (const option of ffmpegOptions) {
      const command = genMergeAssMp4Command(files, option);
      const args = command._getArguments();
      expect(args).toEqual([
        "-hwaccel",
        "cuda",
        "-hwaccel_output_format",
        "cuda",
        "-extra_hw_frames",
        "10",
        "-i",
        "/path/to/video.mp4",
        "-y",
        "-c:v",
        option.encoder,
        "-c:a",
        "copy",
        "/path/to/output.mp4",
      ]);
    }
  });
});
