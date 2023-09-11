import path from "path";

import logger from "electron-log";
import { app } from "electron";

if (import.meta.env.MODE === "development") {
  logger.transports.file.level = "debug";
} else {
  logger.transports.file.level = "warn";
}

logger.transports.file.maxSize = 1002430; // 10M
logger.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}";
const dateObj = new Date();
const date = dateObj.getFullYear() + "-" + (dateObj.getMonth() + 1) + "-" + dateObj.getDate();
logger.transports.file.resolvePath = () => path.join(app.getPath("logs"), `${date}.log`);

export default logger;
