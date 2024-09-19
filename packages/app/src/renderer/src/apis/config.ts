import request from "./request";
import type { AppConfig } from "@biliLive-tools/types";

export const get = async (): Promise<AppConfig> => {
  if (window.isWeb) {
    return request.get(`/config`);
  } else {
    return window.api.config.getAll();
  }
};

export const set = async <K extends keyof AppConfig>(
  key: K,
  value: AppConfig[K],
): Promise<void> => {
  if (window.isWeb) {
    return request.post(`/config/set`, {
      key,
      value,
    });
  } else {
    return window.api.config.set(key, value);
  }
};

export const save = async <K extends keyof AppConfig>(data: AppConfig[K]): Promise<void> => {
  if (window.isWeb) {
    return request.post(`/config`, data);
  } else {
    return window.api.config.save(data);
  }
};

const config = {
  get,
  set,
};

export default config;
