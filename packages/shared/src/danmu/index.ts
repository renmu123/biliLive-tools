import fs from "fs-extra";
import readline from "node:readline";
import { ChildProcess, exec } from "node:child_process";

import { pathExists } from "../utils/index.js";
import log from "../utils/log.js";
import { XMLParser } from "fast-xml-parser";
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
      } else if (key === "blockmode") {
        if (Array.isArray(value)) {
          if (value.length === 0) return `--${key} null`;
          return `--${key} ${value.join("-")}`;
        }
      } else if (key === "statmode") {
        if (Array.isArray(value)) {
          if (value.length === 0) return ``;
          return `--${key} ${value.join("-")}`;
        }
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
    if (!(await pathExists(input))) {
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
    console.log("processRawStream");
    XMLdata = await processRawStream(input);
  } else {
    XMLdata = await fs.promises.readFile(input, "utf8");
    if (!parseRaw) {
      console.log("parseRaw");
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
    };
    return data;
  });
};

/**
 * 解析弹幕
 */
export const parseDanmu = async (
  input: string,
  iOptions: {
    parseHotProgress?: boolean;
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

  const { danmuku, sc } = await parseXmlFile(input);

  let hotProgress: {
    time: number;
    value: number;
    color: string;
  }[] = [];
  if (options.parseHotProgress) {
    if (!options.duration) throw new Error("duration is required when parseHotProgress is true");
    hotProgress = await genHotDataByXml(danmuku, options);
  }

  const parsedDanmuku = danmuku.map((item) => {
    const data: DanmuType = {
      text: item["#text"],
      user: item["@_user"],
      ts: Number(item["@_p"].split(",")[0]),
      type: "danmu",
    };
    return data;
  });

  const parsedSC = sc.map((item) => {
    const data: SC = {
      text: item["#text"],
      user: item["@_user"],
      ts: Number(item["@_ts"]),
      type: "sc",
    };
    return data;
  });

  return { danmu: parsedDanmuku, sc: parsedSC, hotProgress };
};
