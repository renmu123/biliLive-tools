import { appConfig, ffmpegPreset } from "@biliLive-tools/shared";
import {
  convertVideo2Mp4,
  mergeAssMp4,
  mergeVideos,
} from "@biliLive-tools/shared/lib/task/video.js";

import type { AppConfig, FfmpegPreset as FfmpegPresetType } from "@biliLive-tools/types";
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
  "ffmpeg:presets:save": async (_event: IpcMainInvokeEvent, presets: FfmpegPresetType) => {
    return ffmpegPreset.save(presets);
  },
  "ffmpeg:presets:delete": async (_event: IpcMainInvokeEvent, id: string) => {
    return ffmpegPreset.delete(id);
  },
  "ffmpeg:presets:get": (_event: IpcMainInvokeEvent, id: string) => {
    return ffmpegPreset.get(id);
  },
  "ffmpeg:presets:list": () => {
    return ffmpegPreset.list();
  },
  "ffmpeg:presets:getOptions": () => {
    return ffmpegPreset.getFfmpegPresetOptions();
  },
  mergeAssMp4: async (_event: IpcMainInvokeEvent, ...args: Parameters<typeof mergeAssMp4>) => {
    const task = await mergeAssMp4(...args);
    return {
      taskId: task.taskId,
    };
  },
  convertVideo2Mp4: async (
    _event: IpcMainInvokeEvent,
    ...args: Parameters<typeof convertVideo2Mp4>
  ) => {
    const task = await convertVideo2Mp4(...args);
    return {
      taskId: task.taskId,
    };
  },
  mergeVideos: async (_event: IpcMainInvokeEvent, ...args: Parameters<typeof mergeVideos>) => {
    const task = await mergeVideos(...args);
    return {
      taskId: task.taskId,
    };
  },
};
