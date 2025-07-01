import fs from "fs-extra";
import path from "node:path";
import axios from "axios";
import { omit } from "lodash-es";

import { provider as providerForDouYu } from "@bililive-tools/douyu-recorder";
import { provider as providerForHuYa } from "@bililive-tools/huya-recorder";
import { provider as providerForBiliBili } from "@bililive-tools/bilibili-recorder";
import { provider as providerForDouYin } from "@bililive-tools/douyin-recorder";

import {
  createRecorderManager as createManager,
  setFFMPEGPath,
  utils,
} from "@bililive-tools/manager";

import recordHistory from "./recordHistory.js";
// import DanmuService from "../db/service/danmuService.js";
import { getFfmpegPath, readVideoMeta } from "../task/video.js";
import logger from "../utils/log.js";
import { replaceExtName } from "../utils/index.js";
import RecorderConfig from "./config.js";
import { sendBySystem, send } from "../notify.js";
import { danmaReport } from "../danmu/index.js";

import type { AppConfig } from "../config.js";
import type { Recorder as RecorderConfigType } from "@biliLive-tools/types";
import type { Recorder } from "@bililive-tools/manager";

export { RecorderConfig };

async function sendLiveNotification(
  appConfig: AppConfig,
  recorder: Recorder,
  config: RecorderConfigType,
) {
  const name = recorder?.liveInfo?.owner ? recorder.liveInfo.owner : config.remarks;
  const title = `${name}(${config.channelId}) 正在直播`;

  const globalConfig = appConfig.getAll();
  let notifyType = globalConfig?.notification?.setting?.type;
  if (globalConfig?.notification?.taskNotificationType["liveStart"]) {
    notifyType = globalConfig?.notification?.taskNotificationType["liveStart"];
  }

  if (notifyType === "system") {
    const event = await sendBySystem(title, `${recorder?.liveInfo?.title}\n点击打开直播间`);
    const { shell } = await import("electron");
    event?.on("click", () => {
      const url = recorder.getChannelURL();
      shell.openExternal(url);
    });
  } else {
    await send(title, `标题：${recorder?.liveInfo?.title}`, { type: "liveStart" });
  }
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
    providers: [providerForDouYu, providerForHuYa, providerForBiliBili, providerForDouYin],
    autoRemoveSystemReservedChars: true,
    autoCheckInterval: autoCheckInterval * 1000,
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
    } else {
      logger.info(`recorder: ${log.text}`);
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
  manager.on("RecoderLiveStart", async ({ recorder }) => {
    // 只有客户端&自动监听&开始推送时才会发送
    const config = recorderConfig.get(recorder.id);
    if (!config) return;
    if (config?.liveStartNotification && !config?.disableAutoCheck) {
      sendLiveNotification(appConfig, recorder, config);
    }
  });
  // manager.on("RecordSegment", (debug) => {
  //   console.error("Manager segment", debug);
  // });
  manager.on("videoFileCreated", async ({ recorder, filename }) => {
    logger.info("Manager videoFileCreated", { recorder, filename });
    const startTime = new Date();

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

    recordHistory.addWithStreamer({
      live_start_time: recorder.liveInfo.startTime?.getTime(),
      record_start_time: startTime.getTime(),
      room_id: recorder.channelId,
      title: recorder.liveInfo.title,
      video_file: filename,
      name: recorder.liveInfo.owner,
      platform: recorder.providerId,
    });
  });
  manager.on("videoFileCompleted", async ({ recorder, filename }) => {
    logger.info("Manager videoFileCompleted", { recorder, filename });

    const endTime = new Date();
    const data = recorderConfig.get(recorder.id);
    const title = recorder.liveInfo?.title;
    const username = recorder.liveInfo?.owner;
    const channelId = recorder.channelId;
    const config = appConfig.getAll();

    data?.sendToWebhook &&
      axios.post(`http://127.0.0.1:${config.port}/webhook/custom`, {
        event: "FileClosed",
        filePath: filename,
        roomId: channelId,
        time: endTime.toISOString(),
        title: title,
        username: username,
      });

    try {
      const videoMeta = await readVideoMeta(filename);
      const duration = videoMeta?.format?.duration ?? 0;
      recordHistory.upadteLive(filename, {
        record_end_time: endTime.getTime(),
        video_duration: duration,
      });

      const xmlFile = replaceExtName(filename, ".xml");
      if (await fs.pathExists(xmlFile)) {
        const { uniqMember, danmaNum } = await danmaReport(xmlFile);
        recordHistory.upadteLive(filename, {
          danma_num: danmaNum,
          interact_num: uniqMember,
        });
      }
    } catch (error) {
      logger.error("Update live error", { recorder, filename, error });
    }

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

  const recorderConfig = new RecorderConfig(appConfig);
  for (const recorder of recorderConfig.list()) {
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
