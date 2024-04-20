import path from "path";

import logger from "electron-log";
import { app } from "electron";
import { getAppConfig } from "../config";

const appConfig = getAppConfig();

logger.transports.file.level = appConfig.logLevel;

logger.transports.file.maxSize = 1002430; // 10M
logger.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}";
logger.transports.file.resolvePathFn = () => path.join(app.getPath("logs"), `main.log`);

export default logger;
