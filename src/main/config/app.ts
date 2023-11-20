import path from "path";
import { app } from "electron";
import { defaultsDeep } from "lodash";

import Config from "../utils/config";
import log from "../utils/log";
import { setFfmpegPath } from "../video";

import type { IpcMainInvokeEvent } from "electron";
import type { AppConfig } from "../../types";

export const APP_DEFAULT_CONFIG: AppConfig = {
  logLevel: "warn",
  trash: true, // 是否移动至回收站
  webhook: {
    open: false,
    recoderFolder: "",
    autoUpload: false,
    minSize: 20,
    title: "",
    uploadPresetId: "",
    blacklist: "",
    rooms: {},
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
};

console.log(APP_DEFAULT_CONFIG);

const getConfig = () => {
  const config = new Config("appConfig.json");
  return config;
};

export const saveAppConfig = (_event: IpcMainInvokeEvent, newConfig: AppConfig) => {
  const config = getConfig();
  log.transports.file.level = newConfig.logLevel;
  log.info("saveAppConfig", newConfig);
  config.setAll(newConfig);
  setFfmpegPath();
};
export const getAppConfig = (): AppConfig => {
  const config = getConfig();

  return defaultsDeep(config.data, APP_DEFAULT_CONFIG);
};
