import path from "node:path";
import { v4 as uuid } from "uuid";

import { createRecorderManager, setFFMPEGPath } from "@autorecord/manager";
import { provider as providerForDouYu } from "@autorecord/douyu-recorder";
import { getFfmpegPath } from "../task/video.js";
import logger from "../utils/log.js";

import type { AppConfig } from "../config.js";

export function createRecoderManager(appConfig: AppConfig) {
  const config = appConfig.getAll();
  const { ffmpegPath } = getFfmpegPath();
  setFFMPEGPath(ffmpegPath);

  const savePathRule = path.join(config?.recorder?.savePath, config?.recorder?.nameRule);
  const autoCheckInterval = config?.recorder?.checkInterval ?? 60;
  const autoCheckLiveStatusAndRecord = config?.recorder?.autoRecord ?? false;
  const saveSCDanma = config?.recorder?.saveSCDanma ?? true;
  const saveGiftDanma = config?.recorder?.saveGiftDanma ?? false;
  const segment = config?.recorder?.segment ?? 60;
  const quality = config?.recorder?.quality ?? "highest";

  console.log("autoCheckLiveStatusAndRecord", autoCheckLiveStatusAndRecord);
  const manager = createRecorderManager({
    providers: [providerForDouYu],
    autoRemoveSystemReservedChars: true,
    autoCheckInterval: autoCheckInterval * 1000,
    // 这个参数其实是有问题的，并没有实际生效
    autoCheckLiveStatusAndRecord: autoCheckLiveStatusAndRecord,
    savePathRule: savePathRule,
  });
  manager.addRecorder({
    id: uuid(),
    providerId: providerForDouYu.id,
    channelId: "2140934",
    quality: quality,
    streamPriorities: [],
    sourcePriorities: ["tct-h5"],
    segment: segment * 60,
    disableProvideCommentsWhenRecording: false,
    saveSCDanma,
    saveGiftDanma,
  });
  if (autoCheckLiveStatusAndRecord) manager.startCheckLoop();

  manager.on("RecorderDebugLog", (debug) => {
    console.error("Manager deug", debug.text);
  });
  manager.on("RecordStart", (debug) => {
    // console.error("Manager start", debug);
  });
  manager.on("error", (error) => {
    logger.error("Manager error", error);
  });
  manager.on("RecordSegment", (debug) => {
    // console.error("Manager segment", debug);
  });

  appConfig.on("update", () => {
    console.log("setting update");
    updateRecorderManager(manager, appConfig);
  });
  console.log("Manager started", providerForDouYu.id);
  return manager;
}

export function updateRecorderManager(
  manager: ReturnType<typeof createRecorderManager>,
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
}
