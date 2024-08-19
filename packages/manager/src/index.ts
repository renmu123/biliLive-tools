// forked from https://github.com/WhiteMinds/LiveAutoRecord
import ffmpeg from "@renmu/fluent-ffmpeg";
import { omit, pick } from "lodash-es";
import { v4 as uuid } from "uuid";
import { RecorderProvider } from "./manager.js";
import { SerializedRecorder, Recorder, RecordHandle } from "./recorder.js";
import { AnyObject } from "./utils.js";

export * from "./common.js";
export * from "./recorder.js";
export * from "./manager.js";
export * from "./record_extra_data_controller.js";

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
    ]),
  };
}

// 目前是假设使用环境的规模都比较小，不太容易遇到性能问题，所以用 string uuid 作为 id 来简化开发的复杂度。
// 后面如果需要再高一些的规模，可以优化成分布式 id 生成器，或者其他的异步生成 id 的方案。
export function genRecorderUUID(): Recorder["id"] {
  return uuid();
}
export function genRecordUUID(): RecordHandle["id"] {
  return uuid();
}

let ffmpegPath: string = "ffmpeg";
export function setFFMPEGPath(newPath: string) {
  ffmpegPath = newPath;
}

export const createFFMPEGBuilder = (...args: Parameters<typeof ffmpeg>) => {
  ffmpeg.setFfmpegPath(ffmpegPath);
  return ffmpeg(...args);
};

export function getDataFolderPath<E extends AnyObject>(provider: RecorderProvider<E>): string {
  // TODO: 改成 AppData 之类的目录
  return "./" + provider.id;
}
