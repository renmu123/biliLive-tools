import fs from "node:fs";
import path from "node:path";
import axios from "axios";
import { omit } from "lodash-es";

import { provider as providerForDouYu } from "@autorecord/douyu-recorder";
import { provider as providerForHuYa } from "@autorecord/huya-recorder";
import { provider as providerForBiliBili } from "@autorecord/bilibili-recorder";
import {
  createRecorderManager as createManager,
  setFFMPEGPath,
  utils,
  genSavePathFromRule,
} from "@autorecord/manager";

import LiveService from "../db/service/liveService.js";
import DanmuService from "../db/service/danmuService.js";
import { getFfmpegPath } from "../task/video.js";
import logger from "../utils/log.js";
import RecorderConfig from "./config.js";
import { sleep, replaceExtName } from "../utils/index.js";
import { readUser } from "../task/bili.js";
import { parseDanmu } from "../danmu/index.js";

import type { AppConfig } from "../config.js";
import type { LocalRecordr } from "@biliLive-tools/types";
import type { Recorder } from "@autorecord/manager";

export { RecorderConfig };

async function getCookies(uid: number) {
  const user = await readUser(uid);
  if (user) {
    return Object.entries(user.cookie)
      .map((item: [string, string]) => `${item[0]}=${item[1]}`)
      .join("; ");
  }
  return "";
}

export async function createRecorderManager(appConfig: AppConfig) {
  /**
   * 开始录制
   * @param id - recorder id
   */
  async function startRecord(id: string) {
    const recorder = manager.recorders.find((item) => item.id === id);
    if (recorder == null) return null;

    if (recorder.recordHandle == null) {
      await recorder.checkLiveStatusAndRecord({
        getSavePath(data) {
          return genSavePathFromRule(manager, recorder, data);
        },
      });
    }

    return recorder;
  }

  /**
   * 更新录制器
   * @param args - 更新参数
   * @returns 更新后的录制器
   */
  async function updateRecorder(
    recorder: Recorder,
    args: Omit<LocalRecordr, "channelId" | "providerId">,
  ) {
    const uid = recorder.uid;
    let auth: string | undefined = undefined;
    if (uid) {
      auth = await getCookies(Number(uid));
    }

    Object.assign(recorder, { ...omit(args, ["id"]), auth });
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
  });

  manager.on("RecorderDebugLog", ({ recorder, ...log }) => {
    // console.error("Manager debug", log);

    const debugMode = config.recorder.debugMode;
    if (!debugMode) return;

    if (log.type === "ffmpeg" && recorder.recordHandle) {
      const logFilePath = utils.replaceExtName(
        `${recorder.recordHandle.savePath}_${recorder.id}`,
        ".ffmpeg.log",
      );
      // console.log("logFilePath", logFilePath);
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
      logger.error("Manager videoFileCreated", { recorder, filename });
      return;
    }
    const data = recorderConfig.get(recorder.id);

    data?.sendToWebhook &&
      axios.post("http://localhost:18010/webhook/custom", {
        event: "FileOpening",
        filePath: filename,
        roomId: recorder.channelId,
        time: startTime.toISOString(),
        title: recorder.liveInfo.title,
        username: recorder.liveInfo.owner,
      });

    LiveService.addWithStreamer({
      start_time: startTime.getTime(),
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

    data?.sendToWebhook &&
      axios.post("http://localhost:18010/webhook/custom", {
        event: "FileClosed",
        filePath: filename,
        roomId: recorder.channelId,
        time: endTime.toISOString(),
        title: recorder?.liveInfo?.title,
        username: recorder?.liveInfo?.owner,
      });

    const live = LiveService.upadteEndTime(filename, endTime.getTime());
    if (!live) {
      logger.error("Manager videoFileCompleted live error", { recorder, filename });
      return;
    }

    const { danmu, sc, gift, guard } = await parseDanmu(replaceExtName(filename, ".xml"), {
      parseHotProgress: false,
    });
    console.log("danmu", danmu, sc, gift, guard, live);

    DanmuService.addMany(danmu.map((item) => ({ ...item, live_id: live.id })));
    DanmuService.addMany(sc.map((item) => ({ ...item, live_id: live.id })));
    DanmuService.addMany(gift.map((item) => ({ ...item, live_id: live.id })));
    DanmuService.addMany(guard.map((item) => ({ ...item, live_id: live.id })));
  });

  appConfig.on("update", () => {
    updateRecorderManager(manager, appConfig);
  });

  // TODO: 增加更新监听，处理配置更新
  const recorderConfig = new RecorderConfig(appConfig);
  for (const recorder of recorderConfig.list()) {
    const uid = recorder.uid;
    let auth: string | undefined = undefined;
    if (uid) {
      auth = await getCookies(Number(uid));
    }
    manager.addRecorder({ ...recorder, auth: auth });
  }

  if (autoCheckLiveStatusAndRecord) manager.startCheckLoop();

  return {
    manager,
    config: recorderConfig,
    addRecorder: async (recorder: LocalRecordr) => {
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

      // TODO: 需要写成函数方便复用
      const uid = recorder.uid;
      let auth: string | undefined = undefined;
      if (uid) {
        auth = await getCookies(Number(uid));
      }
      const recoder = manager.addRecorder({
        ...data,
        auth: auth,
      });

      if (!data.disableAutoCheck) {
        startRecord(recoder.id);
      }
      return recoder;
    },
    updateRecorder: async (args: Omit<LocalRecordr, "channelId" | "providerId">) => {
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
        };
      }
      return null;
    },
    startRecord: async (id: string) => {
      return startRecord(id);
    },
  };
}
