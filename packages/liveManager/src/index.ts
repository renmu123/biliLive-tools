// forked from https://github.com/WhiteMinds/LiveAutoRecord
import ffmpeg from "@renmu/fluent-ffmpeg";
import { omit, pick } from "lodash-es";
import { RecorderProvider } from "./manager.js";
import { SerializedRecorder, Recorder, RecordHandle } from "./recorder.js";
import { AnyObject } from "./utils.js";
import utils from "./utils.js";

export * from "./common.js";
export * from "./recorder.js";
export * from "./manager.js";
export * from "./record_extra_data_controller.js";
export * from "./recorder/FFMPEGRecorder.js";
export { createBaseRecorder } from "./recorder/index.js";
export { utils };

/**
 * 提供一些 utils
 */

export function defaultFromJSON<E extends AnyObject>(
  provider: RecorderProvider<E>,
  json: SerializedRecorder<E>,
): Recorder<E> {
  return provider.createRecorder(omit(json, ["providerId"]));
}

export function defaultToJSON<E extends AnyObject>(
  provider: RecorderProvider<E>,
  recorder: Recorder<E>,
): SerializedRecorder<E> {
  // @ts-ignore
  return {
    providerId: provider.id,
    ...pick(recorder, [
      "id",
      "channelId",
      "remarks",
      "disableAutoCheck",
      "quality",
      "streamPriorities",
      "sourcePriorities",
      "extra",
      "segment",
      "saveSCDanma",
      "saveCover",
      "saveGiftDanma",
      "disableProvideCommentsWhenRecording",
      "liveInfo",
      "uid",
      "titleKeywords",
      // "recordHandle",
    ]),
  };
}

// 目前是假设使用环境的规模都比较小，不太容易遇到性能问题，所以用 string uuid 作为 id 来简化开发的复杂度。
// 后面如果需要再高一些的规模，可以优化成分布式 id 生成器，或者其他的异步生成 id 的方案。
export function genRecorderUUID(): Recorder["id"] {
  return utils.uuid();
}
export function genRecordUUID(): RecordHandle["id"] {
  return utils.uuid();
}

let ffmpegPath: string = "ffmpeg";
export function setFFMPEGPath(newPath: string) {
  ffmpegPath = newPath;
}

export const createFFMPEGBuilder = (...args: Parameters<typeof ffmpeg>) => {
  ffmpeg.setFfmpegPath(ffmpegPath);
  return ffmpeg(...args);
};

// Mesio path management
let mesioPath: string = "mesio";
export function setMesioPath(newPath: string) {
  mesioPath = newPath;
}

export function getMesioPath(): string {
  return mesioPath;
}

export function getDataFolderPath<E extends AnyObject>(provider: RecorderProvider<E>): string {
  return "./" + provider.id;
}
