// execute in shell `ts-node src/test.ts` to run test
// TODO: add to scripts
import { createRecorderManager } from "@bililive-tools/manager";
import { provider } from "./index.js";

const manager = createRecorderManager({ providers: [provider] });
manager.addRecorder({
  providerId: provider.id,
  channelId: "317590520822",
  quality: "medium",
  streamPriorities: [],
  sourcePriorities: [],
});
manager.startCheckLoop();
