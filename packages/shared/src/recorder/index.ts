import { createRecorderManager, setFFMPEGPath } from "@autorecord/manager";
import { provider as providerForDouYu } from "@autorecord/douyu-recorder";

export function createManager(ffmpegPath: string) {
  setFFMPEGPath(ffmpegPath);
  const manager = createRecorderManager({
    providers: [providerForDouYu],
    autoCheckInterval: 1000 * 10,

    // ... other options ...
  });
  manager.addRecorder({
    providerId: providerForDouYu.id,
    channelId: "9401",
    quality: "highest",
    streamPriorities: [],
    sourcePriorities: [],
    // ... other options ...
  });
  manager.startCheckLoop();
  manager.on("RecorderDebugLog", (debug) => {
    console.error("Manager deug", debug);
  });
  manager.on("RecordStart", (debug) => {
    console.error("Manager start", debug);
  });
  manager.on("error", (error) => {
    console.error("Manager error", error);
  });
  console.log("Manager started", providerForDouYu.id);
}
