import { join, parse } from "path";

import { pathExists, trashItem } from "./utils/index";
import log from "./utils/log";
import CommonPreset from "./utils/preset";
import { Danmu } from "../core/index";
import { DANMU_PRESET_PATH } from "./appConstant";
import { DanmuTask, taskQueue } from "./task";

import type { DanmuConfig, File, DanmuOptions, DanmuPreset as DanmuPresetType } from "../types";
import { type IpcMainInvokeEvent } from "electron";

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
};

export const convertDanmu2Ass = async (
  _event: IpcMainInvokeEvent,
  files: File[],
  presetId: string,
  options: DanmuOptions = {
    saveRadio: 1,
    saveOriginPath: true,
    savePath: "",

    override: false,
    removeOrigin: false,
  },
) => {
  const danmu = new Danmu(DANMUKUFACTORY_PATH);

  const tasks: {
    output?: string;
    taskId?: string;
  }[] = [];
  for (const file of files) {
    const { dir, name, path } = file;

    const input = path;
    let output = join(dir, `${name}.ass`);
    if (options.saveRadio === 2 && options.savePath) {
      output = join(options.savePath, `${name}.ass`);
    }

    if (!(await pathExists(input))) {
      log.error("danmufactory input file not exist", input);
      continue;
    }

    if (await pathExists(output)) {
      if (options.override) {
        log.info("danmufactory", {
          status: "success",
          text: "文件已存在，移除进入回收站",
          input: input,
          output: output,
        });
        await trashItem(output);
      } else {
        log.info("danmufactory", {
          status: "success",
          text: "文件已存在，跳过",
          input: input,
          output: output,
        });
        tasks.push({
          output,
        });
        continue;
      }
    }

    const argsObj = (await danmuPreset.get(presetId)).config;
    const task = new DanmuTask(
      danmu,
      _event.sender,
      {
        input,
        output,
        options: argsObj,
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
    taskQueue.addTask(task, true);
    tasks.push({
      taskId: task.taskId,
    });

    // try {
    //   const { stdout, stderr } = await danmu.convertXml2Ass(input, output, argsObj);
    //   log.info(`danmukufactory command: ${danmu.command}`);

    //   log.debug("stdout", stdout);
    //   if (stderr) {
    //     log.error("stderr", stderr);
    //     result.push({
    //       status: "error",
    //       text: stdout,
    //       input: input,
    //       meta: {
    //         stdout,
    //         stderr,
    //       },
    //     });
    //   } else {
    //     log.info(
    //       "danmufactory",
    //       JSON.stringify({
    //         status: "success",
    //         text: stdout,
    //         input: input,
    //         output: output,
    //         meta: {
    //           stdout,
    //           stderr,
    //         },
    //       }),
    //     );
    //     result.push({
    //       status: "success",
    //       text: stdout,
    //       input: input,
    //       output: output,
    //       meta: {
    //         stdout,
    //         stderr,
    //       },
    //     });
    //   }

    //   if (options.removeOrigin && (await pathExists(input))) {
    //     await trashItem(input);
    //   }
    // } catch (err) {
    //   log.error("danmufactory exec error:", err, danmu.command);
    //   result.push({ status: "error", text: String(err), input: input, meta: { err } });
    // }
  }

  return tasks;
};

const danmuPreset = new CommonPreset(DANMU_PRESET_PATH, DANMU_DEAFULT_CONFIG);
// 保存弹幕预设
export const saveDanmuPreset = async (_event: IpcMainInvokeEvent, presets: DanmuPresetType) => {
  return danmuPreset.save(presets);
};
// 删除弹幕预设
export const deleteDanmuPreset = async (_event: IpcMainInvokeEvent, id: string) => {
  return await danmuPreset.delete(id);
};
// 读取弹幕预设
export const readDanmuPreset = async (_event: IpcMainInvokeEvent, id: string) => {
  const preset = await danmuPreset.get(id);
  return preset;
};
// 读取所有弹幕预设
export const readDanmuPresets = async () => {
  const presets = await danmuPreset.list();
  return presets;
};
