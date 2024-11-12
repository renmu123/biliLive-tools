// execute in shell `ts-node src/test.ts` to run test
// TODO: add to scripts
import { createRecorderManager } from "@autorecord/manager";
import { provider } from "./index.js";

const manager = createRecorderManager({ providers: [provider] });
manager.addRecorder({
  providerId: provider.id,
  channelId: "74751",
  quality: "highest",
  streamPriorities: [],
  sourcePriorities: [],
});
manager.startCheckLoop();
