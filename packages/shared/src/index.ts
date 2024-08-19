import { createContainer, asValue } from "awilix";

import { appConfig, AppConfig } from "./config.js";
export * from "./presets/index.js";
import { setFfmpegPath } from "./task/video.js";
import { initLogger } from "./utils/log.js";
import { taskQueue, TaskQueue } from "./task/task.js";
import { commentQueue, BiliCommentQueue } from "./task/bili.js";

import type { GlobalConfig } from "@biliLive-tools/types";

// import { initDB } from "./db/index.js";

export const container = createContainer();

const init = (config: GlobalConfig) => {
  appConfig.init(config.configPath, {
    ffmpegPath: config.defaultFfmpegPath,
    ffprobePath: config.defaultFfprobePath,
    danmuFactoryPath: config.defaultDanmakuFactoryPath,
  });

  container.register({
    appConfig: asValue(appConfig),
    logger: asValue(console),
    taskQueue: asValue(taskQueue),
    commentQueue: asValue(commentQueue),
    globalConfig: asValue(config),
  });

  const logLevel = appConfig.get("logLevel");
  initLogger(config.logPath, logLevel);
  setFfmpegPath();
  // initDB("danmu.db");

  return container;
};

export { init, AppConfig, appConfig, TaskQueue, BiliCommentQueue };
