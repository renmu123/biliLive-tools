import fs from "fs-extra";
import path from "node:path";
import axios from "axios";
import { omit } from "lodash-es";

import { provider as providerForDouYu } from "@bililive-tools/douyu-recorder";
import { provider as providerForHuYa } from "@bililive-tools/huya-recorder";
import { provider as providerForBiliBili } from "@bililive-tools/bilibili-recorder";
import {
  createRecorderManager as createManager,
  setFFMPEGPath,
  utils,
} from "@bililive-tools/manager";

// import LiveService from "../db/service/liveService.js";
// import DanmuService from "../db/service/danmuService.js";
import { getFfmpegPath, transcode } from "../task/video.js";
import logger from "../utils/log.js";
import RecorderConfig from "./config.js";
import { sleep, replaceExtName } from "../utils/index.js";
// import { parseDanmu } from "../danmu/index.js";

import type { AppConfig } from "../config.js";
import type { Recorder as RecorderConfigType } from "@biliLive-tools/types";
import type { Recorder } from "@bililive-tools/manager";

export { RecorderConfig };

async function convert2Mp4(videoFile: string): Promise<string> {
  const output = replaceExtName(videoFile, ".mp4");
  if (await fs.pathExists(output)) return output;

  const name = path.basename(output);
  return new Promise((resolve, reject) => {
    transcode(
      videoFile,
      name,
      {
        encoder: "copy",
        audioCodec: "copy",
      },
      {
        saveType: 1,
        savePath: ".",
        override: false,
        removeOrigin: false,
      },
    ).then((task) => {
      task.on("task-end", () => {
        resolve(output);
      });
      task.on("task-error", () => {
        reject();
      });
    });
  });
}

export async function createRecorderManager(appConfig: AppConfig) {
  /**
   * 更新录制器
   * @param args - 更新参数
   * @returns 更新后的录制器
   */
  async function updateRecorder(
    recorder: Recorder,
    args: Omit<RecorderConfigType, "channelId" | "providerId">,
  ) {
    Object.assign(recorder, { ...omit(args, ["id"]) });
    return recorder;
  }

  /**
   * 全局配置更新后，更新录制器相关参数
   */
  async function updateRecorderManager(
    manager: ReturnType<typeof createManager>,
    appConfig: AppConfig,
  ) {
    const config = appConfig.getAll();
    const savePathRule = path.join(config?.recorder?.savePath, config?.recorder?.nameRule);
    const autoCheckInterval = config?.recorder?.checkInterval ?? 60;
    const autoCheckLiveStatusAndRecord = config?.recorder?.autoRecord ?? false;

    manager.autoCheckInterval = autoCheckInterval * 1000;
    manager.autoCheckLiveStatusAndRecord = autoCheckLiveStatusAndRecord;
    manager.savePathRule = savePathRule;
    manager.biliBatchQuery = config?.recorder?.bilibili.useBatchQuery ?? false;

    if (autoCheckLiveStatusAndRecord) {
      if (autoCheckLiveStatusAndRecord && !manager.isCheckLoopRunning) {
        manager.startCheckLoop();
      }

      if (!autoCheckLiveStatusAndRecord && manager.isCheckLoopRunning) {
        manager.stopCheckLoop();
      }
    }

    for (const recorderOpts of recorderConfig.list()) {
      try {
        const recorder = manager.recorders.find((item) => item.id === recorderOpts.id);
        if (recorder == null) continue;

        await updateRecorder(recorder, recorderOpts);
      } catch (error) {
        logger.error("updateRecorderManager error", error);
        continue;
      }
    }
  }

  const config = appConfig.getAll();
  const { ffmpegPath } = getFfmpegPath();
  setFFMPEGPath(ffmpegPath);

  const savePathRule = path.join(config?.recorder?.savePath, config?.recorder?.nameRule);
  const autoCheckInterval = config?.recorder?.checkInterval ?? 60;
  const autoCheckLiveStatusAndRecord = config?.recorder?.autoRecord ?? false;

  const manager = createManager({
    providers: [providerForDouYu, providerForHuYa, providerForBiliBili],
    autoRemoveSystemReservedChars: true,
    autoCheckInterval: autoCheckInterval * 1000,
    // 这个参数其实是有问题的，并没有实际生效
    autoCheckLiveStatusAndRecord: autoCheckLiveStatusAndRecord,
    savePathRule: savePathRule,
    biliBatchQuery: config?.recorder?.bilibili.useBatchQuery ?? false,
  });

  manager.on("RecorderDebugLog", ({ recorder, ...log }) => {
    const debugMode = config.recorder.debugMode;
    if (!debugMode) return;

    if (recorder.recordHandle) {
      const logFilePath = utils.replaceExtName(
        `${recorder.recordHandle.savePath}_${recorder.id}`,
        ".ffmpeg.log",
      );
      fs.appendFileSync(logFilePath, log.text + "\n");
      return;
    }
  });
  manager.on("RecordStart", (debug) => {
    logger.info("Manager start", debug);
  });
  manager.on("RecordStop", (debug) => {
    logger.info("Manager stop", debug);
  });
  manager.on("error", (error) => {
    logger.error("Manager error", error);
  });
  // manager.on("RecordSegment", (debug) => {
  //   console.error("Manager segment", debug);
  // });
  manager.on("videoFileCreated", async ({ recorder, filename }) => {
    logger.info("Manager videoFileCreated", { recorder, filename });
    const startTime = new Date();

    await sleep(4000);
    if (!recorder.liveInfo) {
      logger.error("Manager videoFileCreated Error", { recorder, filename });
      return;
    }
    const data = recorderConfig.get(recorder.id);

    data?.sendToWebhook &&
      axios.post(`http://127.0.0.1:${config.port}/webhook/custom`, {
        event: "FileOpening",
        filePath: filename,
        roomId: recorder.channelId,
        time: startTime.toISOString(),
        title: recorder.liveInfo.title,
        username: recorder.liveInfo.owner,
      });

    // LiveService.addWithStreamer({
    //   start_time: startTime.getTime(),
    //   room_id: recorder.channelId,
    //   title: recorder.liveInfo.title,
    //   video_file: filename,
    //   name: recorder.liveInfo.owner,
    //   platform: recorder.providerId,
    // });
  });
  manager.on("videoFileCompleted", async ({ recorder, filename }) => {
    logger.info("Manager videoFileCompleted", { recorder, filename });

    const endTime = new Date();
    const data = recorderConfig.get(recorder.id);
    const title = recorder.liveInfo?.title;
    const username = recorder.liveInfo?.owner;
    const channelId = recorder.channelId;
    const config = appConfig.getAll();

    if (config?.recorder?.convert2Mp4) {
      try {
        await convert2Mp4(filename);
        await fs.unlink(filename);
      } catch (error) {
        logger.error("convert2Mp4 error", error);
      }
    }

    data?.sendToWebhook &&
      axios.post(`http://127.0.0.1:${config.port}/webhook/custom`, {
        event: "FileClosed",
        filePath: filename,
        roomId: channelId,
        time: endTime.toISOString(),
        title: title,
        username: username,
      });

    // const live = LiveService.upadteEndTime(filename, endTime.getTime());
    // if (!live) {
    //   logger.error("Manager videoFileCompleted live error", { recorder, filename });
    //   return;
    // }

    // const { danmu, sc, gift, guard } = await parseDanmu(replaceExtName(filename, ".xml"));

    // DanmuService.addMany(danmu.map((item) => ({ ...item, live_id: live.id })));
    // DanmuService.addMany(sc.map((item) => ({ ...item, live_id: live.id })));
    // DanmuService.addMany(gift.map((item) => ({ ...item, live_id: live.id })));
    // DanmuService.addMany(guard.map((item) => ({ ...item, live_id: live.id })));
  });

  appConfig.on("update", () => {
    const { ffmpegPath } = getFfmpegPath();
    setFFMPEGPath(ffmpegPath);
    updateRecorderManager(manager, appConfig);
  });

  // TODO: 增加更新监听，处理配置更新
  const recorderConfig = new RecorderConfig(appConfig);
  for (const recorder of recorderConfig.list()) {
    // console.log("addRecorder", recorder);
    manager.addRecorder({
      ...recorder,
      m3u8ProxyUrl: `http://127.0.0.1:${config.port}/bili/stream`,
    });
  }

  if (autoCheckLiveStatusAndRecord) manager.startCheckLoop();

  return {
    manager,
    config: recorderConfig,
    addRecorder: async (recorder: RecorderConfigType) => {
      const recorders = recorderConfig.list();
      if (
        recorders.findIndex(
          (item) =>
            item.channelId === recorder.channelId && item.providerId === recorder.providerId,
        ) !== -1
      ) {
        return null;
      }
      recorderConfig.add(recorder);
      const data = recorderConfig.get(recorder.id);
      if (!data) return null;

      // TODO: 配置可视化
      const recoder = manager.addRecorder({
        ...data,
        m3u8ProxyUrl: `http://127.0.0.1:${config.port}/bili/stream`,
      });

      if (!data.disableAutoCheck) {
        manager.startRecord(recoder.id);
      }
      return recoder;
    },
    updateRecorder: async (args: Omit<RecorderConfigType, "channelId" | "providerId">) => {
      const { id } = args;
      const recorder = manager.recorders.find((item) => item.id === id);
      if (recorder == null) return null;
      recorderConfig.update(args);
      console.log("addRecorder", args);

      return updateRecorder(recorder, args);
    },
    resolveChannel: async (url: string) => {
      for (const provider of manager.providers) {
        const info = await provider.resolveChannelInfoFromURL(url);
        if (!info) continue;

        return {
          providerId: provider.id,
          channelId: info.id,
          owner: info.owner,
          uid: info.uid,
        };
      }
      return null;
    },
  };
}
