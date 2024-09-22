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

const config = {
  get,
  set,
  save,
};

export default config;
