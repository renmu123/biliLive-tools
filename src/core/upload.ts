import fs from "fs-extra";

import type { BiliupConfig, BiliupPreset } from "../types/index";

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
};

export class UploadPreset {
  filepath: string;
  constructor(filepath: string) {
    this.filepath = filepath;
  }
  // 保存biliup预设
  saveBiliupPreset = async (presets: BiliupPreset) => {
    const allPresets = await this.readBiliupPresets();
    const presetIndex = allPresets.findIndex((item) => item.id === presets.id);
    const errorMsg = await validateBiliupConfig(presets.config);

    if (errorMsg) {
      throw new Error(errorMsg);
    }

    if (presetIndex === -1) {
      allPresets.push(presets);
    } else {
      allPresets[presetIndex] = presets;
    }
    const presetsPath = this.filepath;
    await fs.writeJSON(presetsPath, allPresets);
    return true;
  };
  // 删除biliup预设
  deleteBiliupPreset = async (id: string) => {
    const allPresets = await this.readBiliupPresets();
    const presetIndex = allPresets.findIndex((item) => item.id === id);
    if (presetIndex === -1) {
      throw new Error("预设不存在");
    }
    allPresets.splice(presetIndex, 1);
    const presetsPath = this.filepath;
    await fs.writeJSON(presetsPath, allPresets);
    return true;
  };

  // 读取biliup预设
  readBiliupPreset = async (id: string) => {
    const allPresets = await this.readBiliupPresets();
    const preset = allPresets.find((item) => item.id === id);
    if (!preset) {
      throw new Error("预设不存在");
    }
    return preset;
  };

  // 读取所有biliup预设
  readBiliupPresets = async (): Promise<BiliupPreset[]> => {
    const presetsPath = this.filepath;
    if (await fs.pathExists(presetsPath)) {
      const presets: BiliupPreset[] = await fs.readJSON(presetsPath);
      presets.map((preset) => {
        preset.config = { ...DEFAULT_BILIUP_CONFIG, ...preset.config };
        return preset;
      });
      return presets;
    }
    return [{ id: "default", name: "默认配置", config: DEFAULT_BILIUP_CONFIG }];
  };
}

// 验证配置
const validateBiliupConfig = async (config: BiliupConfig) => {
  let msg: string | undefined = undefined;
  if (!config.title) {
    msg = "标题不能为空";
  }
  if (config.title.length > 80) {
    msg = "标题不能超过80个字符";
  }
  if (config.desc && config.desc.length > 250) {
    msg = "简介不能超过250个字符";
  }
  if (config.copyright === 2) {
    if (!config.source) {
      msg = "转载来源不能为空";
    } else {
      if (config.source.length > 200) {
        msg = "转载来源不能超过200个字符";
      }
    }
  }
  if (config.tag.length === 0) {
    msg = "标签不能为空";
  }
  if (config.tag.length > 12) {
    msg = "标签不能超过12个";
  }

  if (msg) {
    return msg;
  }
  return false;
};
