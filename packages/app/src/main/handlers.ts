import { appConfig, ffmpegPreset } from "@biliLive-tools/shared";

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
  "ffmpeg:presets:save": async (
    _event: IpcMainInvokeEvent | undefined,
    presets: FfmpegPresetType,
  ) => {
    return ffmpegPreset.save(presets);
  },
  "ffmpeg:presets:delete": async (_event: IpcMainInvokeEvent | undefined, id: string) => {
    return ffmpegPreset.delete(id);
  },
  "ffmpeg:presets:get": (_event: IpcMainInvokeEvent, id: string) => {
    return ffmpegPreset.get(id);
  },
  "ffmpeg:presets:list": (_event: IpcMainInvokeEvent) => {
    return ffmpegPreset.list();
  },
  "ffmpeg:presets:getOptions": (_event: IpcMainInvokeEvent) => {
    return ffmpegPreset.getFfmpegPresetOptions();
  },
};
