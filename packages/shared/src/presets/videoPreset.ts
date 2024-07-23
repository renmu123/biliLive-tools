import CommonPreset from "./preset.js";

import type { BiliupConfig, BiliupPreset } from "@biliLive-tools/types";

export const DEFAULT_BILIUP_CONFIG: BiliupConfig = {
  title: "",
  desc: "",
  dolby: 0,
  hires: 0,
  copyright: 1,
  tag: ["biliLive-tools"], // tag应该为""以,分割的字符串
  tid: 138,
  source: "",
  dynamic: "",
  cover: "",
  noReprint: 0,
  openElec: 0,
  closeDanmu: 0,
  closeReply: 0,
  selectiionReply: 0,
  recreate: -1,
  no_disturbance: 0,
  autoComment: false,
  commentTop: false,
  comment: "",
  topic_name: null,
};

class VideoPreset extends CommonPreset<BiliupConfig> {
  constructor(filePath: string, defaultConfig: BiliupConfig) {
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
  async save(presets: BiliupPreset) {
    return super.save(presets);
  }
  async delete(id: string) {
    return super.delete(id);
  }
}

export const videoPreset = new VideoPreset("", DEFAULT_BILIUP_CONFIG);
