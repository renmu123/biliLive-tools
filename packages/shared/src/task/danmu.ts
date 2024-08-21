import { join, parse } from "node:path";
import fs from "fs-extra";
import os from "node:os";
import readline from "node:readline";
import { isNumber } from "lodash-es";

import { pathExists, trashItem, uuid } from "../utils/index.js";
import log from "../utils/log.js";
import { appConfig } from "../config.js";
import { Danmu } from "../danmu/index.js";
import { generateDanmakuImage } from "../danmu/hotProgress.js";
import { DanmuTask, taskQueue } from "./task.js";
import { convertImage2Video, readVideoMeta } from "./video.js";

import type { DanmuConfig, DanmuOptions, hotProgressOptions } from "@biliLive-tools/types";
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

const getDanmuFactoryPath = () => {
  let path = appConfig.get("danmuFactoryPath");
  if (!appConfig.get("customExecPath")) {
    path = process.env.BILILIVE_DANMUKUFACTORY_PATH as string;
  }
  return path;
};

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
  const DANMUKUFACTORY_PATH = getDanmuFactoryPath();
  log.info("danmufactory", DANMUKUFACTORY_PATH);
  const danmu = new Danmu(DANMUKUFACTORY_PATH);
  let tempInput: string | undefined;

  if (options.copyInput) {
    tempInput = join(os.tmpdir(), `${uuid()}.xml`);
    await fs.copyFile(originInput, tempInput);
  }

  if (danmuOptions.blacklist) {
    const tempDir = os.tmpdir();
    const fileTxtPath = join(tempDir, `${uuid()}.txt`);
    const fileTxtContent = danmuOptions.blacklist
      .split(",")
      .filter((value) => value)
      .join("\n");
    await fs.writeFile(fileTxtPath, fileTxtContent);
    danmuOptions.blacklist = fileTxtPath;
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
        if (danmuOptions.blacklist && (await pathExists(danmuOptions.blacklist))) {
          await fs.unlink(danmuOptions.blacklist);
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
        if (danmuOptions.blacklist && (await pathExists(danmuOptions.blacklist))) {
          await fs.unlink(danmuOptions.blacklist);
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
export const isEmptyDanmu = async (filepath: string) => {
  const readStream = fs.createReadStream(filepath, { encoding: "utf8" });
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity,
  });
  // "d": 普通弹幕，"gift": 录播姬 - 普通礼物，"sc": 录播姬 - SuperChat，"guard": 录播姬 - 舰长
  for await (const line of rl) {
    if (
      line.includes("</d>") ||
      line.includes("</gift>") ||
      line.includes("</sc>") ||
      line.includes("</guard>")
    )
      return false;
  }
  return true;
};

/**
 * 生成高能进度条
 */
export const genHotProgress = async (
  input: string,
  output: string,
  options: hotProgressOptions,
) => {
  log.debug("generateDanmakuImage config", options);
  if (options.videoPath) {
    const videoMeta = await readVideoMeta(options.videoPath);
    const videoStream = videoMeta.streams.find((stream) => stream.codec_type === "video");
    const { width } = videoStream || {};
    options.width = width;
    options.duration = videoMeta.format.duration;
  }
  if (!options.duration || !isNumber(options.duration)) {
    throw new Error(`can not read duration in genHotProgress`);
  }
  if (!options.width) {
    throw new Error("can not read width in genHotProgress");
  }

  const imageDir = join(os.tmpdir(), uuid());
  const data = await generateDanmakuImage(
    input,
    imageDir,
    options as WithRequired<hotProgressOptions, "duration">,
  );
  log.debug("generateDanmakuImage done", `${data.length} images generated`);

  return convertImage2Video(imageDir, output, {
    removeOrigin: true,
    internal: options.interval,
  });
};
