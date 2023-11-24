import { DANMU_DEAFULT_CONFIG } from "../main/danmu";

import type { OpenDialogOptions as ElectronOpenDialogOptions } from "electron";
import type { LogLevel as ElectronLoGLevel } from "electron-log";

// 弹幕原始配置文件
export type DanmuConfig = typeof DANMU_DEAFULT_CONFIG;

// 应用配置文件
export interface AppConfig {
  logLevel: LogLevel;
  ffmpegPath: string;
  ffprobePath: string;
  trash: boolean;
  webhook: {
    open: boolean;
    recoderFolder: string;
    autoUpload: boolean;
    minSize: number;
    title: string;
    uploadPresetId: string;
    blacklist: string;
    rooms: {
      [roomId: string]: {
        minSize: number;
        title: string;
        uploadPresetId: string;
      };
    };
  };
}

export type LogLevel = ElectronLoGLevel;

export interface DanmuOptions {
  saveRadio: 1 | 2; // 1：保存到原始文件夹，2：保存到特定文件夹
  saveOriginPath: boolean;
  savePath: string;

  override: boolean; // 覆盖文件
  removeOrigin: boolean; // 完成后移除源文件
}

export interface VideoMergeOptions {
  savePath: string;

  removeOrigin: boolean; // 完成后移除源文件
}

export interface File {
  path: string; // /Users/xxx/Downloads/aaa.mp4
  filename: string; // aaa.mp4
  name: string; // aaa
  ext: string; // .mp4
  dir: string; // /Users/xxx/Downloads
}

export interface Progress {
  frames: number;
  currentFps: number;
  currentKbps: number;
  targetSize: number;
  timemark: string;
  percentage: number;
  percent?: number;
}

export interface OpenDialogOptions extends ElectronOpenDialogOptions {
  multi?: boolean;
}

export interface FfmpegOptions {
  encoder: string;
  bitrateControl?: "CRF" | "ABR" | "CBR" | "VBR";
  crf?: number;
  bitrate?: number;
  preset?:
    | "ultrafast"
    | "superfast"
    | "veryfast"
    | "faster"
    | "fast"
    | "medium"
    | "slow"
    | "slower"
    | "veryslow"
    | "placebo";
}

export interface BiliupConfig {
  title: string; // 标题,稿件标题限制80字，去除前后空格
  desc?: string; // 简介，去除前后空格，最多250
  dolby: 0 | 1; // 杜比
  hires: 0 | 1; // Hi-Res
  copyright: 1 | 2; // 1：自制，2：转载
  tag: string[]; // 标签，不能为空，不能超过12个，调用接口验证
  tid: number; // 174 投稿分区
  source?: string; // 转载来源
  dynamic?: string; // 空间动态
}

export type BiliupConfigAppend = Partial<BiliupConfig> & {
  vid: string;
};

export interface BiliupPreset {
  id: string;
  name: string;
  config: BiliupConfig;
}
