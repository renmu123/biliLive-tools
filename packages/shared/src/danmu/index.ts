import fs from "fs-extra";
import path from "node:path";
import readline from "node:readline";
import { ChildProcess, exec } from "node:child_process";
import { XMLParser } from "fast-xml-parser";

import log from "../utils/log.js";
import { DANMU_DEAFULT_CONFIG } from "../presets/danmuPreset.js";
import { genHotDataByXml } from "./hotProgress.js";

import type { DanmuConfig, Danmu as DanmuType, SC } from "@biliLive-tools/types";

export class Danmu {
  execPath: string;
  command?: string;
  child?: ChildProcess;
  constructor(execPath: string) {
    this.execPath = execPath;
  }

  genDanmuArgs = (config: DanmuConfig) => {
    const params = Object.entries(config).map(([key, value]) => {
      // 如果配置字段不在默认中，则直接返回，用于处理版本回退可能导致的问题
      if (!Object.hasOwn(DANMU_DEAFULT_CONFIG, key)) return "";

      if (["resolution", "msgboxsize", "msgboxpos"].includes(key)) {
        if (Array.isArray(value)) {
          return `--${key} ${value.join("x")}`;
        }
        return "";
      } else if (key === "blockmode") {
        if (Array.isArray(value)) {
          if (value.length === 0) return `--${key} null`;
          return `--${key} ${value.join("-")}`;
        }
        return "";
      } else if (key === "statmode") {
        if (Array.isArray(value)) {
          if (value.length === 0) return ``;
          return `--${key} ${value.join("-")}`;
        }
        return "";
      } else if (key === "fontname") {
        return `--${key} "${value}"`;
      } else if (["resolutionResponsive", "customDensity", "opacity"].includes(key)) {
        // do nothing
        return "";
      } else if (key === "blacklist") {
        if (value) return `--${key} ${value}`;
        return "";
      } else if (key === "density") {
        if (value === -2) return `--density ${config.customDensity}`;
        return `--${key} ${value}`;
      } else if (key === "opacity100") {
        const value = ((config.opacity100 / 100) * 255).toFixed(0);
        return `--opacity ${value}`;
      } else {
        return `--${key} ${value}`;
      }
    });

    return params.filter((item) => item !== "");
  };

  convertXml2Ass = async (input: string, output: string, argsObj: DanmuConfig) => {
    if (!(await fs.pathExists(input))) {
      throw new Error("input not exists");
    }

    const requiredArgs = [`-i "${input}"`, `-o "${output}"`, "--ignore-warnings"];
    const args = this.genDanmuArgs(argsObj);
    const command = `"${this.execPath}" ${requiredArgs.join(" ")} ${args.join(" ")}`;
    log.info("danmakufactory command: ", command);
    this.command = command;

    return new Promise((resolve, reject) => {
      const child = exec(command, (error, stdout, stderr) => {
        if (error || stderr) {
          reject(stderr);
        } else {
          resolve(stdout);
        }
      });
      this.child = child;
    });
  };
}

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

/**
 * 获取sc弹幕
 */
export const getSCDanmu = async (input: string) => {
  const { sc } = await parseXmlFile(input);
  return sc.map((item) => {
    const data = {
      text: item["#text"],
      user: item["@_user"],
      ts: Number(item["@_ts"]),
      type: "sc",
    };
    return data;
  });
};

export const paeseMetadata = (jObj: any) => {
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

  if (root?.BililiveRecorderRecordInfo) {
    const info = root?.BililiveRecorderRecordInfo;
    metadata.streamer = info["@_name"];
    metadata.room_id = info["@_roomid"];
    metadata.live_title = info["@_title"];
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
    parseHotProgress?: boolean;
    type?: "bililiverecorder" | "blrec";
    roomId?: string;
    interval?: number;
    duration?: number;
    color?: string;
  } = {},
) => {
  const defaultOptins = {
    parseHotProgress: false,
    interval: 30,
    duration: 0,
    color: "#f9f5f3",
  };
  const options = Object.assign(defaultOptins, iOptions);
  const { danmuku, sc, jObj } = await parseXmlFile(input);

  let hotProgress: {
    time: number;
    value: number;
    color?: string;
  }[] = [];
  if (options.parseHotProgress) {
    if (!options.duration) throw new Error("duration is required when parseHotProgress is true");
    hotProgress = await genHotDataByXml(danmuku, options);
  }

  // 如果是bililiverecorder和blrec录制的，平台为bilibili
  let platform: string;
  if (options.type === "bililiverecorder" || options.type === "blrec") {
    platform = "bilibili";
  }
  const source = path.basename(input);
  const metadata = paeseMetadata(jObj);

  const parsedDanmuku = danmuku.map((item) => {
    const data: DanmuType = {
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
      streamer: metadata.streamer,
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
      streamer: metadata.streamer,
    };
    return data;
  });

  return { danmu: parsedDanmuku, sc: parsedSC, hotProgress };
};
