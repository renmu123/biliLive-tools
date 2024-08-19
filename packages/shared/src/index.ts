import { createContainer, asValue } from "awilix";

import { appConfig, AppConfig } from "./config.js";
export * from "./presets/index.js";
import { setFfmpegPath, getFfmpegPath } from "./task/video.js";
import { initLogger } from "./utils/log.js";
import { taskQueue, TaskQueue } from "./task/task.js";
import { commentQueue, BiliCommentQueue } from "./task/bili.js";
import { createManager } from "./recorder/index.js";
// import { initDB } from "./db/index.js";

const container = createContainer();

const init = (config: {
  configPath: string;
  ffmpegPath: string;
  ffprobePath: string;
  danmakuFactoryPath: string;
  logPath: string;
}) => {
  appConfig.init(config.configPath, {
    ffmpegPath: config.ffmpegPath,
    ffprobePath: config.ffprobePath,
    danmuFactoryPath: config.danmakuFactoryPath,
  });

  const logLevel = appConfig.get("logLevel");
  initLogger(config.logPath, logLevel);
  setFfmpegPath();

  // initDB("danmu.db");

  container.register({
    appConfig: asValue(appConfig),
    logger: asValue(console),
    taskQueue: asValue(taskQueue),
    commentQueue: asValue(commentQueue),
  });
  // const { ffmpegPath } = getFfmpegPath();
  // createManager(ffmpegPath);
  return container;
};

export { init, AppConfig, appConfig, TaskQueue, BiliCommentQueue };
