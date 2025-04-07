import { get } from "lodash-es";
import { getCookie } from "../task/bili.js";

import type { Recorder } from "@biliLive-tools/types";
import type { AppConfig } from "../config.js";

// 定义独立配置类
export default class RecorderConfig {
  appConfig: AppConfig;

  constructor(appConfig: AppConfig) {
    this.appConfig = appConfig;
  }
  public getRaw(id: string) {
    const setting = this.appConfig.get("recorders");
    return setting.find((setting) => setting.id === id);
  }

  public get(id: string): (Recorder & { auth?: string }) | null {
    const getValue = (key: any): any => {
      if ((setting?.noGlobalFollowFields ?? []).includes(key)) {
        return setting?.[key];
      } else {
        if (key === "uid") {
          return get(globalConfig, "bilibili.uid");
        } else if (key === "useM3U8Proxy") {
          return get(globalConfig, "bilibili.useM3U8Proxy");
        } else if (key === "formatName") {
          if (setting.providerId === "Bilibili") {
            return get(globalConfig, "bilibili.formatName");
          } else if (setting.providerId === "HuYa") {
            return "auto";
          } else {
            return "auto";
          }
        } else if (key === "quality") {
          if (setting.providerId === "Bilibili") {
            return get(globalConfig, "bilibili.quality");
          } else if (setting.providerId === "DouYu") {
            return get(globalConfig, "douyu.quality");
          } else if (setting.providerId === "HuYa") {
            return get(globalConfig, "huya.quality");
          } else if (setting.providerId === "DouYin") {
            return get(globalConfig, "douyin.quality");
          } else {
            return get(globalConfig, "quality");
          }
        } else if (key === "codecName") {
          return get(globalConfig, "bilibili.codecName");
        } else if (key === "qualityRetry") {
          return get(globalConfig, "bilibili.qualityRetry");
        } else if (key === "source") {
          return get(globalConfig, "douyu.source");
        } else {
          return get(globalConfig, key);
        }
      }
    };

    const settings = this.appConfig.get("recorders");
    const globalConfig = this.appConfig.get("recorder");

    const setting = settings.find((setting) => setting.id === id)!;
    if (!setting) return null;

    const uid = getValue("uid");
    let auth: string | undefined;
    if (uid) {
      const cookies = getCookie(Number(uid));
      auth = Object.entries(cookies)
        .map(([key, value]) => {
          return `${key}=${value}`;
        })
        .join("; ");
    }

    return {
      ...setting,
      quality: getValue("quality") ?? "highest",
      line: getValue("line"),
      disableProvideCommentsWhenRecording: getValue("disableProvideCommentsWhenRecording") ?? true,
      saveGiftDanma: getValue("saveGiftDanma") ?? false,
      saveSCDanma: getValue("saveSCDanma") ?? true,
      saveCover: getValue("saveCover") ?? false,
      segment: getValue("segment") ?? 90,
      uid: uid,
      qualityRetry: getValue("qualityRetry") ?? 0,
      videoFormat: getValue("videoFormat") ?? "auto",
      auth: auth,
      useM3U8Proxy: getValue("useM3U8Proxy") ?? false,
      formatName: getValue("formatName") ?? "auto",
      codecName: getValue("codecName") ?? "auto",
      source: getValue("source") ?? "auto",
    };
  }
  public list() {
    const recorders = this.appConfig.get("recorders");
    return recorders
      .map((recorder) => {
        return this.get(recorder.id);
      })
      .filter((recorder) => recorder != null);
  }
  public add(recorder: Recorder) {
    const recorders = this.appConfig.get("recorders");
    recorders.push(recorder);
    this.appConfig.set("recorders", recorders);
  }
  public remove(id: string) {
    const recorders = this.appConfig.get("recorders");
    const index = recorders.findIndex((item) => item.id === id);
    if (index === -1) return;
    recorders.splice(index, 1);
    this.appConfig.set("recorders", recorders);
  }
  public update(recorder: Omit<Recorder, "providerId" | "channelId" | "owner">) {
    const recorders = this.appConfig.get("recorders");
    const item = recorders.find((item) => item.id === recorder.id);
    if (item == null) return;
    Object.assign(item, recorder);
    this.appConfig.set("recorders", recorders);
  }
}
