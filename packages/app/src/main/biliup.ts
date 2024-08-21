import { invokeWrap } from "./utils/index";
import { VideoPreset } from "@biliLive-tools/shared";
import { biliApi } from "./bili";

import type { IpcMainInvokeEvent } from "electron";
import type { BiliupConfig, BiliupConfigAppend, BiliupPreset } from "@biliLive-tools/types";
import { getConfigPath } from "./appConstant";

export const handlers = {
  "bili:validUploadParams": invokeWrap(biliApi.validateBiliupConfig),
  "bili:getPreset": async (_event: IpcMainInvokeEvent, id: string) => {
    const { VIDEO_PRESET_PATH } = await getConfigPath();
    const videoPreset = new VideoPreset(VIDEO_PRESET_PATH);
    return videoPreset.get(id);
  },
  "bili:savePreset": async (_event: IpcMainInvokeEvent, presets: BiliupPreset) => {
    const { VIDEO_PRESET_PATH } = await getConfigPath();
    const videoPreset = new VideoPreset(VIDEO_PRESET_PATH);
    return videoPreset.save(presets);
  },
  "bili:deletePreset": async (_event: IpcMainInvokeEvent, id: string) => {
    const { VIDEO_PRESET_PATH } = await getConfigPath();
    const videoPreset = new VideoPreset(VIDEO_PRESET_PATH);
    return videoPreset.delete(id);
  },
  "bili:getPresets": async () => {
    const { VIDEO_PRESET_PATH } = await getConfigPath();
    const videoPreset = new VideoPreset(VIDEO_PRESET_PATH);
    return videoPreset.list();
  },
  "bili:uploadVideo": async (
    _event: IpcMainInvokeEvent,
    uid: number,
    pathArray: string[],
    options: BiliupConfig,
  ) => {
    const task = await biliApi.addMedia(pathArray, options, uid);
    return {
      taskId: task.taskId,
    };
  },
  "bili:appendVideo": async (
    _event: IpcMainInvokeEvent,
    uid: number,
    pathArray: string[],
    options: BiliupConfigAppend,
  ) => {
    const task = await biliApi.editMedia(options.vid as number, pathArray, options, uid);
    return {
      taskId: task.taskId,
    };
  },
};
