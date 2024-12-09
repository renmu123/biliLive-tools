import fs from "fs-extra";
import path from "node:path";
import readline from "node:readline";
import { XMLParser } from "fast-xml-parser";

import type { Danmu, SC, Gift, Guard } from "@biliLive-tools/types";

const traversalObject = (obj: any, callback: (key: string, value: any) => any) => {
  for (const key in obj) {
    if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      traversalObject(obj[key], callback);
    } else {
      callback(key, obj[key]);
    }
  }
};

async function processRawStream(inputFilePath: string) {
  const readStream = fs.createReadStream(inputFilePath, { encoding: "utf8" });

  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity,
  });

  let data = "";
  for await (const line of rl) {
    const newLine = line.replace(/raw=".*?"/, "");
    data += newLine + "\n";
  }
  return data;
}

/**
 * 处理xml文件
 */
export const parseXmlFile = async (input: string, parseRaw = false) => {
  let XMLdata: string;
  const stat = await fs.stat(input);

  // 如果文件大于400M，且未开启parseRaw，使用processRawStream
  if (stat.size > 400 * 1024 * 1024 && !parseRaw) {
    XMLdata = await processRawStream(input);
  } else {
    XMLdata = await fs.promises.readFile(input, "utf8");
    if (!parseRaw) {
      XMLdata = XMLdata.replace(/raw=".*?"/g, "");
    }
  }
  return parseXmlObj(XMLdata);
};

/**
 * 解析弹幕数据为对象
 */
export const parseXmlObj = async (XMLdata: string) => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    isArray: (name) => {
      if (["d", "gift", "guard", "sc"].includes(name)) return true;
      return false;
    },
  });
  const jObj = parser.parse(XMLdata);

  let danmuku = [];
  let sc = [];
  let guard = [];
  let gift = [];

  traversalObject(jObj, (key, value) => {
    if (key === "d") {
      danmuku = value;
    } else if (key === "sc") {
      sc = value;
    } else if (key === "guard") {
      guard = value;
    } else if (key === "gift") {
      gift = value;
    }
  });

  return { jObj, danmuku, sc, guard, gift };
};

export const parseMetadata = (jObj: any) => {
  const metadata: {
    streamer?: string;
    room_id?: string;
    live_title?: string;
    live_start_time?: number;
    platform?: string;
  } = {
    streamer: undefined,
    room_id: undefined,
    live_title: undefined,
    live_start_time: undefined,
    platform: undefined,
  };
  const root = jObj?.i;
  if (!root) return metadata;

  // 录播姬
  if (root?.BililiveRecorderRecordInfo) {
    const info = root?.BililiveRecorderRecordInfo;
    metadata.streamer = info["@_name"];
    metadata.room_id = info["@_roomid"];
    metadata.live_title = info["@_title"];
    // TODO:这里有误，这是录制开始时间，而非直播开始时间
    const liveStartTime: string = info["@_start_time"];
    if (liveStartTime) {
      metadata.live_start_time = Math.floor(new Date(liveStartTime).getTime() / 1000);
    }
  }
  if (root?.metadata) {
    const info = root?.metadata;
    metadata.streamer = info["user_name"];
    metadata.room_id = info["room_id"];
    metadata.live_title = info["room_title"];
    const liveStartTime: string = info["live_start_time"];
    if (liveStartTime) {
      metadata.live_start_time = Math.floor(new Date(liveStartTime).getTime() / 1000);
    }
    metadata.platform = info["platform"];
  }
  return metadata;
};

/**
 * 解析弹幕
 * @param input 弹幕文件路径
 * @param type 弹幕文件录制平台，解析会有所不同，如果不传则自动判断
 */
export const parseDanmu = async (
  input: string,
  iOptions: {
    type?: "bililiverecorder" | "blrec" | "ddtv";
    roomId?: string;
  } = {},
) => {
  const defaultOptins = {};
  const options = Object.assign(defaultOptins, iOptions);
  const { danmuku, sc, jObj, gift, guard } = await parseXmlFile(input);

  // 如果是bililiverecorder和blrec录制的，平台为Bilibili
  let platform: string;
  if (options.type === "bililiverecorder" || options.type === "blrec" || options.type === "ddtv") {
    platform = "Bilibili";
  }
  const source = path.basename(input);
  const metadata = parseMetadata(jObj);

  const parsedDanmuku = danmuku.map((item) => {
    const data: Danmu = {
      type: "text",

      text: item["#text"],
      user: item["@_user"],
      ts: Number((item["@_p"] as string).split(",")[0]),
      p: item["@_p"],
      platform: platform ?? metadata.platform ?? "unknown",
      source,
      room_id: options.roomId ?? metadata.room_id,
      live_start_time: metadata.live_start_time,
      live_title: metadata.live_title,
    };
    return data;
  });

  const parsedSC = sc.map((item) => {
    const data: SC = {
      type: "sc",

      text: item["#text"],
      user: item["@_user"],
      ts: Number(item["@_ts"]),
      platform: platform ?? metadata.platform ?? "unknown",
      source,
      room_id: options.roomId ?? metadata.room_id,
      live_start_time: metadata.live_start_time,
      live_title: metadata.live_title,
    };
    return data;
  });

  const parsedGift = gift.map((item) => {
    const data: Gift = {
      type: "gift",
      text: "",
      user: item["@_user"],
      ts: Number(item["@_ts"]),
      platform: platform ?? metadata.platform ?? "unknown",
      source,
      room_id: options.roomId ?? metadata.room_id,
      live_start_time: metadata.live_start_time,
      live_title: metadata.live_title,
    };
    return data;
  });

  const parsedGuard = guard.map((item) => {
    const data: Guard = {
      type: "guard",
      text: "",
      user: item["@_user"],
      ts: Number(item["@_ts"]),
      platform: platform ?? metadata.platform ?? "unknown",
      source,
      room_id: options.roomId ?? metadata.room_id,
      live_start_time: metadata.live_start_time,
      live_title: metadata.live_title,
    };
    return data;
  });

  return { danmu: parsedDanmuku, sc: parsedSC, gift: parsedGift, guard: parsedGuard };
};
