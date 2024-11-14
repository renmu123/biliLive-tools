import { appConfig } from "@biliLive-tools/shared";
import { mergeAssMp4 } from "@biliLive-tools/shared/task/video.js";
import { invokeWrap } from "./utils/index";
import { getAvailableEncoders, readVideoMeta } from "@biliLive-tools/shared/task/video.js";

import type { AppConfig } from "@biliLive-tools/types";
import type { IpcMainInvokeEvent } from "electron";

export const configHandlers = {
  "config:set": (_event: IpcMainInvokeEvent, key: any, value: any) => {
    appConfig.set(key, value);
  },
  "config:get": (_event: IpcMainInvokeEvent, key: any) => {
    return appConfig.get(key);
  },
  "config:getAll": () => {
    return appConfig.getAll();
  },
  "config:save": (_event: IpcMainInvokeEvent, newConfig: AppConfig) => {
    appConfig.setAll(newConfig);
  },
};

export const ffmpegHandlers = {
  mergeAssMp4: async (_event: IpcMainInvokeEvent, ...args: Parameters<typeof mergeAssMp4>) => {
    const task = await mergeAssMp4(...args);
    return {
      taskId: task.taskId,
    };
  },
  getAvailableEncoders: getAvailableEncoders,
  readVideoMeta: invokeWrap(readVideoMeta),
};
