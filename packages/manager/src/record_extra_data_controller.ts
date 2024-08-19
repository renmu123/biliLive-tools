/**
 * 用一个视频之外的独立文件来存储元信息和弹幕、礼物等信息。
 * 暂时使用 json 作为存储方案试试效果，猜测可能会有实时写入差、占用空间大的问题。
 */
import fs from "fs";
import { Message } from "./common.js";
import { asyncThrottle } from "./utils.js";

export interface RecordExtraData {
  meta: {
    title?: string;
    recordStartTimestamp: number;
    recordStopTimestamp?: number;
    ffmpegArgs?: string[];
    // TODO: 要再加个 video width / height，给之后可能会做的 ass 使用
  };
  /** 这个数组预期上是一个根据 timestamp 排序的有序数组，方便做一些时间段查询 */
  messages: Message[];
}

export interface RecordExtraDataController {
  /** 设计上来说，外部程序不应该能直接修改 data 上的东西 */
  readonly data: RecordExtraData;
  addMessage: (message: Message) => void;
  setMeta: (meta: Partial<RecordExtraData["meta"]>) => void;
  flush: () => void;
}

export function createRecordExtraDataController(savePath: string): RecordExtraDataController {
  const data: RecordExtraData = {
    meta: {
      recordStartTimestamp: Date.now(),
    },
    messages: [],
  };

  const scheduleSave = asyncThrottle(
    () => fs.promises.writeFile(savePath, JSON.stringify(data)),
    30e3,
    {
      immediateRunWhenEndOfDefer: true,
    },
  );

  const addMessage: RecordExtraDataController["addMessage"] = (comment) => {
    data.messages.push(comment);
    scheduleSave();
  };

  const setMeta: RecordExtraDataController["setMeta"] = (meta) => {
    data.meta = {
      ...data.meta,
      ...meta,
    };
    scheduleSave();
  };

  const flush: RecordExtraDataController["flush"] = () => {
    scheduleSave();
    scheduleSave.flush();
  };

  return {
    data,
    addMessage,
    setMeta,
    flush,
  };
}
