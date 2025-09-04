import { FFMPEGRecorder } from "./FFMPEGRecorder.js";
import { mesioRecorder } from "./mesioRecorder.js";

export { FFMPEGRecorder } from "./FFMPEGRecorder.js";
export { mesioRecorder } from "./mesioRecorder.js";

/**
 * 录制器类型
 */
export type RecorderType = "ffmpeg" | "mesio";

/**
 * 录制器基础配置选项
 */
export interface BaseRecorderOptions {
  url: string;
  getSavePath: (data: { startTime: number; title?: string }) => string;
  segment: number;
  inputOptions?: string[];
  isHls?: boolean;
  disableDanma?: boolean;
  videoFormat?: "auto" | "ts" | "mkv";
  headers?: {
    [key: string]: string | undefined;
  };
}

/**
 * FFMPEG录制器配置选项
 */
export interface FFMPEGRecorderOptions extends BaseRecorderOptions {
  outputOptions: string[];
}

/**
 * Mesio录制器配置选项
 */
export interface MesioRecorderOptions extends BaseRecorderOptions {
  // mesio specific options can be added here if needed
}

/**
 * 根据录制器类型获取对应的配置选项类型
 */
export type RecorderOptions<T extends RecorderType> = T extends "ffmpeg"
  ? FFMPEGRecorderOptions
  : MesioRecorderOptions;

/**
 * 根据录制器类型获取对应的录制器实例类型
 */
export type RecorderInstance<T extends RecorderType> = T extends "ffmpeg"
  ? FFMPEGRecorder
  : mesioRecorder;

/**
 * 创建录制器的工厂函数
 *
 * @example
 * ```typescript
 * // 创建 FFMPEG 录制器
 * const ffmpegRecorder = createRecorder("ffmpeg", {
 *   url: "https://example.com/stream.m3u8",
 *   getSavePath: ({ startTime, title }) => `/recordings/${title}_${startTime}.ts`,
 *   segment: 30,
 *   outputOptions: ["-c", "copy"],
 *   inputOptions: ["-user_agent", "Custom-Agent"]
 * }, onEnd, onUpdateLiveInfo);
 *
 * // 创建 Mesio 录制器
 * const mesioRecorder = createRecorder("mesio", {
 *   url: "https://example.com/stream.m3u8",
 *   getSavePath: ({ startTime, title }) => `/recordings/${title}_${startTime}.ts`,
 *   segment: 30,
 *   inputOptions: ["--fix"]
 * }, onEnd, onUpdateLiveInfo);
 * ```
 *
 * @param type 录制器类型
 * @param opts 录制器配置选项
 * @param onEnd 录制结束回调
 * @param onUpdateLiveInfo 更新直播信息回调
 * @returns 对应类型的录制器实例
 */
export function createBaseRecorder<T extends RecorderType>(
  type: T,
  opts: RecorderOptions<T> & { mesioOptions?: string[]; formatName?: "flv" | "ts" | "fmp4" },
  onEnd: (...args: unknown[]) => void,
  onUpdateLiveInfo: () => Promise<{ title?: string; cover?: string }>,
): RecorderInstance<T> {
  if (type === "ffmpeg") {
    return new FFMPEGRecorder(
      opts as FFMPEGRecorderOptions,
      onEnd,
      onUpdateLiveInfo,
    ) as RecorderInstance<T>;
  } else if (type === "mesio") {
    return new mesioRecorder(
      { ...(opts as MesioRecorderOptions), inputOptions: opts.mesioOptions ?? [] },
      onEnd,
      onUpdateLiveInfo,
    ) as RecorderInstance<T>;
  } else {
    throw new Error(`Unsupported recorder type: ${type}`);
  }
}
