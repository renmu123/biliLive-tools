import axios from "axios";

import logger from "electron-log/node.js";
import type { LevelOption } from "electron-log";

logger.transports.file.maxSize = 1002430 * 5; // 5M
logger.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}";
// logger.transports.file.resolvePathFn = () => path.join(app.getPath("logs"), `main.log`);

export function initLogger(path: string, level: LevelOption) {
  logger.transports.file.resolvePathFn = () => path;
  setLogLevel(level);
  logger.transports.file.setAppName("biliLive-tools");
  return logger;
}

export function setLogLevel(level: LevelOption) {
  logger.transports.file.level = level;
}

const clearAxiosLog = (args: any[]) => {
  return args.map((arg) => {
    try {
      if (axios.isAxiosError(arg)) {
        const axiosError = arg;
        if (axiosError?.config?.transformRequest) {
          axiosError.config.transformRequest = undefined;
        }
        if (axiosError?.config?.transformResponse) {
          axiosError.config.transformResponse = undefined;
        }
        if (axiosError?.config?.env) {
          axiosError.config.env = undefined;
        }
        if (axiosError?.config?.headers?.cookie) {
          delete axiosError.config.headers.cookie;
        }
        return axiosError;
      }
    } catch (e) {
      return arg;
    }
    return arg;
  });
};

const logObj = {
  info: (...args: any[]) => {
    logger.info(...clearAxiosLog(args));
  },
  error: (...args: any[]) => {
    logger.error(...clearAxiosLog(args));
  },
  warn: (...args: any[]) => {
    logger.warn(...clearAxiosLog(args));
  },
  debug: (...args: any[]) => {
    logger.debug(...clearAxiosLog(args));
  },
};

export default logObj;
