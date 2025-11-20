import { FFmpegDownloader } from "./FFmpegDownloader.js";
import { mesioDownloader } from "./mesioDownloader.js";
import { BililiveDownloader } from "./BililiveDownloader.js";
import { parseSizeToBytes } from "../utils.js";

export { FFmpegDownloader } from "./FFmpegDownloader.js";
export { mesioDownloader } from "./mesioDownloader.js";
export { BililiveDownloader } from "./BililiveDownloader.js";
import type {
  IDownloader,
  FFMPEGRecorderOptions,
  MesioRecorderOptions,
  BililiveRecorderOptions,
} from "./IDownloader.js";

/**
 * 录制器类型
 */
export type DownloaderType = "ffmpeg" | "mesio" | "bililive";

export type FormatName = "flv" | "ts" | "fmp4";

/**
 * 根据录制器类型获取对应的配置选项类型
 */
export type RecorderOptions<T extends DownloaderType> = T extends "ffmpeg"
  ? FFMPEGRecorderOptions
  : T extends "mesio"
    ? MesioRecorderOptions
    : BililiveRecorderOptions;

/**
 * 根据录制器类型获取对应的录制器实例类型
 */
export type RecorderInstance<T extends DownloaderType> = T extends "ffmpeg"
  ? FFmpegDownloader
  : T extends "mesio"
    ? mesioDownloader
    : BililiveDownloader;

type RecorderOpts = FFMPEGRecorderOptions | MesioRecorderOptions | BililiveRecorderOptions;

/**
 * 创建录制器的工厂函数
 */
export function createBaseDownloader<T extends DownloaderType>(
  type: T,
  opts: RecorderOptions<T> & { onlyAudio?: boolean },
  onEnd: (...args: unknown[]) => void,
  onUpdateLiveInfo: () => Promise<{ title?: string; cover?: string }>,
): IDownloader {
  const segment = parseSizeToBytes(String(opts.segment));
  const newOpts = { ...opts, segment };
  if (type === "ffmpeg") {
    return new FFmpegDownloader(
      newOpts as FFMPEGRecorderOptions,
      onEnd,
      onUpdateLiveInfo,
    ) as RecorderInstance<T>;
  } else if (type === "mesio") {
    return new mesioDownloader(
      newOpts as MesioRecorderOptions,
      onEnd,
      onUpdateLiveInfo,
    ) as RecorderInstance<T>;
  } else if (type === "bililive") {
    if (opts.formatName === "flv") {
      // 录播姬引擎不支持只录音频
      if (!opts.onlyAudio) {
        return new BililiveDownloader(
          newOpts as BililiveRecorderOptions,
          onEnd,
          onUpdateLiveInfo,
        ) as RecorderInstance<T>;
      }
    }

    return new FFmpegDownloader(
      newOpts as FFMPEGRecorderOptions,
      onEnd,
      onUpdateLiveInfo,
    ) as RecorderInstance<T>;
  } else {
    throw new Error(`Unsupported recorder type: ${type}`);
  }
}

/**
 * 选择录制器
 */
export function selectRecorder(
  preferredRecorder: "auto" | DownloaderType | undefined,
): DownloaderType {
  let recorderType: DownloaderType;

  if (preferredRecorder === "auto") {
    // 默认优先使用ffmpeg录制器
    recorderType = "ffmpeg";
  } else if (preferredRecorder === "ffmpeg") {
    recorderType = "ffmpeg";
  } else if (preferredRecorder === "mesio") {
    recorderType = "mesio";
  } else if (preferredRecorder === "bililive") {
    recorderType = "bililive";
  } else {
    recorderType = "ffmpeg";
  }
  return recorderType;
}

/**
 * 判断原始录制流格式，flv, ts, m4s
 */
export function getSourceFormatName(
  streamUrl: string,
  formatName: FormatName | undefined,
): FormatName {
  if (formatName) {
    return formatName;
  }

  if (streamUrl.includes(".m3u8")) {
    return "ts";
  } else if (streamUrl.includes(".m4s")) {
    // TODO: 使用b站的流进行测试
    return "fmp4";
  } else {
    return "flv";
  }
}

type PickPartial<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>> & Partial<Pick<T, K>>;

/**
 * 创建录制器的工厂函数
 */
export function createDownloader(
  type: "auto" | DownloaderType | undefined,
  opts: PickPartial<RecorderOpts, "formatName"> & { onlyAudio?: boolean },
  onEnd: (...args: unknown[]) => void,
  onUpdateLiveInfo: () => Promise<{ title?: string; cover?: string }>,
): IDownloader {
  const recorderType = selectRecorder(type);
  const sourceFormatName = getSourceFormatName(opts.url, opts.formatName);
  return createBaseDownloader(
    recorderType,
    { ...(opts as RecorderOptions<typeof recorderType>), formatName: sourceFormatName },
    onEnd,
    onUpdateLiveInfo,
  );
}
