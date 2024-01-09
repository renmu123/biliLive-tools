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
    title: "",
    uploadPresetId: undefined,
    blacklist: "",
    danmu: false,
    rooms: {},
    ffmpegPreset: undefined,
    danmuPreset: undefined,
    autoPartMerge: false,
    partMergeMinute: 10,
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
