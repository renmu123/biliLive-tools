import path from "node:path";
import fs from "fs-extra";

import { appConfig } from "@biliLive-tools/shared";
import { mergeAssMp4, mergeVideos } from "@biliLive-tools/shared/task/video.js";
import JSZip from "jszip";
import { getConfigPath } from "./appConstant";
import { invokeWrap } from "./utils/index";
import { getAvailableEncoders, readVideoMeta } from "@biliLive-tools/shared/task/video.js";
import logger from "./utils/log.js";

import type { AppConfig } from "@biliLive-tools/types";
import type { IpcMainInvokeEvent } from "electron";

export const configHandlers = {
  "config:set": (_event: IpcMainInvokeEvent, key: any, value: any) => {
    appConfig.set(key, value);
  },
  "config:get": (_event: IpcMainInvokeEvent, key: any) => {
    return appConfig.get(key);
  },
  "config:getAll": () => {
    return appConfig.getAll();
  },
  "config:save": (_event: IpcMainInvokeEvent, newConfig: AppConfig) => {
    appConfig.setAll(newConfig);
  },
  "config:import": async (_event: IpcMainInvokeEvent, filePath: string) => {
    const zip = new JSZip();
    const data = await zip.loadAsync(await fs.readFile(filePath));
    const { APP_CONFIG_PATH, userDataPath } = await getConfigPath();

    await Promise.all(
      Object.keys(data.files).map(async (filename) => {
        const file = data.files[filename];
        if (!file.dir) {
          const content = await file.async("nodebuffer");
          const filePath = path.join(userDataPath, filename);
          try {
            await fs.copyFile(filePath, path.join(userDataPath, `${filename}.backup`));
          } catch (e) {
            logger.warn("备份文件失败", e);
            console.error(e);
          }
          await fs.writeFile(filePath, content);

          // 如果filename是 appConfig.json，那么替换掉ffmpegPath、ffprobePath、danmuFactoryPath配置
          if (filename === "appConfig.json") {
            const data = await fs.readJSON(path.join(userDataPath, `${filename}.backup`));
            const appConfig = await fs.readJSON(APP_CONFIG_PATH);
            appConfig.ffmpegPath = data.ffmpegPath;
            appConfig.ffprobePath = data.ffprobePath;
            appConfig.danmuFactoryPath = data.danmuFactoryPath;
            await fs.writeJSON(filePath, appConfig);
          }
        }
      }),
    );
  },
};

export const ffmpegHandlers = {
  mergeAssMp4: async (_event: IpcMainInvokeEvent, ...args: Parameters<typeof mergeAssMp4>) => {
    const task = await mergeAssMp4(...args);
    return {
      taskId: task.taskId,
    };
  },
  mergeVideos: async (_event: IpcMainInvokeEvent, ...args: Parameters<typeof mergeVideos>) => {
    const task = await mergeVideos(...args);
    return {
      taskId: task.taskId,
    };
  },
  getAvailableEncoders: getAvailableEncoders,
  readVideoMeta: invokeWrap(readVideoMeta),
};
