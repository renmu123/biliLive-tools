import { DANMU_DEAFULT_CONFIG } from "../main/danmu";

export type DanmuConfig = typeof DANMU_DEAFULT_CONFIG;

export interface OriginFile {
  name: string; // aaa.mp4
  path: string; // /Users/xxx/Downloads/aaa.mp4
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
}
