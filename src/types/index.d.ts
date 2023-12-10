import { biliApi } from "../main/bili";

import type { OpenDialogOptions as ElectronOpenDialogOptions } from "electron";
import type { LogLevel as ElectronLoGLevel } from "electron-log";

export type BiliApi = typeof biliApi;

// 弹幕配置
export type DanmuConfig = {
  resolution: [number, number];
  scrolltime: number;
  fixtime: number;
  density: number;
  fontname: string;
  fontsize: number;
  opacity: number;
  outline: number;
  shadow: number;
  displayarea: number;
  scrollarea: number;
  bold: boolean;
  showusernames: boolean;
  showmsgbox: boolean;
  msgboxsize: [number, number];
  msgboxpos: [number, number];
  msgboxfontsize: number;
  msgboxduration: number;
  giftminprice: number;
  giftmergetolerance: number;
  blockmode: ("R2L" | "L2R" | "TOP" | "BOTTOM" | "SPECIAL" | "COLOR" | "REPEAT")[];
  statmode: ("TABLE" | "HISTOGRAM")[];
};

// 弹幕预设配置
export type DanmuPreset = {
  id: string;
  name: string;
  config: DanmuConfig;
};

// 通用预设
export type CommonPreset<T> = {
  id: string;
  name: string;
  config: T;
};

// ffmpeg预设配置
export type FfmpegPreset = {
  id: string;
  name: string;
  config: FfmpegOptions;
};

// 应用配置文件
export interface AppConfig {
  logLevel: LogLevel;
  ffmpegPath: string;
  ffprobePath: string;
  trash: boolean;
  autoUpdate: boolean;
  webhook: {
    port: number;
    open: boolean;
    recoderFolder: string;
    minSize: number;
    title: string;
    uploadPresetId: string;
    blacklist: string;
    danmu: boolean;
    // TODO: 增加配置上传后删除原始文件
    // TODO: 弹幕预设
    // TODO: ffmpeg预设

    rooms: {
      [roomId: string]: {
        remark?: string;
        minSize: number;
        title: string;
        uploadPresetId: string;
        danmu: boolean;
      };
    };
  };
}

export type LogLevel = ElectronLoGLevel;

export interface DanmuOptions {
  saveRadio?: 1 | 2; // 1：保存到原始文件夹，2：保存到特定文件夹
  savePath?: string;

  removeOrigin: boolean; // 完成后移除源文件
}
export interface Video2Mp4Options {
  saveRadio: 1 | 2; // 1：保存到原始文件夹，2：保存到特定文件夹
  saveOriginPath: boolean;
  savePath: string;

  override?: boolean; // 覆盖已存在的文件
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
  cover?: string; // 封面
}

export type BiliupConfigAppend = Partial<BiliupConfig> & {
  vid: string;
};

export interface BiliupPreset {
  id: string;
  name: string;
  config: BiliupConfig;
}
