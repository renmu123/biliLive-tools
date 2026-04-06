import type { SubtitleOptions } from "@biliLive-tools/types";

const STORAGE_KEY_PREFIX = "subtitle-style-";
const DEFAULT_STYLE_ID = "default";

/**
 * 获取默认字幕样式配置
 */
export const getDefaultSubtitleStyle = (): SubtitleOptions => {
  return {
    fontName: undefined,
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
    marginV: 20,
  };
};

/**
 * 获取字幕样式配置
 * @param id 样式ID，默认为 "default"
 */
export const getSubtitleStyle = async (id: string = DEFAULT_STYLE_ID): Promise<SubtitleOptions> => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to get subtitle style:", error);
  }
  return getDefaultSubtitleStyle();
};

/**
 * 保存字幕样式配置
 * @param id 样式ID
 * @param config 样式配置
 */
export const updateSubtitleStyle = async (id: string, config: SubtitleOptions): Promise<void> => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${id}`;
    localStorage.setItem(key, JSON.stringify(config));
  } catch (error) {
    console.error("Failed to update subtitle style:", error);
    throw error;
  }
};

/**
 * 删除字幕样式配置
 * @param id 样式ID
 */
export const deleteSubtitleStyle = async (id: string): Promise<void> => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${id}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to delete subtitle style:", error);
    throw error;
  }
};

const subtitleStyleApi = {
  get: getSubtitleStyle,
  update: updateSubtitleStyle,
  delete: deleteSubtitleStyle,
  getDefault: getDefaultSubtitleStyle,
};

export default subtitleStyleApi;
