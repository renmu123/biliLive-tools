import logger from "electron-log/node.js";
import type { LevelOption } from "electron-log";

logger.transports.file.maxSize = 1002430; // 10M
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

export default logger;
