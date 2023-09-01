import type { IpcMainInvokeEvent } from "electron";
import type { DanmuConfig } from "../types";

import Config from "./config";

export const DANMU_DEAFULT_CONFIG = {
  resolution: [1920, 1080],
  scrolltime: 12.0,
  fixtime: 5.0,
  density: 0,
  fontname: "Microsoft YaHei",
  fontsize: 38,
  opacity: 180,
  outline: 0.0,
  shadow: 1.0,
  displayArea: 1.0,
  scrollArea: 1.0,
  bold: false,
  showUsernames: false,
  showMsgbox: false,
  msgboxSize: [500, 1080],
  msgboxPos: [20, 0],
  msgboxFontsize: 38,
  msgboxDuration: 0.0,
  giftMinPrice: 0.0,
  giftMergeTolerance: 0.0,
  blockmode: [],
  statmode: [],
};

const getConfig = () => {
  const config = new Config("DanmakuFactoryConfig.json", false);
  config.init(DANMU_DEAFULT_CONFIG);
  return config;
};

export const saveDanmuConfig = (_event: IpcMainInvokeEvent, newConfig: DanmuConfig) => {
  const config = getConfig();
  config.setAll(newConfig);
};
export const getDanmuConfig = () => {
  const config = getConfig();
  return config.data;
};
