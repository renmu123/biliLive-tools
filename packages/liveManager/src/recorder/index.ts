import { FFMPEGRecorder } from "./FFMPEGRecorder.js";
import { mesioRecorder } from "./mesioRecorder.js";
import { BililiveRecorder } from "./BililiveRecorder.js";

export { FFMPEGRecorder } from "./FFMPEGRecorder.js";
export { mesioRecorder } from "./mesioRecorder.js";
export { BililiveRecorder } from "./BililiveRecorder.js";
import type {
  IRecorder,
  FFMPEGRecorderOptions,
  MesioRecorderOptions,
  BililiveRecorderOptions,
} from "./IRecorder.js";

/**
 * 录制器类型
 */
export type RecorderType = "ffmpeg" | "mesio" | "bililive";

/**
 * 根据录制器类型获取对应的配置选项类型
 */
export type RecorderOptions<T extends RecorderType> = T extends "ffmpeg"
  ? FFMPEGRecorderOptions
  : T extends "mesio"
    ? MesioRecorderOptions
    : BililiveRecorderOptions;

/**
 * 根据录制器类型获取对应的录制器实例类型
 */
export type RecorderInstance<T extends RecorderType> = T extends "ffmpeg"
  ? FFMPEGRecorder
  : T extends "mesio"
    ? mesioRecorder
    : BililiveRecorder;

type RecorderOpts = FFMPEGRecorderOptions | MesioRecorderOptions | BililiveRecorderOptions;

/**
 * 创建录制器的工厂函数
 */
export function createRecorder<T extends RecorderType>(
  type: T,
  opts: RecorderOptions<T>,
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
      opts as MesioRecorderOptions,
      onEnd,
      onUpdateLiveInfo,
    ) as RecorderInstance<T>;
  } else if (type === "bililive") {
    return new BililiveRecorder(
      opts as BililiveRecorderOptions,
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
export function selectRecorder(preferredRecorder: "auto" | RecorderType): RecorderType {
  let recorderType: RecorderType;

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
 * 创建录制器的工厂函数
 */
export function createBaseRecorder(
  type: "auto" | RecorderType,
  opts: RecorderOpts,
  onEnd: (...args: unknown[]) => void,
  onUpdateLiveInfo: () => Promise<{ title?: string; cover?: string }>,
): IRecorder {
  const recorderType = selectRecorder(type);
  return createRecorder(
    recorderType,
    opts as RecorderOptions<typeof recorderType>,
    onEnd,
    onUpdateLiveInfo,
  );
}
