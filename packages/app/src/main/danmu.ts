import fs from "fs-extra";
import { invokeWrap } from "./utils/index";

import { DanmuPreset } from "@biliLive-tools/shared";
import { convertXml2Ass, genHotProgress, isEmptyDanmu } from "@biliLive-tools/shared/task/danmu.js";
import { getSCDanmu, parseDanmu } from "@biliLive-tools/shared/danmu/index.js";
import { report, generateDanmakuData } from "@biliLive-tools/shared/danmu/hotProgress.js";
import { getConfigPath } from "./appConstant";

import type { DanmuPreset as DanmuPresetType } from "@biliLive-tools/types";
import type { IpcMainInvokeEvent } from "electron";

export const handlers = {
  "danmu:getPreset": async (_event: IpcMainInvokeEvent, id: string) => {
    const { DANMU_PRESET_PATH } = await getConfigPath();
    const danmuPreset = new DanmuPreset(DANMU_PRESET_PATH);
    return danmuPreset.get(id);
  },
  "danmu:savePreset": async (_event: IpcMainInvokeEvent, presets: DanmuPresetType) => {
    const { DANMU_PRESET_PATH } = await getConfigPath();
    const danmuPreset = new DanmuPreset(DANMU_PRESET_PATH);
    return danmuPreset.save(presets);
  },
  "danmu:deletePreset": async (_event: IpcMainInvokeEvent, id: string) => {
    const { DANMU_PRESET_PATH } = await getConfigPath();
    const danmuPreset = new DanmuPreset(DANMU_PRESET_PATH);
    return danmuPreset.delete(id);
  },
  "danmu:getPresets": async () => {
    const { DANMU_PRESET_PATH } = await getConfigPath();
    const danmuPreset = new DanmuPreset(DANMU_PRESET_PATH);
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
  "danmu:parseDanmu": invokeWrap(parseDanmu),
};
