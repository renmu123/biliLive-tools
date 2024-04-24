import fs from "fs-extra";
import { danmuPreset } from "@biliLive-tools/shared";
import {
  convertXml2Ass,
  genHotProgress,
  isEmptyDanmu,
} from "@biliLive-tools/shared/lib/task/danmu.js";
import { report } from "@biliLive-tools/shared/lib/danmu/index.js";

import type { DanmuPreset as DanmuPresetType, hotProgressOptions } from "@biliLive-tools/types";
import type { IpcMainInvokeEvent } from "electron";

export const handlers = {
  "danmu:getPreset": (_event: IpcMainInvokeEvent | undefined, id: string) => {
    return danmuPreset.get(id);
  },
  "danmu:savePreset": (_event: IpcMainInvokeEvent | undefined, presets: DanmuPresetType) => {
    return danmuPreset.save(presets);
  },
  "danmu:deletePreset": (_event: IpcMainInvokeEvent | undefined, id: string) => {
    return danmuPreset.delete(id);
  },
  "danmu:getPresets": () => {
    const presets = danmuPreset.list();
    return presets;
  },
  "danmu:convertXml2Ass": convertXml2Ass,
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
  "danmu:genHotProgress": (
    _event: IpcMainInvokeEvent,
    input: string,
    output: string,
    options: hotProgressOptions,
  ) => {
    return genHotProgress(_event.sender, input, output, options);
  },
  "danmu:isEmptyDanmu": (_event: IpcMainInvokeEvent, input: string) => {
    return isEmptyDanmu(input);
  },
};
