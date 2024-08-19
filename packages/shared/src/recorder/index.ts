import path from "node:path";

import { createRecorderManager, setFFMPEGPath } from "@autorecord/manager";
import { provider as providerForDouYu } from "@autorecord/douyu-recorder";
import { getFfmpegPath } from "../task/video.js";

import type { AppConfig } from "../config.js";

export function createRecoderManager(appConfig: AppConfig) {
  const config = appConfig.getAll();
  const { ffmpegPath } = getFfmpegPath();
  setFFMPEGPath(ffmpegPath);

  const savePathRule = path.join(config?.recorder?.savePath, config?.recorder?.nameRule);
  const autoCheckInterval = config?.recorder?.checkInterval ?? 60;
  const autoCheckLiveStatusAndRecord = config?.recorder?.autoRecord ?? false;

  const manager = createRecorderManager({
    providers: [providerForDouYu],
    autoRemoveSystemReservedChars: true,
    autoCheckInterval: autoCheckInterval,
    autoCheckLiveStatusAndRecord: autoCheckLiveStatusAndRecord,
    savePathRule: savePathRule,
  });
  manager.addRecorder({
    providerId: providerForDouYu.id,
    channelId: "48699",
    quality: "highest",
    streamPriorities: [],
    sourcePriorities: [],
  });
  manager.on("RecorderDebugLog", (debug) => {
    console.error("Manager deug", debug);
  });
  manager.on("RecordStart", (debug) => {
    console.error("Manager start", debug);
  });
  manager.on("error", (error) => {
    console.error("Manager error", error);
  });

  appConfig.on("update", () => {
    // console.log("setting update", appConfig.getAll());
    updateRecorderManager(manager, appConfig);
  });
  console.log("Manager started", providerForDouYu.id);
}

export function updateRecorderManager(
  manager: ReturnType<typeof createRecorderManager>,
  appConfig: AppConfig,
) {
  const config = appConfig.getAll();
  const savePathRule = path.join(config?.recorder?.savePath, config?.recorder?.nameRule);
  const autoCheckInterval = config?.recorder?.checkInterval ?? 60;
  const autoCheckLiveStatusAndRecord = config?.recorder?.autoRecord ?? false;

  manager.autoCheckInterval = autoCheckInterval;
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
