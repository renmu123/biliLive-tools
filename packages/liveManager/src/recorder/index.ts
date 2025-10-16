import { FFMPEGRecorder } from "./FFMPEGRecorder.js";
import { mesioRecorder } from "./mesioRecorder.js";

export { FFMPEGRecorder } from "./FFMPEGRecorder.js";
export { mesioRecorder } from "./mesioRecorder.js";
import type { IRecorder, FFMPEGRecorderOptions, MesioRecorderOptions } from "./IRecorder.js";

/**
 * 录制器类型
 */
export type RecorderType = "ffmpeg" | "mesio";

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
 */
export function createBaseRecorder<T extends RecorderType>(
  type: T,
  opts: RecorderOptions<T> & { mesioOptions?: string[] },
  onEnd: (...args: unknown[]) => void,
  onUpdateLiveInfo: () => Promise<{ title?: string; cover?: string }>,
): IRecorder {
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
