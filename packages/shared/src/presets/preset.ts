import fs from "fs-extra";

import type { CommonPreset as CommonPresetType } from "@biliLive-tools/types";

export default class CommonPreset<T> {
  filepath: string;
  defaultConfig: T;
  constructor(filepath: string, defaultConfig: T) {
    this.filepath = filepath;
    this.defaultConfig = defaultConfig;
  }
  init(filepath: string) {
    this.filepath = filepath;
    // this.defaultConfig = defaultConfig;
  }
  // 保存所有数据
  async saveAll(presets: CommonPresetType<T>) {
    const allPresets = await this.list();
    const presetIndex = allPresets.findIndex((item) => item.id === presets.id);

    if (presetIndex === -1) {
      allPresets.push(presets);
    } else {
      allPresets[presetIndex] = presets;
    }
    const presetsPath = this.filepath;
    await fs.writeJSON(presetsPath, allPresets);
    return true;
  }
  // 保存预设
  async save(presets: CommonPresetType<T>) {
    const allPresets = await this.list();
    const presetIndex = allPresets.findIndex((item) => item.id === presets.id);

    if (presetIndex === -1) {
      allPresets.push(presets);
    } else {
      allPresets[presetIndex] = presets;
    }
    const presetsPath = this.filepath;
    await fs.writeJSON(presetsPath, allPresets);
    return true;
  }
  // 删除预设
  async delete(id: string) {
    const allPresets = await this.list();
    const presetIndex = allPresets.findIndex((item) => item.id === id);
    if (presetIndex === -1) {
      throw new Error("预设不存在");
    }
    allPresets.splice(presetIndex, 1);
    const presetsPath = this.filepath;
    await fs.writeJSON(presetsPath, allPresets);
    return true;
  }

  // 读取预设
  async get(id: string): Promise<CommonPresetType<T>> {
    const allPresets = await this.list();
    const preset = allPresets.find((item) => item.id === id);
    if (!preset) {
      throw new Error("预设不存在");
    }
    return preset;
  }

  // 读取所有预设
  async list(): Promise<CommonPresetType<T>[]> {
    const presetsPath = this.filepath;
    if (await fs.pathExists(presetsPath)) {
      const presets: any[] = await fs.readJSON(presetsPath);
      presets.map((preset) => {
        preset.config = { ...this.defaultConfig, ...preset.config };
        return preset;
      });
      return presets;
    }
    return [{ id: "default", name: "默认配置", config: this.defaultConfig }];
  }
}
