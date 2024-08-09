import { appConfig } from "./config.js";
export * from "./presets/index.js";
import { setFfmpegPath } from "./task/video.js";
import { initLogger } from "./utils/log.js";
// import { initDB } from "./db/index.js";

const init = (config: {
  configPath: string;
  ffmpegPath: string;
  ffprobePath: string;
  danmakuFactoryPath: string;
  logPath: string;
  downloadPath: string;
}) => {
  appConfig.init(config.configPath, {
    ffmpegPath: config.ffmpegPath,
    ffprobePath: config.ffprobePath,
    danmuFactoryPath: config.danmakuFactoryPath,
    tool: {
      download: {
        savePath: config.downloadPath,
      },
    },
  });

  const logLevel = appConfig.get("logLevel");
  initLogger(config.logPath, logLevel);
  setFfmpegPath();

  // initDB("danmu.db");
};

export { appConfig, init };
