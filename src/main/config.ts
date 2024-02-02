import path from "node:path";

import Config from "./utils/config";
import { app } from "electron";
import { defaultsDeep } from "lodash-es";
import log from "../utils/log";
import { setFfmpegPath } from "./video";

import type { AppConfig } from "../types";
import type { IpcMainInvokeEvent } from "electron";

export const APP_DEFAULT_CONFIG: AppConfig = {
  logLevel: "warn",
  autoUpdate: true,
  trash: false,
  useBiliup: false,
  webhook: {
    port: 18010,
    open: false,
    recoderFolder: "",
    minSize: 20,
    title: "【{{user}}】{{title}}-{{now}}",
    uploadPresetId: undefined,
    blacklist: "",
    danmu: false,
    rooms: {},
    ffmpegPreset: undefined,
    danmuPreset: undefined,
    autoPartMerge: false,
    partMergeMinute: 10,
    hotProgress: false,
    useLiveCover: false,
    hotProgressSample: 30,
    hotProgressHeight: 60,
    hotProgressColor: "#f9f5f3",
    hotProgressFillColor: "#333333",
  },
  ffmpegPath: path.join(
    path.dirname(app.getPath("exe")),
    "resources",
    "app.asar.unpacked",
    "resources",
    "bin",
    "ffmpeg.exe",
  ),
  ffprobePath: path.join(
    path.dirname(app.getPath("exe")),
    "resources",
    "app.asar.unpacked",
    "resources",
    "bin",
    "ffprobe.exe",
  ),
  biliUser: {},
  tool: {
    home: {
      uploadPresetId: "default",
      danmuPresetId: "default",
      ffmpegPresetId: "default",
      removeOrigin: false,
      openFolder: false,
      autoUpload: false,
      hotProgress: false,
      hotProgressSample: 30,
      hotProgressHeight: 60,
      hotProgressColor: "#f9f5f3",
      hotProgressFillColor: "#333333",
    },
    upload: {
      uploadPresetId: "default",
    },
    danmu: {
      danmuPresetId: "default",
      saveRadio: 1,
      savePath: "",
      removeOrigin: false,
      openFolder: false,
    },
    video2mp4: {
      saveRadio: 1,
      savePath: "",
      saveOriginPath: false,
      override: false,
      removeOrigin: false,
    },
    videoMerge: {
      saveOriginPath: false,
      removeOrigin: false,
    },
  },
};

function get<K extends keyof AppConfig>(key: K): AppConfig[K] {
  const config = getAppConfig();
  return config[key];
}

function set<K extends keyof AppConfig>(key: K, value: AppConfig[K]) {
  const config = getConfig();
  config.set(key, value);
}

const getConfig = () => {
  const config = new Config("appConfig.json");
  return config;
};

export const saveAppConfig = (newConfig: AppConfig) => {
  const config = getConfig();
  log.transports.file.level = newConfig.logLevel;
  log.info("saveAppConfig", newConfig);
  config.setAll(newConfig);
  setFfmpegPath();
};
export const getAppConfig = (): AppConfig => {
  const config = getConfig();
  const data = config.read();

  // 兼容旧版本，0.8版本增加
  for (const key of Object.keys(data.webhook.rooms)) {
    if (!data.webhook.rooms[key].noGlobal) {
      data.webhook.rooms[key].noGlobal = [
        "minSize",
        "title",
        "uploadPresetId",
        "danmu",
        "ffmpegPreset",
        "danmuPreset",
        "autoPartMerge",
        "partMergeMinute",
        "uid",
      ];
    }
  }

  return defaultsDeep(data, APP_DEFAULT_CONFIG);
};

export const appConfig = {
  get,
  set,
  save: saveAppConfig,
  getAll: getAppConfig,
};

export const handlers = {
  "config:set": (_event: IpcMainInvokeEvent, key: any, value: any) => {
    set(key, value);
  },
  "config:get": (_event: IpcMainInvokeEvent, key: any) => {
    return get(key);
  },
  "config:getAll": () => {
    return getAppConfig();
  },
  "config:save": (_event: IpcMainInvokeEvent, newConfig: AppConfig) => {
    saveAppConfig(newConfig);
  },
};
