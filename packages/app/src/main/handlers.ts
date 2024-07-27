import path from "node:path";
import fs from "fs-extra";

import { appConfig, ffmpegPreset } from "@biliLive-tools/shared";
import { convertVideo2Mp4, mergeAssMp4, mergeVideos } from "@biliLive-tools/shared/lib/task/video";
import douyu from "@biliLive-tools/shared/lib/task/douyu";
import JSZip from "jszip";
import { getConfigPath, FFMPEG_PATH, DANMUKUFACTORY_PATH, FFPROBE_PATH } from "./appConstant";
import { invokeWrap } from "./utils/index";

import type { AppConfig, FfmpegPreset as FfmpegPresetType } from "@biliLive-tools/types";
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
  "config:export": async (_event: IpcMainInvokeEvent, filePath: string) => {
    const { APP_CONFIG_PATH, VIDEO_PRESET_PATH, DANMU_PRESET_PATH, FFMPEG_PRESET_PATH } =
      await getConfigPath();

    const zip = new JSZip();
    // 添加文件到 ZIP
    zip.file(path.parse(APP_CONFIG_PATH).base, await fs.readFile(APP_CONFIG_PATH));
    if (await fs.pathExists(VIDEO_PRESET_PATH)) {
      zip.file(path.parse(VIDEO_PRESET_PATH).base, await fs.readFile(VIDEO_PRESET_PATH));
    }
    if (await fs.pathExists(DANMU_PRESET_PATH)) {
      zip.file(path.parse(DANMU_PRESET_PATH).base, await fs.readFile(DANMU_PRESET_PATH));
    }
    if (await fs.pathExists(FFMPEG_PRESET_PATH)) {
      zip.file(path.parse(FFMPEG_PRESET_PATH).base, await fs.readFile(FFMPEG_PRESET_PATH));
    }
    // 生成 ZIP 文件
    const content = await zip.generateAsync({ type: "nodebuffer" });
    await fs
      .writeFile(filePath, content)
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });
  },
  "config:import": async (_event: IpcMainInvokeEvent, filePath: string) => {
    const zip = new JSZip();
    const data = await zip.loadAsync(await fs.readFile(filePath));
    await Promise.all(
      Object.keys(data.files).map(async (filename) => {
        const file = data.files[filename];
        if (!file.dir) {
          const { APP_CONFIG_PATH, userDataPath } = await getConfigPath();

          const content = await file.async("nodebuffer");
          const filePath = path.join(userDataPath, filename);
          await fs.copyFile(filePath, path.join(userDataPath, `${filename}.backup`));
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
  "config:resetBin": (
    _event: IpcMainInvokeEvent,
    type: "ffmpeg" | "ffprobe" | "danmakuFactory",
  ) => {
    if (type === "ffmpeg") {
      return FFMPEG_PATH;
    } else if (type === "ffprobe") {
      return FFPROBE_PATH;
    } else if (type === "danmakuFactory") {
      return DANMUKUFACTORY_PATH;
    } else {
      throw new Error("未知的类型");
    }
  },
};

export const ffmpegHandlers = {
  "ffmpeg:presets:save": async (_event: IpcMainInvokeEvent, presets: FfmpegPresetType) => {
    return ffmpegPreset.save(presets);
  },
  "ffmpeg:presets:delete": async (_event: IpcMainInvokeEvent, id: string) => {
    return ffmpegPreset.delete(id);
  },
  "ffmpeg:presets:get": (_event: IpcMainInvokeEvent, id: string) => {
    return ffmpegPreset.get(id);
  },
  "ffmpeg:presets:list": () => {
    return ffmpegPreset.list();
  },
  "ffmpeg:presets:getOptions": () => {
    return ffmpegPreset.getFfmpegPresetOptions();
  },
  mergeAssMp4: async (_event: IpcMainInvokeEvent, ...args: Parameters<typeof mergeAssMp4>) => {
    const task = await mergeAssMp4(...args);
    return {
      taskId: task.taskId,
    };
  },
  convertVideo2Mp4: async (
    _event: IpcMainInvokeEvent,
    ...args: Parameters<typeof convertVideo2Mp4>
  ) => {
    const task = await convertVideo2Mp4(...args);
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
};

export const douyuHandlers = {
  "douyu:download": async (
    _event: IpcMainInvokeEvent,
    ...args: Parameters<typeof douyu.download>
  ) => {
    const { taskId } = await douyu.download(...args);
    return {
      taskId,
    };
  },
  "douyu:parseVideo": invokeWrap(douyu.parseVideo),
};
