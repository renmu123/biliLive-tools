import { invokeWrap } from "./utils/index";
import { biliApi } from "./bili";

import type { IpcMainInvokeEvent } from "electron";
import type { BiliupConfig, BiliupConfigAppend } from "@biliLive-tools/types";

export const handlers = {
  "bili:validUploadParams": invokeWrap(biliApi.validateBiliupConfig),
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
