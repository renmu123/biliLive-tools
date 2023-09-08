import { DANMU_DEAFULT_CONFIG } from "../main/danmu";
import type { OpenDialogOptions as ElectronOpenDialogOptions } from "electron";

// 原始配置文件
export type DanmuConfig = typeof DANMU_DEAFULT_CONFIG;

export interface DanmuOptions {
  saveRadio: 1 | 2; // 1：保存到原始文件夹，2：保存到特定文件夹
  saveOriginPath: boolean;
  savePath: string;

  override: boolean; // 覆盖文件
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
}

export interface OpenDialogOptions extends ElectronOpenDialogOptions {
  multi?: boolean;
}

export interface FfmpegOptions {
  encoder: string;
  bitrateControl?: "CRF" | "ABR" | "CBR" | "VBR";
  crf?: number;
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
