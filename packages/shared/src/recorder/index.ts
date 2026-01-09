import fs from "fs-extra";
import path from "node:path";
import axios from "axios";
import { cloneDeep, omit } from "lodash-es";

import { provider as providerForDouYu } from "@bililive-tools/douyu-recorder";
import { provider as providerForHuYa } from "@bililive-tools/huya-recorder";
import { provider as providerForBiliBili } from "@bililive-tools/bilibili-recorder";
import { provider as providerForDouYin } from "@bililive-tools/douyin-recorder";

import {
  createRecorderManager as createManager,
  setFFMPEGPath,
  setMesioPath,
  setBililivePath,
  utils,
} from "@bililive-tools/manager";

import recordHistory from "./recordHistory.js";
import { danmuService } from "../db/index.js";
// import DanmuService from "../db/service/danmuService.js";
import { getBinPath, readVideoMeta } from "../task/video.js";
import logger from "../utils/log.js";
import { replaceExtName } from "../utils/index.js";
import RecorderConfig from "./config.js";
import { sendBySystem, send } from "../notify.js";
import { danmaReport, parseDanmu } from "../danmu/index.js";

import type { AppConfig } from "../config.js";
import type { Recorder as RecorderConfigType } from "@biliLive-tools/types";
import type { Recorder } from "@bililive-tools/manager";

export { RecorderConfig };

async function sendStartLiveNotification(
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

async function sendEndLiveNotification(
  appConfig: AppConfig,
  recorder: Recorder,
  config: RecorderConfigType,
) {
  const name = recorder?.liveInfo?.owner ? recorder.liveInfo.owner : config.remarks;
  const title = `${name}(${config.channelId}) 录制已停止`;

  const globalConfig = appConfig.getAll();
  let notifyType = globalConfig?.notification?.setting?.type;
  if (globalConfig?.notification?.taskNotificationType["liveStart"]) {
    notifyType = globalConfig?.notification?.taskNotificationType["liveStart"];
  }

  if (notifyType === "system") {
    sendBySystem(title, "");
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
    const cloneArgs = cloneDeep(args);
    // 不更新extra字段，可能包含运行时数据
    // @ts-ignore
    delete cloneArgs.extra;
    Object.assign(recorder, { ...omit(cloneArgs, ["id"]) });
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
    const maxThreadCount = config?.recorder?.maxThreadCount ?? 3;
    const waitTime = config?.recorder?.waitTime ?? 0;
    const autoCheckLiveStatusAndRecord = config?.recorder?.autoRecord ?? false;

    manager.autoCheckInterval = autoCheckInterval * 1000;
    manager.maxThreadCount = maxThreadCount;
    manager.waitTime = waitTime;
    manager.savePathRule = savePathRule;
    manager.biliBatchQuery = config?.recorder?.bilibili.useBatchQuery ?? false;
    manager.recordRetryImmediately = config?.recorder?.recordRetryImmediately ?? false;

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
  const { ffmpegPath, mesioPath, bililiveRecorderPath } = getBinPath();
  setFFMPEGPath(ffmpegPath);
  setMesioPath(mesioPath);
  setBililivePath(bililiveRecorderPath);

  const savePathRule = path.join(config?.recorder?.savePath, config?.recorder?.nameRule);
  const autoCheckInterval = config?.recorder?.checkInterval ?? 60;
  const maxThreadCount = config?.recorder?.maxThreadCount ?? 3;
  const waitTime = config?.recorder?.waitTime ?? 0;
  const autoCheckLiveStatusAndRecord = config?.recorder?.autoRecord ?? false;

  const manager = createManager({
    providers: [providerForDouYu, providerForHuYa, providerForBiliBili, providerForDouYin],
    autoRemoveSystemReservedChars: true,
    autoCheckInterval: autoCheckInterval * 1000,
    savePathRule: savePathRule,
    biliBatchQuery: config?.recorder?.bilibili.useBatchQuery ?? false,
    recordRetryImmediately: config?.recorder?.recordRetryImmediately ?? false,
    maxThreadCount: maxThreadCount,
    waitTime: waitTime,
  });

  manager.on("RecorderDebugLog", ({ recorder, ...log }) => {
    if (log.type !== "ffmpeg") {
      logger.info(`recorder: ${log.text}`);
    }
    const debugMode = recorder.debugLevel !== "none";
    if (!debugMode) return;

    if (recorder.recordHandle) {
      const logFilePath = utils.replaceExtName(
        `${recorder.recordHandle.savePath}_${recorder.id}`,
        ".recorder.log",
      );
      fs.appendFileSync(logFilePath, log.text + "\n");
      return;
    } else {
      logger.info(`recorder: ${log.text}`);
    }
  });
  manager.on("RecordStart", ({ recorder }) => {
    logger.info("Manager start", recorder);
    if (!recorder.extra) recorder.extra = {};
    const timestamp = Date.now();
    recorder.extra.lastRecordTime = timestamp;
  });
  manager.on("RecordStop", ({ recorder }) => {
    logger.info("Manager stop", recorder);
    // 录制结束通知，自动监听&开启推送时才会发送
    const config = recorderConfig.get(recorder.id);
    if (!config) return;
    if (config?.liveEndNotification && !config?.disableAutoCheck) {
      setTimeout(
        () => {
          const trueRecorder = manager.getRecorder(recorder.id);
          if (!trueRecorder) return;
          if (trueRecorder?.recordHandle) return;
          sendEndLiveNotification(appConfig, trueRecorder, config);
        },
        1000 * 60 * 3,
      );
    }
  });
  manager.on("error", (error) => {
    logger.error("Manager error", error);
  });
  manager.on("RecoderLiveStart", async ({ recorder }) => {
    // 录制开始通知，自动监听&开启推送时才会发送
    const config = recorderConfig.get(recorder.id);
    if (!config) return;
    if (config?.liveStartNotification && !config?.disableAutoCheck) {
      sendStartLiveNotification(appConfig, recorder, config);
    }
  });
  // manager.on("RecordSegment", (debug) => {
  //   console.error("Manager segment", debug);
  // });
  manager.on("videoFileCreated", async ({ recorder, filename, rawFilename }) => {
    logger.info("Manager videoFileCreated", { recorder, filename, rawFilename });
    const videoStartTime = new Date();
    const liveStartTime = recorder.liveInfo?.liveStartTime;

    if (!recorder.liveInfo) {
      logger.error("Manager videoFileCreated Error", { recorder, filename, rawFilename });
      return;
    }
    const data = recorderConfig.get(recorder.id);

    data?.sendToWebhook &&
      axios.post(
        `http://127.0.0.1:${config.port}/webhook/custom`,
        {
          event: "FileOpening",
          filePath: filename,
          roomId: recorder.channelId,
          time: videoStartTime.toISOString(),
          title: recorder.liveInfo.title,
          username: recorder.liveInfo.owner,
          platform: recorder.providerId,
          software: "biliLive-tools",
        },
        {
          proxy: false,
        },
      );

    recordHistory.addWithStreamer({
      live_start_time: liveStartTime?.getTime(),
      live_id: recorder?.liveInfo?.liveId,
      record_start_time: videoStartTime.getTime(),
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
    const title = recorder?.liveInfo?.title;
    const username = recorder?.liveInfo?.owner;
    const channelId = recorder?.channelId;
    const liveId = recorder?.liveInfo?.liveId;
    const config = appConfig.getAll();

    data?.sendToWebhook &&
      axios.post(
        `http://127.0.0.1:${config.port}/webhook/custom`,
        {
          event: "FileClosed",
          filePath: filename,
          roomId: channelId,
          time: endTime.toISOString(),
          title: title,
          username: username,
          platform: recorder.providerId,
          software: "biliLive-tools",
        },
        {
          proxy: false,
        },
      );

    const xmlFile = replaceExtName(filename, ".xml");
    try {
      const videoMeta = await readVideoMeta(filename);
      const duration = videoMeta?.format?.duration ?? 0;
      recordHistory.upadteLive(
        {
          video_file: filename,
          live_id: liveId,
        },
        {
          record_end_time: endTime.getTime(),
          video_duration: isNaN(Number(duration)) ? 0 : duration,
        },
      );

      if (xmlFile && (await fs.pathExists(xmlFile))) {
        const { uniqMember, danmaNum } = await danmaReport(xmlFile);
        recordHistory.upadteLive(
          {
            video_file: filename,
            live_id: liveId,
          },
          {
            danma_num: danmaNum,
            interact_num: uniqMember,
          },
        );
      }
    } catch (error) {
      logger.error("Update live error", { recorder, filename, error });
    }

    if (config.recorder.saveDanma2DB && xmlFile && (await fs.pathExists(xmlFile))) {
      const history = recordHistory.getRecord({
        file: filename,
        live_id: liveId,
      });
      if (!history) return;
      logger.info("写入弹幕文件：", xmlFile);
      const { danmu, sc, gift, guard } = await parseDanmu(replaceExtName(filename, ".xml"));
      const result: {
        record_id: number;
        ts: number;
        type: "text" | "gift";
        user?: string;
        gift_price?: number;
        gift_name?: string;
        text: string;
      }[] = [];

      for (const item of danmu) {
        result.push({
          record_id: history.id,
          ts: item.timestamp!,
          type: item.type,
          user: item.user,
          gift_price: undefined,
          text: item.text ?? "",
          gift_name: "",
        });
      }
      for (const item of sc) {
        result.push({
          record_id: history.id,
          ts: item.timestamp!,
          type: "gift",
          user: item.user,
          gift_price: item.gift_price,
          text: item.text ?? "",
          gift_name: "SC",
        });
      }
      for (const item of gift) {
        result.push({
          record_id: history.id,
          ts: item.timestamp!,
          type: item.type,
          user: item.user,
          gift_price: Number(item.gift_price) * Number(item.gift_count),
          text: "",
          gift_name: item.gift_name,
        });
      }
      for (const item of guard) {
        result.push({
          record_id: history.id,
          ts: item.timestamp!,
          type: "gift",
          user: item.user,
          gift_price: Number(item.gift_price) * Number(item.gift_count),
          text: "",
          gift_name: item.gift_name,
        });
      }
      danmuService.addMany(result, {
        platform: recorder.providerId,
        roomId: recorder.channelId,
      });
    }
  });

  appConfig.on("update", () => {
    const { ffmpegPath, mesioPath, bililiveRecorderPath } = getBinPath();
    setFFMPEGPath(ffmpegPath);
    setMesioPath(mesioPath);
    setBililivePath(bililiveRecorderPath);
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

  setTimeout(() => {
    // 转异步，避免阻塞
    const data = recordHistory.getLastRecordTimesByChannels(
      manager.recorders.map((r) => ({ channelId: r.channelId, providerId: r.providerId })),
    );
    // console.log("获取上次录制时间完成：", data);
    for (const recorder of manager.recorders) {
      const record = data.find(
        (item) => item.channelId === recorder.channelId && item.providerId === recorder.providerId,
      );
      if (record && record.lastRecordTime) {
        if (!recorder.extra) recorder.extra = {};
        recorder.extra.lastRecordTime = record.lastRecordTime;
      }
    }
  }, 0);

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
          avatar: info.avatar,
        };
      }
      return null;
    },
  };
}
