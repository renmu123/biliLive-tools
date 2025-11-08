import request from "./request";
import type { AppConfig } from "@biliLive-tools/types";

export const get = async (): Promise<AppConfig> => {
  if (window.isWeb) {
    const res = await request.get(`/config`);
    return res.data;
  } else {
    return window.api.config.getAll();
  }
};

export const set = async <K extends keyof AppConfig>(
  key: K,
  value: AppConfig[K],
): Promise<void> => {
  if (window.isWeb) {
    const res = await request.post(`/config/set`, {
      key,
      value,
    });
    return res.data;
  } else {
    return window.api.config.set(key, value);
  }
};

export const save = async <K extends keyof AppConfig>(data: AppConfig[K]): Promise<void> => {
  if (window.isWeb) {
    const res = await request.post(`/config`, data);
    return res.data;
  } else {
    return window.api.config.save(data);
  }
};

export const resetBin = async (type: "ffmpeg" | "ffprobe" | "danmakuFactory"): Promise<string> => {
  const res = await request.post(`/config/resetBin`, { type });
  return res.data;
};

export const notifyTest = async (
  title: string,
  desp: string,
  options: AppConfig,
  notifyType: AppConfig["notification"]["setting"]["type"],
): Promise<void> => {
  const res = await request.post(`/config/notifyTest`, { title, desp, options, notifyType });
  return res.data;
};

export const exportConfig = async (): Promise<Buffer> => {
  const res = await request.get(`/config/export`, {
    responseType: "blob",
  });
  return res.data;
};

export const importConfig = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await request.post(`/config/import`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

const config = {
  get,
  set,
  save,
  resetBin,
  notifyTest,
  exportConfig,
  importConfig,
};

export default config;
