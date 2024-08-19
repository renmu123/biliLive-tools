import { createRecorderManager, setFFMPEGPath } from "@autorecord/manager";
// import { provider as providerForDouYu } from "@autorecord/douyu-recorder";

export function createManager(ffmpegPath: string) {
  // setFFMPEGPath(ffmpegPath);
  const manager = createRecorderManager({
    providers: [],
    // ... other options ...
  });
  // manager.addRecorder({
  //   providerId: providerForDouYu.id,
  //   channelId: "74751",
  //   quality: "highest",
  //   streamPriorities: [],
  //   sourcePriorities: [],
  //   // ... other options ...
  // });
  // manager.startCheckLoop();
}
