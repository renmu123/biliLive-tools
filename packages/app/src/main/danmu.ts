import { join, parse } from "node:path";
import fs from "fs-extra";
import os from "node:os";
import { XMLParser } from "fast-xml-parser";

import { pathExists, trashItem, __dirname, uuid } from "./utils/index";
import log from "./utils/log";
import { danmuPreset } from "@biliLive-tools/shared";
import { Danmu, report, generateDanmakuImage } from "../core/danmu";
import { DanmuTask, taskQueue } from "./task";
import { convertImage2Video } from "./video";

import type {
  DanmuConfig,
  DanmuOptions,
  DanmuPreset as DanmuPresetType,
  hotProgressOptions,
} from "../types";
import type { IpcMainInvokeEvent, WebContents } from "electron";

const DANMUKUFACTORY_PATH = join(__dirname, "../../resources/bin/DanmakuFactory.exe").replace(
  "app.asar",
  "app.asar.unpacked",
);
log.info(`DANMUKUFACTORY_PATH: ${DANMUKUFACTORY_PATH}`);

export const addConvertDanmu2AssTask = async (
  sender: WebContents,
  input: string,
  output: string,
  danmuOptions: DanmuConfig,
  autoRun: boolean = true,
  options: { removeOrigin: boolean },
) => {
  if (await pathExists(output)) {
    log.info("danmufactory", {
      status: "success",
      text: "文件已存在，删除",
      input: input,
      output: output,
    });
    await fs.unlink(output);
  }

  const danmu = new Danmu(DANMUKUFACTORY_PATH);
  const task = new DanmuTask(
    danmu,
    sender,
    {
      input,
      output,
      options: danmuOptions,
      name: `弹幕转换任务: ${parse(input).name}`,
    },
    {
      onEnd: async () => {
        if (options.removeOrigin && (await pathExists(input))) {
          await trashItem(input);
        }
      },
    },
  );
  taskQueue.addTask(task, autoRun);
  return task;
};

export const convertXml2Ass = async (
  _event: IpcMainInvokeEvent,
  files: {
    input: string;
    output?: string;
  }[],
  danmuOptions: DanmuConfig,
  options: DanmuOptions = {
    removeOrigin: false,
  },
) => {
  const tasks: {
    output?: string;
    taskId?: string;
  }[] = [];
  for (const file of files) {
    const { dir, name } = parse(file.input);

    const input = file.input;
    let output = join(dir, `${name}.ass`);
    if (options.saveRadio === 2 && options.savePath) {
      output = join(options.savePath, `${name}.ass`);
    }
    if (file.output) {
      output = file.output;
    }

    if (!(await pathExists(input))) {
      log.error("danmufactory input file not exist", input);
      throw new Error(`danmufactory input file not exist: ${input}`);
    }

    const task = await addConvertDanmu2AssTask(
      _event.sender,
      input,
      output,
      danmuOptions,
      true,
      options,
    );
    tasks.push({
      taskId: task.taskId,
    });
  }

  return tasks;
};

/**
 * 判断xml中弹幕是否为空
 */
export const isEmptyDanmu = async (input: string) => {
  const XMLdata = await fs.promises.readFile(input, "utf8");
  const parser = new XMLParser({ ignoreAttributes: false });
  const jObj = parser.parse(XMLdata);
  const danmuku = jObj?.i?.d || [];
  return danmuku.length === 0;
};

// 读取所有弹幕预设
export const readDanmuPresets = async () => {
  const presets = await danmuPreset.list();
  return presets;
};

export const genHotProgress = async (
  webContents: WebContents,
  input: string,
  output: string,
  options: hotProgressOptions,
) => {
  const imageDir = join(os.tmpdir(), uuid());

  await generateDanmakuImage(input, imageDir, options);

  return convertImage2Video(webContents, imageDir, output, {
    removeOrigin: true,
    internal: options.interval,
  });
};

export const handlers = {
  "danmu:getPreset": (_event: IpcMainInvokeEvent | undefined, id: string) => {
    return danmuPreset.get(id);
  },
  "danmu:savePreset": (_event: IpcMainInvokeEvent | undefined, presets: DanmuPresetType) => {
    return danmuPreset.save(presets);
  },
  "danmu:deletePreset": (_event: IpcMainInvokeEvent | undefined, id: string) => {
    return danmuPreset.delete(id);
  },
  "danmu:getPresets": () => {
    const presets = danmuPreset.list();
    return presets;
  },
  "danmu:convertXml2Ass": convertXml2Ass,
  "danmu:saveReport": async (
    _event: IpcMainInvokeEvent,
    options: {
      input: string;
      output: string;
    },
  ) => {
    const data = await report(options.input);
    await fs.writeFile(options.output, data);
  },
  "danmu:genHotProgress": (
    _event: IpcMainInvokeEvent,
    input: string,
    output: string,
    options: hotProgressOptions,
  ) => {
    return genHotProgress(_event.sender, input, output, options);
  },
  "danmu:isEmptyDanmu": (_event: IpcMainInvokeEvent, input: string) => {
    return isEmptyDanmu(input);
  },
};
