import fs from "fs-extra";
import { createContainer, asValue, asClass } from "awilix";
import { default as checkDiskSpace } from "check-disk-space";

export * from "./presets/index.js";
import { taskQueue, TaskQueue } from "./task/task.js";
import { appConfig, AppConfig } from "./config.js";
import { DanmuPreset, VideoPreset, FFmpegPreset } from "./presets/index.js";
import { setFfmpegPath } from "./task/video.js";
import logger, { initLogger, setLogLevel } from "./utils/log.js";
import { migrateBiliUser, checkAccountLoop } from "./task/bili.js";
import BiliCheckQueue from "./task/BiliCheckQueue.js";
import { createInterval as checkSubLoop } from "./task/videoSub.js";
import { check as checkVirtualRecordLoop } from "./task/virtualRecord.js";
import { createRecorderManager } from "./recorder/index.js";
import { sendNotify } from "./notify.js";
import { initDB } from "./db/index.js";
import StatisticsService from "./db/service/statisticsService.js";

import type { GlobalConfig } from "@biliLive-tools/types";

const container = createContainer();

const init = async (config: GlobalConfig) => {
  appConfig.init(config.configPath, {
    ffmpegPath: config.defaultFfmpegPath,
    ffprobePath: config.defaultFfprobePath,
    danmuFactoryPath: config.defaultDanmakuFactoryPath,
  });
  const logLevel = appConfig.get("logLevel");
  initLogger(config.logPath, logLevel);

  appConfig.on("update", (data) => {
    setLogLevel(data.logLevel);
  });

  initDB(config.userDataPath);

  container.register({
    appConfig: asValue(appConfig),
    logger: asValue(console),
    globalConfig: asValue(config),
    taskQueue: asValue(taskQueue),
    commentQueue: asClass(BiliCheckQueue).singleton(),
    danmuPreset: asClass(DanmuPreset).singleton(),
    videoPreset: asClass(VideoPreset).singleton(),
    ffmpegPreset: asClass(FFmpegPreset).singleton(),
  });
  const recorderManager = await createRecorderManager(appConfig);
  container.register({
    recorderManager: asValue(recorderManager),
  });

  await migrate();
  setFfmpegPath();
  try {
    const commentQueue = container.resolve<BiliCheckQueue>("commentQueue");
    commentQueue.checkLoop();
    checkAccountLoop();
    checkDiskSpaceLoop();
    checkSubLoop();
    checkVirtualRecordLoop();
  } catch (error) {
    logger.error("初始化失败", error);
  }
  // 设置开始时间
  StatisticsService.addOrUpdate({
    where: { stat_key: "start_time" },
    create: { stat_key: "start_time", value: Date.now().toString() },
  });

  return container;
};

// 迁移数据
const migrate = async () => {
  await migrateBiliUser();
};

const checkDiskSpaceLoop = async () => {
  setInterval(
    async () => {
      const config = appConfig.getAll();
      const threshold = config?.notification?.task?.diskSpaceCheck?.threshold ?? 10;
      if (config?.notification?.task?.diskSpaceCheck?.values?.includes("bilirecorder")) {
        if (
          config?.webhook?.recoderFolder &&
          (await fs.pathExists(config?.webhook?.recoderFolder))
        ) {
          // @ts-ignore
          const diskInfo = await checkDiskSpace(config?.webhook?.recoderFolder);
          if (diskInfo.free < threshold * 1024 * 1024 * 1024) {
            console.warn("录播姬磁盘空间不足，请及时处理");
            sendNotify("空间不足", "录播姬磁盘空间不足，请及时处理");
          }
        }
      }
      if (config?.notification?.task?.diskSpaceCheck?.values?.includes("bililiveTools")) {
        if (config?.recorder?.savePath && (await fs.pathExists(config?.recorder?.savePath))) {
          // @ts-ignore
          const diskInfo = await checkDiskSpace(config?.recorder?.savePath);
          if (diskInfo.free < threshold * 1024 * 1024 * 1024) {
            console.warn("biliLiveTools录制磁盘空间不足，请及时处理");
            sendNotify("空间不足", "biliLiveTools录制磁盘空间不足，请及时处理");
          }
        }
      }
    },
    1000 * 60 * 60 * 2,
  );
};

export { init, AppConfig, appConfig, TaskQueue, migrate, createRecorderManager, container };
