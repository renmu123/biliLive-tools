import { invokeWrap } from "./utils/index";

import { convertXml2Ass, genHotProgress, isEmptyDanmu } from "@biliLive-tools/shared/task/danmu.js";
import { parseDanmu } from "@biliLive-tools/shared/danmu/index.js";
import { genTimeData } from "@biliLive-tools/shared/danmu/hotProgress.js";
import type { IpcMainInvokeEvent } from "electron";

export const handlers = {
  "danmu:convertXml2Ass": async (
    _event: IpcMainInvokeEvent,
    ...args: Parameters<typeof convertXml2Ass>
  ) => {
    const task = await convertXml2Ass(...args);
    return {
      taskId: task.taskId,
    };
  },
  "danmu:genHotProgress": async (
    _event: IpcMainInvokeEvent,
    ...args: Parameters<typeof genHotProgress>
  ) => {
    const task = await genHotProgress(...args);
    return {
      taskId: task.taskId,
    };
  },
  "danmu:isEmptyDanmu": invokeWrap(isEmptyDanmu),
  "danmu:genTimeData": invokeWrap(genTimeData),
  "danmu:parseDanmu": invokeWrap(parseDanmu),
};
