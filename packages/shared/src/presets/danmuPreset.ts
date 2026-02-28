import os from "node:os";

import CommonPreset from "./preset.js";
import { danmuPresetSchema } from "@biliLive-tools/types";

import type {
  DanmuConfig,
  DanmuPreset as DanmuPresetType,
  GlobalConfig,
} from "@biliLive-tools/types";

let fontname = "SimHei";
if (os.platform() === "win32") {
  fontname = "Microsoft YaHei";
} else if (os.platform() === "darwin") {
  fontname = "PingFang SC";
} else if (os.platform() === "linux") {
  fontname = "Noto Sans SC";
}

export const DANMU_DEAFULT_CONFIG: DanmuConfig = {
  resolution: [1920, 1080],
  scrolltime: 12.0,
  fixtime: 5.0,
  density: 0,
  customDensity: 50,
  fontname: fontname,
  fontsize: 40,
  opacity100: 100,
  outline: 1.0,
  "outline-blur": 0,
  "outline-opacity-percentage": 100,
  shadow: 0.0,
  displayarea: 1.0,
  scrollarea: 0.7,
  bold: false,
  showusernames: false,
  saveblocked: true,
  showmsgbox: false,
  msgboxsize: [500, 1080],
  msgboxpos: [20, 0],
  msgboxfontsize: 38,
  msgboxduration: 10.0,
  giftminprice: 10.0,
  blockmode: [],
  statmode: [],
  resolutionResponsive: false,
  blacklist: "",
  filterFunction: "",
  "blacklist-regex": false,
  "line-spacing": 0,
  "top-margin": 0,
  "bottom-margin": 0,
  timeshift: 0,
  fontSizeResponsiveParams: [
    [1080, 40],
    [1620, 56],
  ],
  fontSizeResponsive: false,
};

// export function validateAndFilter<T>(options: T, requiredKeys: Array<keyof T>): T {
//   const filteredOptions: Partial<T> = {};
//   for (const key in options) {
//     if (requiredKeys.includes(key as keyof T)) {
//       filteredOptions[key as keyof T] = options[key];
//     }
//   }

//   for (const key of requiredKeys) {
//     if (!(key in filteredOptions)) {
//       throw new Error(`Missing required field: ${String(key)}`);
//     }
//   }

//   danmuConfig.assert(options);
//   return filteredOptions as T;
// }

export class DanmuPreset extends CommonPreset<DanmuConfig> {
  constructor({ globalConfig }: { globalConfig: Pick<GlobalConfig, "danmuPresetPath"> }) {
    super(globalConfig.danmuPresetPath, DANMU_DEAFULT_CONFIG);
  }
  init(filePath: string) {
    super.init(filePath);
  }
  async get(id: string) {
    return super.get(id);
  }
  async list() {
    return super.list();
  }
  async save(preset: DanmuPresetType) {
    danmuPresetSchema.assert(preset);

    return super.save(preset);
  }
  async delete(id: string) {
    return super.delete(id);
  }
}
