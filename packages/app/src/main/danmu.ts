import fs from "fs-extra";
import { danmuPreset } from "@biliLive-tools/shared";
import { invokeWrap } from "./utils/index";

import {
  convertXml2Ass,
  genHotProgress,
  isEmptyDanmu,
} from "@biliLive-tools/shared/lib/task/danmu";
import { report, generateDanmakuData, getSCDanmu } from "@biliLive-tools/shared/lib/danmu/index";

import type { DanmuPreset as DanmuPresetType } from "@biliLive-tools/types";

import type { IpcMainInvokeEvent } from "electron";

export const handlers = {
  "danmu:getPreset": (_event: IpcMainInvokeEvent, id: string) => {
    return danmuPreset.get(id);
  },
  "danmu:savePreset": (_event: IpcMainInvokeEvent, presets: DanmuPresetType) => {
    return danmuPreset.save(presets);
  },
  "danmu:deletePreset": (_event: IpcMainInvokeEvent, id: string) => {
    return danmuPreset.delete(id);
  },
  "danmu:getPresets": () => {
    const presets = danmuPreset.list();
    return presets;
  },
  "danmu:convertXml2Ass": async (
    _event: IpcMainInvokeEvent,
    ...args: Parameters<typeof convertXml2Ass>
  ) => {
    const task = await convertXml2Ass(...args);
    return {
      taskId: task.taskId,
    };
  },
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
  "danmu:genHotProgress": async (
    _event: IpcMainInvokeEvent,
    ...args: Parameters<typeof genHotProgress>
  ) => {
    const task = await genHotProgress(...args);
    return {
      taskId: task.taskId,
    };
  },
  "danmu:isEmptyDanmu": invokeWrap(isEmptyDanmu),
  "danmu:generateDanmakuData": invokeWrap(generateDanmakuData),
  "danmu:getSCDanmu": invokeWrap(getSCDanmu),
};
