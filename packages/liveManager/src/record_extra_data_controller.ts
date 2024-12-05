/**
 * 用一个视频之外的独立文件来存储元信息和弹幕、礼物等信息。
 * 暂时使用 json 作为存储方案试试效果，猜测可能会有实时写入差、占用空间大的问题。
 */
import path from "node:path";
import fs from "node:fs";
import { XMLBuilder } from "fast-xml-parser";
import { pick } from "lodash-es";

import { Message } from "./common.js";
import { asyncThrottle } from "./utils.js";

export interface RecordExtraData {
  meta: {
    title?: string;
    recordStartTimestamp: number;
    recordStopTimestamp?: number;
    ffmpegArgs?: string[];
  };
  /** 这个数组预期上是一个根据 timestamp 排序的有序数组，方便做一些时间段查询 */
  messages: Message[];
}

export interface RecordExtraDataController {
  /** 设计上来说，外部程序不应该能直接修改 data 上的东西 */
  readonly data: RecordExtraData;
  addMessage: (message: Message) => void;
  setMeta: (meta: Partial<RecordExtraData["meta"]>) => void;
  flush: () => Promise<void>;
}

export function createRecordExtraDataController(savePath: string): RecordExtraDataController {
  const data: RecordExtraData = {
    meta: {
      recordStartTimestamp: Date.now(),
    },
    messages: [],
  };

  const scheduleSave = asyncThrottle(() => save(), 30e3, {
    immediateRunWhenEndOfDefer: true,
  });
  const save = () => {
    return fs.promises.writeFile(savePath, JSON.stringify(data));
  };

  // TODO: 将所有数据存放在内存中可能存在问题
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

  const flush: RecordExtraDataController["flush"] = async () => {
    scheduleSave.cancel();

    const xmlContent = convert2Xml(data);
    const parsedPath = path.parse(savePath);
    const xmlPath = path.join(parsedPath.dir, parsedPath.name + ".xml");
    await fs.promises.writeFile(xmlPath, xmlContent);
    await fs.promises.rm(savePath);
  };

  return {
    data,
    addMessage,
    setMeta,
    flush,
  };
}

/**
 * 转换弹幕为b站格式xml
 * @link: https://socialsisteryi.github.io/bilibili-API-collect/docs/danmaku/danmaku_xml.html#%E5%B1%9E%E6%80%A7-p
 */
export function convert2Xml(data: RecordExtraData) {
  const metadata = data.meta;

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@@",
    format: true,
  });

  const comments = data.messages
    .filter((item) => item.type === "comment")
    .map((ele) => {
      const progress = (ele.timestamp - metadata?.recordStartTimestamp) / 1000;
      const data = {
        "@@p": "",
        "@@progress": progress,
        "@@mode": String(ele.mode ?? 1),
        "@@fontsize": String(25),
        "@@color": String(parseInt((ele.color || "#ffffff").replace("#", ""), 16)),
        "@@midHash": String(ele?.sender?.uid),
        "#text": String(ele?.text || ""),
        "@@ctime": String(ele.timestamp),
        "@@pool": String(0),
        "@@weight": String(0),
        "@@user": String(ele.sender?.name),
        "@@uid": String(ele?.sender?.uid),
      };
      data["@@p"] = [
        data["@@progress"],
        data["@@mode"],
        data["@@fontsize"],
        data["@@color"],
        data["@@ctime"],
        data["@@pool"],
        data["@@midHash"],
        data["@@uid"],
        data["@@weight"],
      ].join(",");
      return pick(data, ["@@p", "#text", "@@user", "@@uid"]);
    });

  const gifts = data.messages
    .filter((item) => item.type === "give_gift")
    .map((ele) => {
      const progress = (ele.timestamp - metadata?.recordStartTimestamp) / 1000;
      const data = {
        "@@ts": progress,
        "@@giftname": String(ele.name),
        "@@giftcount": String(ele.count),
        "@@price": String(ele.price * 1000),
        "@@user": String(ele.sender?.name),
        "@@uid": String(ele?.sender?.uid),
        // "@@raw": JSON.stringify(ele),
      };
      return data;
    });

  const superChats = data.messages
    .filter((item) => item.type === "super_chat")
    .map((ele) => {
      const progress = (ele.timestamp - metadata?.recordStartTimestamp) / 1000;
      const data = {
        "@@ts": progress,
        "@@price": String(ele.price * 1000),
        "#text": String(ele.text),
        "@@user": String(ele.sender?.name),
        "@@uid": String(ele?.sender?.uid),
        // "@@raw": JSON.stringify(ele),
      };
      return data;
    });

  const guardGift = data.messages
    .filter((item) => item.type === "guard")
    .map((ele) => {
      const progress = (ele.timestamp - metadata?.recordStartTimestamp) / 1000;
      const data = {
        "@@ts": progress,
        "@@price": String(ele.price * 1000),
        "@@giftname": String(ele.name),
        "@@giftcount": String(ele.count),
        "@@level": String(ele.level),
        "@@user": String(ele.sender?.name),
        "@@uid": String(ele?.sender?.uid),
        // "@@raw": JSON.stringify(ele),
      };
      return data;
    });
  const xmlContent = builder.build({
    i: {
      metadata: {
        platform: "douyu",
        video_start_time: metadata.recordStartTimestamp,
      },
      d: comments,
      gift: gifts,
      sc: superChats,
      guard: guardGift,
    },
  });
  return `<?xml version="1.0" encoding="utf-8"?>
${xmlContent}`;
}
