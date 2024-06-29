import CommonPreset from "./preset.js";

import type { DanmuConfig, DanmuPreset as DanmuPresetType } from "@biliLive-tools/types";

export const DANMU_DEAFULT_CONFIG: DanmuConfig = {
  resolution: [1920, 1080],
  scrolltime: 12.0,
  fixtime: 5.0,
  density: 0,
  fontname: "Microsoft YaHei",
  fontsize: 38,
  opacity: 255,
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
  giftmergetolerance: 0.0,
  blockmode: [],
  statmode: [],
  resolutionResponsive: false,
  blacklist: "",
};

class DanmuPreset extends CommonPreset<DanmuConfig> {
  constructor(filePath: string, defaultConfig: DanmuConfig) {
    super(filePath, defaultConfig);
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
    return super.save(presets);
  }
  async delete(id: string) {
    return super.delete(id);
  }
}

export const danmuPreset = new DanmuPreset("", DANMU_DEAFULT_CONFIG);
