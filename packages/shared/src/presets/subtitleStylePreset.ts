import { subtitleStyleService } from "../db/index.js";

import type { SubtitleOptions } from "@biliLive-tools/types";

const SUBTITLE_STYLE_DEFAULT_CONFIG: SubtitleOptions = {
  fontName: null,
  fontSize: 22,
  primaryColour: "#FFFFFF", // 白色文字
  outlineColour: "#000000", // 黑色边框
  backColour: "#000000", // 黑色阴影
  bold: 0,
  italic: 0,
  underline: 0,
  outline: 1,
  shadow: 0,
  alignment: 2, // 居中下
  marginL: 20,
  marginR: 20,
  marginV: 0,
};

export interface SubtitleStyleConfig {
  id: string;
  name: string;
  config: SubtitleOptions;
}

export class SubtitleStylePreset {
  /**
   * 获取默认字幕样式配置
   */
  getDefaultConfig(): SubtitleOptions {
    return { ...SUBTITLE_STYLE_DEFAULT_CONFIG };
  }

  /**
   * 获取字幕样式预设
   * @param id 预设ID
   */
  async get(id: string): Promise<SubtitleStyleConfig> {
    const result = subtitleStyleService.get(id);
    if (!result) {
      return {
        id: "default",
        name: "默认配置",
        config: this.getDefaultConfig(),
      };
    }
    const { name, ...configOptions } = result.config;
    return {
      id: result.id,
      name: name,
      config: { ...this.getDefaultConfig(), ...configOptions },
    };
  }

  /**
   * 获取所有预设
   */
  async list(): Promise<SubtitleStyleConfig[]> {
    const results = subtitleStyleService.list();
    if (!results.some((item) => item.id === "default")) {
      // 如果没有默认预设，添加一个默认预设
      results.unshift({
        id: "default",
        config: { name: "默认配置", ...this.getDefaultConfig() },
      } as any);
    }

    return results.map((item) => {
      const { name, ...configOptions } = item.config;
      return {
        id: item.id,
        name: name,
        config: { ...this.getDefaultConfig(), ...configOptions },
      };
    });
  }

  /**
   * 保存预设
   * @param preset 预设数据
   */
  async save(preset: SubtitleStyleConfig): Promise<boolean> {
    const existing = subtitleStyleService.get(preset.id);
    const configWithName = { ...preset.config, name: preset.name };
    if (existing) {
      subtitleStyleService.update(preset.id, configWithName);
    } else {
      subtitleStyleService.add({
        id: preset.id,
        config: configWithName,
      });
    }
    return true;
  }

  /**
   * 删除预设
   * @param id 预设ID
   */
  async delete(id: string): Promise<boolean> {
    if (id === "default") {
      throw new Error("默认预设不可删除");
    }
    subtitleStyleService.remove(id);
    return true;
  }
}
