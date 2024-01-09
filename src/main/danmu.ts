import { join, parse } from "node:path";
import fs from "fs-extra";

import { pathExists, trashItem, __dirname } from "./utils/index";
import log from "./utils/log";
import CommonPreset from "./utils/preset";
import { Danmu } from "../core/index";
import { DANMU_PRESET_PATH } from "./appConstant";
import { DanmuTask, taskQueue } from "./task";

import type { DanmuConfig, DanmuOptions, DanmuPreset as DanmuPresetType } from "../types";
import type { IpcMainInvokeEvent, WebContents } from "electron";

const DANMUKUFACTORY_PATH = join(__dirname, "../../resources/bin/DanmakuFactory.exe").replace(
  "app.asar",
  "app.asar.unpacked",
);
log.info(`DANMUKUFACTORY_PATH: ${DANMUKUFACTORY_PATH}`);

export const DANMU_DEAFULT_CONFIG: DanmuConfig = {
  resolution: [1920, 1080],
  scrolltime: 12.0,
  fixtime: 5.0,
  density: 0,
  fontname: "Microsoft YaHei",
  fontsize: 38,
  opacity: 255,
  outline: 0.0,
  shadow: 1.0,
  displayarea: 1.0,
  scrollarea: 1.0,
  bold: false,
  showusernames: false,
  showmsgbox: true,
  msgboxsize: [500, 1080],
  msgboxpos: [20, 0],
  msgboxfontsize: 38,
  msgboxduration: 10.0,
  giftminprice: 10.0,
  giftmergetolerance: 0.0,
  blockmode: [],
  statmode: [],
  resolutionResponsive: false,
};

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
  console.log(danmuOptions);
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

const danmuPreset = new CommonPreset(DANMU_PRESET_PATH, DANMU_DEAFULT_CONFIG);
// 保存弹幕预设
export const saveDanmuPreset = async (
  _event: IpcMainInvokeEvent | undefined,
  presets: DanmuPresetType,
) => {
  return danmuPreset.save(presets);
};
// 删除弹幕预设
export const deleteDanmuPreset = async (_event: IpcMainInvokeEvent | undefined, id: string) => {
  return await danmuPreset.delete(id);
};
// 读取弹幕预设
export const readDanmuPreset = async (_event: IpcMainInvokeEvent | undefined, id: string) => {
  const preset = await danmuPreset.get(id);
  return preset;
};
// 读取所有弹幕预设
export const readDanmuPresets = async () => {
  const presets = await danmuPreset.list();
  return presets;
};

export const handlers = {
  "danmu:convertXml2Ass": convertXml2Ass,
  "danmu:getPreset": readDanmuPreset,
  "danmu:savePreset": saveDanmuPreset,
  "danmu:deletePreset": deleteDanmuPreset,
  "danmu:getPresets": readDanmuPresets,
};
