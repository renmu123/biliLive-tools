import path from "path";

import logger from "electron-log";
import { app } from "electron";

logger.transports.file.maxSize = 1002430; // 10M
logger.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}";
const dateObj = new Date();
const date = dateObj.getFullYear() + "-" + (dateObj.getMonth() + 1) + "-" + dateObj.getDate();
logger.transports.file.resolvePathFn = () => path.join(app.getPath("logs"), `${date}.log`);

export default logger;
