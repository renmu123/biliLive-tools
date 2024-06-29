import { expect, describe, it } from "vitest";
import { genFfmpegParams } from "../src/utils/index";
import { genMergeAssMp4Command } from "../src/task/video";
import type { FfmpegOptions } from "@biliLive-tools/types";

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
  it("额外参数", () => {
    const input: FfmpegOptions = {
      encoder: "h264_nvenc",
      bitrateControl: "CQ",
      crf: 34,
      preset: "p4",
      audioCodec: "copy",
      bitrate: 8000,
      decode: true,
      extraOptions: "-ss 00:00:00",
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
      "-ss",
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
  it("视频编码器是libsvtav1且开通10bit", () => {
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
    expect(output1).toEqual([
      "-c:v h264_qsv",
      "-global_quality 28",
      "-preset p4",
      "-s 3840x2160",
      "-c:a flac",
    ]);
  });
});

describe("genMergeAssMp4Command", () => {
  it("普通压制参数", () => {
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
      "[0:v]subtitles=/path/to/subtitle.ass[i];[1]colorkey=black:0.1:0.1[1d];[i][1d]overlay=W-w-0:H-h-0",
      "-c:v",
      "libx264",
      "-c:a",
      "copy",
      "/path/to/output.mp4",
    ]);
  });
});
