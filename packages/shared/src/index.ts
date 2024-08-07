import { appConfig } from "./config.js";
import { ffmpegPreset, videoPreset, danmuPreset } from "./presets/index.js";
export * from "./presets/index.js";
import { setFfmpegPath } from "./task/video.js";
import { initLogger } from "./utils/log.js";
import { initDB } from "./db/index.js";

const init = (config: {
  configPath: string;
  ffmpegPath: string;
  ffprobePath: string;
  danmakuFactoryPath: string;
  logPath: string;
  downloadPath: string;
  ffmpegPresetPath: string;
  videoPresetPath: string;
  danmuPresetPath: string;
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
  ffmpegPreset.init(config.ffmpegPresetPath);
  videoPreset.init(config.videoPresetPath);
  danmuPreset.init(config.danmuPresetPath);

  const logLevel = appConfig.get("logLevel");
  initLogger(config.logPath, logLevel);
  setFfmpegPath();

  initDB("danmu.db");
};

export { appConfig, init };
