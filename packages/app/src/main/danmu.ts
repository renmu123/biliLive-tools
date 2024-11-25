import fs from "fs-extra";
import { invokeWrap } from "./utils/index";

import { convertXml2Ass, genHotProgress, isEmptyDanmu } from "@biliLive-tools/shared/task/danmu.js";
import { parseDanmu } from "@biliLive-tools/shared/danmu/index.js";
import { report, generateDanmakuData } from "@biliLive-tools/shared/danmu/hotProgress.js";
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
  "danmu:saveReport": async (
    _event: IpcMainInvokeEvent,
    options: {
      input: string;
      output: string;
    },
  ) => {
    const data = await report(options.input);
    await fs.writeFile(options.output, data);
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
  "danmu:generateDanmakuData": invokeWrap(generateDanmakuData),
  "danmu:parseDanmu": invokeWrap(parseDanmu),
};
