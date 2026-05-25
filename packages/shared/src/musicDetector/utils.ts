import { appConfig } from "../config.js";

import type { AppConfig } from "@biliLive-tools/types";

/**
 * 获取模型参数
 * @returns 模型参数对象
 */
export function getModel(modelId: string | undefined, iConfig?: AppConfig) {
  if (!modelId) {
    throw new Error("模型ID未定义");
  }
  let config = iConfig;
  if (!config) {
    config = appConfig.getAll();
  }

  const model = config.ai.models.find((m) => m.modelId === modelId);
  if (!model) {
    throw new Error(`找不到模型：${modelId}`);
  }
  return model;
}
