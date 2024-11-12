import fs from "node:fs";
import path from "node:path";
import axios from "axios";

import { provider as providerForDouYu } from "@autorecord/douyu-recorder";
import { provider as providerForHuYa } from "@autorecord/huya-recorder";
import { provider as providerForBiliBili } from "@autorecord/bilibili-recorder";
import { createRecorderManager as createManager, setFFMPEGPath, utils } from "@autorecord/manager";
import { getFfmpegPath } from "../task/video.js";
import logger from "../utils/log.js";
import RecorderConfig from "./config.js";
import { sleep } from "../utils/index.js";
import { readUser } from "../task/bili.js";

import type { AppConfig } from "../config.js";
import type { LocalRecordr } from "@biliLive-tools/types";

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
    await sleep(4000);
    const data = recorderConfig.get(recorder.id);

    data?.sendToWebhook &&
      axios.post("http://localhost:18010/webhook/custom", {
        event: "FileOpening",
        filePath: filename,
        roomId: recorder.channelId,
        time: new Date().toISOString(),
        title: recorder?.liveInfo?.title,
        username: recorder?.liveInfo?.owner,
      });
  });
  manager.on("videoFileCompleted", ({ recorder, filename }) => {
    logger.warn("Manager videoFileCompleted", { recorder, filename });

    const data = recorderConfig.get(recorder.id);
    data?.sendToWebhook &&
      axios.post("http://localhost:18010/webhook/custom", {
        event: "FileClosed",
        filePath: filename,
        roomId: recorder.channelId,
        time: new Date().toISOString(),
        title: recorder?.liveInfo?.title,
        username: recorder?.liveInfo?.owner,
      });
  });

  appConfig.on("update", () => {
    updateRecorderManager(manager, appConfig);
  });

  // TODO: 增加更新监听，处理配置更新
  const recorderConfig = new RecorderConfig(appConfig);
  // for (const recorder of recorderConfig.list()) {
  //   const uid = recorder.uid;
  //   let auth: string | undefined = undefined;
  //   if (uid) {
  //     auth = await getCookies(Number(uid));
  //     // console.log("auth", auth);
  //   }
  //   // @ts-ignore
  //   if (!recorder.extra) {
  //     recorder.extra = {};
  //   }
  //   // @ts-ignore
  //   recorder.extra.uid = uid;
  //   manager.addRecorder({ ...recorder, auth: auth });
  // }

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
        throw new Error("不可重复添加");
      }
      recorderConfig.add(recorder);
      const data = recorderConfig.get(recorder.id);
      if (!data) return;
      const uid = recorder.uid;
      let auth: string | undefined = undefined;
      if (uid) {
        auth = await getCookies(Number(uid));
      }
      // @ts-ignore
      if (!data.extra) {
        data.extra = {};
      }
      // @ts-ignore
      data.extra.uid = uid;

      return manager.addRecorder({
        ...data,
        auth: auth,
      });
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
  };
}

function updateRecorderManager(manager: ReturnType<typeof createManager>, appConfig: AppConfig) {
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
}
