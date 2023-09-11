import Config from "../utils/config";
import log from "../utils/log";

import type { IpcMainInvokeEvent } from "electron";
import type { AppConfig } from "../../types";

export const APP_DEFAULT_CONFIG: AppConfig = {
  logLevel: "warn",
};

const getConfig = () => {
  const config = new Config("appConfig.json");
  return config;
};

export const saveAppConfig = (_event: IpcMainInvokeEvent, newConfig: AppConfig) => {
  const config = getConfig();
  log.transports.file.level = newConfig.logLevel;
  config.setAll(newConfig);
};
export const getAppConfig = () => {
  const config = getConfig();
  return { ...APP_DEFAULT_CONFIG, ...config.data };
};
