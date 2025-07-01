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

  public get(
    id: string,
  ): (Recorder & { auth?: string; formatPriorities?: Array<"hls" | "flv"> }) | null {
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
            return get(globalConfig, "huya.formatName");
          } else if (setting.providerId === "DouYin") {
            return get(globalConfig, "douyin.formatName");
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
        } else if (key === "cookie") {
          return get(globalConfig, "douyin.cookie");
        } else if (key === "doubleScreen") {
          if (setting.providerId === "DouYin") {
            return get(globalConfig, "douyin.doubleScreen");
          } else {
            return undefined;
          }
        } else if (key === "sourcePriorities") {
          if (setting.providerId === "HuYa") {
            const source = get(globalConfig, "huya.source");
            if (!source) {
              return [];
            }
            if (source === "auto") {
              return [];
            } else {
              return [source];
            }
          } else {
            return [];
          }
        } else {
          return get(globalConfig, key);
        }
      }
    };

    const settings = this.appConfig.get("recorders");
    const globalConfig = this.appConfig.get("recorder");

    const setting = settings.find((setting) => setting.id === id)!;
    if (!setting) return null;

    // 授权处理
    let uid = undefined;
    let auth: string | undefined;
    if (setting.providerId === "Bilibili") {
      uid = getValue("uid");
      let auth = "";
      if (uid) {
        try {
          const cookies = getCookie(Number(uid));
          auth = Object.entries(cookies)
            .map(([key, value]) => {
              return `${key}=${value}`;
            })
            .join("; ");
        } catch (error) {
          console.error(error);
        }
      }
    } else if (setting.providerId === "DouYin") {
      auth = getValue("cookie");
    }

    // 流格式处理
    const formatName = getValue("formatName") ?? "auto";
    let formatPriorities: Array<"flv" | "hls"> | undefined;
    if (setting.providerId === "DouYin" || setting.providerId === "HuYa") {
      if (formatName === "flv_only") {
        formatPriorities = ["flv"];
      } else if (formatName === "hls") {
        formatPriorities = ["hls", "flv"];
      } else if (formatName === "hls_only") {
        formatPriorities = ["hls"];
      } else {
        formatPriorities = ["flv", "hls"];
      }
    }

    // 虎牙cdn处理
    let sourcePriorities: string[] = [];
    if (setting.providerId === "HuYa") {
      if ((setting?.noGlobalFollowFields ?? []).includes("source")) {
        if (setting.source !== "auto") {
          sourcePriorities = [setting.source];
        }
      } else {
        sourcePriorities = getValue("sourcePriorities");
      }
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
      formatName: formatName,
      codecName: getValue("codecName") ?? "auto",
      source: getValue("source") ?? "auto",
      formatPriorities: formatPriorities,
      doubleScreen: getValue("doubleScreen"),
      sourcePriorities: sourcePriorities,
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
