import { join, parse } from "node:path";
import fs from "fs-extra";
import os from "node:os";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

import { pathExists, trashItem, uuid } from "../utils/index.js";
import log from "../utils/log.js";
import { appConfig } from "../index.js";
import { Danmu, generateDanmakuImage } from "../danmu/index.js";
import { DanmuTask, taskQueue } from "./task.js";
import { convertImage2Video } from "./video.js";

import type { DanmuConfig, DanmuOptions, hotProgressOptions } from "@biliLive-tools/types";

const addConvertDanmu2AssTask = async (
  originInput: string,
  output: string,
  danmuOptions: DanmuConfig,
  autoRun: boolean = true,
  options: { removeOrigin: boolean; copyInput?: boolean },
) => {
  if (await pathExists(output)) {
    log.info("danmufactory", {
      status: "success",
      text: "文件已存在，删除",
      input: originInput,
      output: output,
    });
    await fs.unlink(output);
  }
  const DANMUKUFACTORY_PATH = appConfig.get("danmuFactoryPath");
  const danmu = new Danmu(DANMUKUFACTORY_PATH);
  let tempInput: string | undefined;

  if (options.copyInput) {
    tempInput = join(os.tmpdir(), `${uuid()}.xml`);
    await fs.copyFile(originInput, tempInput);
  }
  if (danmuOptions.blacklist) {
    tempInput = tempInput || join(os.tmpdir(), `${uuid()}.xml`);
    await filterBlacklist2File(originInput, tempInput, danmuOptions.blacklist);
  }

  const input = tempInput || originInput;
  const task = new DanmuTask(
    danmu,
    {
      input: input,
      output,
      options: danmuOptions,
      name: `弹幕转换任务: ${parse(originInput).name}`,
    },
    {
      onEnd: async () => {
        if (options.removeOrigin && (await pathExists(originInput))) {
          await trashItem(originInput);
        }

        if (tempInput && (await pathExists(tempInput))) {
          await fs.unlink(tempInput);
        }
      },
      onError: async (error) => {
        log.error("danmufactory", {
          status: "error",
          text: error,
          input: originInput,
          output: output,
        });
        if (tempInput && (await pathExists(tempInput))) {
          await fs.unlink(tempInput);
        }
      },
    },
  );
  taskQueue.addTask(task, autoRun);
  return task;
};

export const convertXml2Ass = async (
  file: {
    input: string;
    output?: string;
  },
  danmuOptions: DanmuConfig,
  options: DanmuOptions = {
    removeOrigin: false,
    copyInput: false,
  },
) => {
  const tasks: {
    output?: string;
    taskId?: string;
  }[] = [];

  const { dir, name } = parse(file.input);

  let outputName = file.output;
  if (!outputName) {
    outputName = `${name}.ass`;
  } else {
    outputName = `${outputName}.ass`;
  }
  let output = join(dir, outputName);
  if (options.saveRadio === 2 && options.savePath) {
    output = join(options.savePath, `${outputName}`);
  }

  const input = file.input;
  const task = await addConvertDanmu2AssTask(input, output, danmuOptions, true, options);
  tasks.push({
    taskId: task.taskId,
  });

  return task;
};

/**
 * 判断xml中弹幕是否为空
 * 如果文件中存在<d>, <gift>, <sc>, <guard>标签则认为不为空
 *
 */
export const isEmptyDanmu = async (input: string) => {
  const XMLdata = await fs.promises.readFile(input, "utf8");
  // "d": 普通弹幕，"gift": 录播姬 - 普通礼物，"sc": 录播姬 - SuperChat，"guard": 录播姬 - 舰长
  if (
    XMLdata.includes("</d>") ||
    XMLdata.includes("</gift>") ||
    XMLdata.includes("</sc>") ||
    XMLdata.includes("</guard>")
  )
    return false;

  return true;
};

/**
 * 屏蔽词过滤
 * @param input 输入文件
 * @param output 输出文件
 * @param blacklist 屏蔽词列表，换行分割
 */
const filterBlacklist2File = async (input: string, output: string, blacklist: string) => {
  const XMLdata = await fs.promises.readFile(input, "utf8");
  const outputContent = filterBlacklist(XMLdata, blacklist.split(","));
  await fs.promises.writeFile(output, outputContent);
  return output;
};

/**
 * 屏蔽词过滤
 * @param xmlContent xml内容
 * @param blacklist 屏蔽词列表
 */
const filterBlacklist = (XMLdata: string, blacklist: string[]) => {
  const parser = new XMLParser({ ignoreAttributes: false });
  const jObj = parser.parse(XMLdata);
  traversalObject(jObj, (key, value) => {
    if (key === "d" && Array.isArray(value)) {
      return value.filter((item: { "#text": string }) => {
        return blacklist.every((word) => {
          const text = String(item["#text"]);
          if (text.includes(word)) {
            return false;
          }
          return true;
        });
      });
    }
  });

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    format: true,
  });
  const xmlContent = builder.build(jObj);

  return xmlContent;
};

/**
 * 递归遍历对象
 */
const traversalObject = (obj: any, callback: (key: string, value: any) => any) => {
  for (const key in obj) {
    // is object not array
    if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      traversalObject(obj[key], callback);
    } else {
      const result = callback(key, obj[key]);
      if (result) {
        obj[key] = result;
      }
    }
  }
};

/**
 * 生成高能进度条
 */
export const genHotProgress = async (
  input: string,
  output: string,
  options: hotProgressOptions,
) => {
  const imageDir = join(os.tmpdir(), uuid());

  await generateDanmakuImage(input, imageDir, options);

  return convertImage2Video(imageDir, output, {
    removeOrigin: true,
    internal: options.interval,
  });
};
