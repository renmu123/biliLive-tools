import path from "node:path";

import { createRecorderManager as createManager, setFFMPEGPath } from "@autorecord/manager";
import { provider as providerForDouYu } from "@autorecord/douyu-recorder";
import { getFfmpegPath } from "../task/video.js";
// import logger from "../utils/log.js";
import RecorderConfig from "./config.js";

import type { AppConfig } from "../config.js";
import type { LocalRecordr } from "@biliLive-tools/types";

export { RecorderConfig };

export function createRecorderManager(appConfig: AppConfig) {
  const config = appConfig.getAll();
  const { ffmpegPath } = getFfmpegPath();
  setFFMPEGPath(ffmpegPath);

  const savePathRule = path.join(config?.recorder?.savePath, config?.recorder?.nameRule);
  const autoCheckInterval = config?.recorder?.checkInterval ?? 60;
  const autoCheckLiveStatusAndRecord = config?.recorder?.autoRecord ?? false;

  console.log("autoCheckLiveStatusAndRecord", autoCheckLiveStatusAndRecord);
  const manager = createManager({
    providers: [providerForDouYu],
    autoRemoveSystemReservedChars: true,
    autoCheckInterval: autoCheckInterval * 1000,
    // 这个参数其实是有问题的，并没有实际生效
    autoCheckLiveStatusAndRecord: autoCheckLiveStatusAndRecord,
    savePathRule: savePathRule,
  });

  manager.on("RecorderDebugLog", (debug) => {
    console.error("Manager deug", debug.text);
  });
  manager.on("RecordStart", (debug) => {
    console.error("Manager start", debug);
  });
  // manager.on("error", (error) => {
  //   logger.error("Manager error", error);
  // });
  // manager.on("RecordSegment", (debug) => {
  //   console.error("Manager segment", debug);
  // });
  manager.on("videoFileCreated", (debug) => {
    console.error("Manager videoFileCreated", debug);
  });
  manager.on("videoFileCompleted", (debug) => {
    console.error("Manager videoFileCompleted", debug);
  });

  appConfig.on("update", () => {
    updateRecorderManager(manager, appConfig);
  });

  const recorderConfig = new RecorderConfig(appConfig);
  recorderConfig.list().forEach((recorder) => {
    console.log("addRecorder", recorder);
    manager.addRecorder(recorder);
  });
  if (autoCheckLiveStatusAndRecord) manager.startCheckLoop();

  return {
    manager,
    config: recorderConfig,
    addRecorder: (recorder: LocalRecordr) => {
      const recorders = recorderConfig.list();
      if (
        recorders.find(
          (item) =>
            item.channelId === recorder.channelId && item.providerId === recorder.providerId,
        )
      ) {
        throw new Error("不可重复添加");
      }
      recorderConfig.add(recorder);
      const data = recorderConfig.get(recorder.id);
      console.log("addRecorder", data);

      return manager.addRecorder(data!);
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
    console.log("startCheckLoop", autoCheckLiveStatusAndRecord, !manager.isCheckLoopRunning);
    if (autoCheckLiveStatusAndRecord && !manager.isCheckLoopRunning) {
      manager.startCheckLoop();
    }

    if (!autoCheckLiveStatusAndRecord && manager.isCheckLoopRunning) {
      manager.stopCheckLoop();
    }
  }
}
