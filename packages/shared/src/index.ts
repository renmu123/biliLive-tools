import { createContainer, asValue, asClass } from "awilix";

import { appConfig, AppConfig } from "./config.js";
import { DanmuPreset } from "./presets/index.js";
export * from "./presets/index.js";
import { setFfmpegPath } from "./task/video.js";
import { initLogger } from "./utils/log.js";
import { taskQueue, TaskQueue } from "./task/task.js";
import { BiliCommentQueue } from "./task/bili.js";

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
    commentQueue: asClass(BiliCommentQueue).singleton(),
    danmuPreset: asClass(DanmuPreset).singleton(),
    globalConfig: asValue(config),
  });

  const logLevel = appConfig.get("logLevel");
  initLogger(config.logPath, logLevel);
  setFfmpegPath();

  const commentQueue = container.resolve<BiliCommentQueue>("commentQueue");
  commentQueue.checkLoop();
  // initDB("danmu.db");

  appConfig.on("update", () => {
    const appconfig = container.resolve<AppConfig>("appConfig");
    const config = appconfig.getAll();
    commentQueue.interval = config.biliUpload.checkInterval;
  });

  return container;
};

export { init, AppConfig, appConfig, TaskQueue };
