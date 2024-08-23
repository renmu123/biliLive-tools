import CommonPreset from "./preset.js";

import type { DanmuConfig, DanmuPreset as DanmuPresetType } from "@biliLive-tools/types";

export const DANMU_DEAFULT_CONFIG: DanmuConfig = {
  resolution: [1920, 1080],
  scrolltime: 12.0,
  fixtime: 5.0,
  density: 0,
  customDensity: 50,
  fontname: "Microsoft YaHei",
  fontsize: 38,
  opacity100: 100,
  outline: 0.0,
  shadow: 1.0,
  displayarea: 1.0,
  scrollarea: 1.0,
  bold: false,
  showusernames: false,
  showmsgbox: true,
  msgboxsize: [500, 1080],
  msgboxpos: [20, 0],
  msgboxfontsize: 38,
  msgboxduration: 10.0,
  giftminprice: 10.0,
  blockmode: [],
  statmode: [],
  resolutionResponsive: false,
  blacklist: "",
};

export function validateAndFilter<T>(options: T, requiredKeys: Array<keyof T>): T {
  const filteredOptions: Partial<T> = {};
  for (const key in options) {
    if (requiredKeys.includes(key as keyof T)) {
      filteredOptions[key as keyof T] = options[key];
    }
  }

  for (const key of requiredKeys) {
    if (!(key in filteredOptions)) {
      throw new Error(`Missing required field: ${String(key)}`);
    }
  }

  return filteredOptions as T;
}

export class DanmuPreset extends CommonPreset<DanmuConfig> {
  constructor({ globalConfig }: { globalConfig: { danmuPresetPath: string } }) {
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
  async save(presets: DanmuPresetType) {
    // const requiredFields = Object.keys(DANMU_DEAFULT_CONFIG);
    return super.save(presets);
  }
  async delete(id: string) {
    return super.delete(id);
  }
}
