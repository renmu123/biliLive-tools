import type { Recorder } from "@biliLive-tools/types";
import { get } from "lodash-es";

import type { AppConfig } from "../config.js";
import { getCookie } from "../task/bili.js";

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

  public get(id: string):
    | (Recorder & {
        auth?: string;
        formatPriorities?: Array<"hls" | "flv">;
      })
    | null {
    const settings = this.appConfig.get("recorders");
    const globalConfig = this.appConfig.get("recorder");

    const setting = settings.find((item) => item.id === id);
    if (!setting) return null;

    const noGlobalFollowFields = (setting.noGlobalFollowFields ?? []) as readonly string[];
    const settingRecord = setting as unknown as Record<string, unknown>;

    const getValue = (key: string) => {
      if (noGlobalFollowFields.includes(key)) {
        return settingRecord[key];
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
          if (setting.providerId === "XHS") {
            return get(globalConfig, "xhs.cookie");
          }
        } else if (key === "douyinCookieMode") {
          if (setting.providerId === "DouYin") {
            return get(globalConfig, "douyin.mode", "always");
          }
        } else if (key === "douyinCookieAccounts") {
          if (setting.providerId === "DouYin") {
            return get(globalConfig, "douyin.accounts", []);
          }
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
        } else if (key === "api") {
          if (setting.providerId === "DouYin") {
            return get(globalConfig, "douyin.api");
          } else if (setting.providerId === "HuYa") {
            return get(globalConfig, "huya.api");
          } else {
            return "auto";
          }
        } else if (key === "customHost") {
          if (setting.providerId === "Bilibili") {
            return get(globalConfig, "bilibili.customHost");
          } else {
            return undefined;
          }
        } else {
          return get(globalConfig, key);
        }
      }
    };

    const normalizeDouyinAccountWeight = (weight: unknown) => {
      const parsedWeight = Number(weight);
      return Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : 1;
    };

    const pickWeightedDouyinAccount = (
      accounts: Array<{
        remark?: string;
        cookie?: string;
        enabled?: boolean;
        weight?: number;
      }>,
    ) => {
      const enabledAccounts = accounts.filter((item) => item.enabled !== false && item.cookie?.trim());
      if (enabledAccounts.length === 0) {
        return undefined;
      }

      const normalizedAccounts = enabledAccounts.map((item) => ({
        ...item,
        cookie: item.cookie?.trim(),
        weight: normalizeDouyinAccountWeight(item.weight),
      }));
      const totalWeight = normalizedAccounts.reduce((sum, item) => sum + item.weight, 0);
      let random = Math.random() * totalWeight;

      for (const account of normalizedAccounts) {
        random -= account.weight;
        if (random <= 0) {
          return account;
        }
      }

      return normalizedAccounts[normalizedAccounts.length - 1];
    };

    // 授权处理
    let uid: number | string | undefined;
    let auth: string | undefined;
    let currentDouyinCookieRemark: string | undefined;
    if (setting.providerId === "Bilibili") {
      uid = getValue("uid");
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
      const cookieMode = getValue("douyinCookieMode") ?? "always";
      const accounts = (getValue("douyinCookieAccounts") ?? []) as Array<{
        remark?: string;
        cookie?: string;
        enabled?: boolean;
        weight?: number;
      }>;
      const selectedAccount = pickWeightedDouyinAccount(accounts);
      if (cookieMode === "off") {
        auth = undefined;
      } else if (selectedAccount?.cookie) {
        auth = selectedAccount.cookie;
        currentDouyinCookieRemark = selectedAccount.remark?.trim() || undefined;
      } else {
        auth = undefined;
      }
      uid = setting?.uid;
    } else if (setting.providerId === "XHS") {
      auth = getValue("cookie");
      uid = setting?.uid;
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
    const api = getValue("api") ?? "auto";

    // 弹幕处理
    let disableProvideCommentsWhenRecording =
      getValue("disableProvideCommentsWhenRecording") ?? true;
    if (setting.providerId === "XHS") {
      // 小红书不支持弹幕
      disableProvideCommentsWhenRecording = true;
    }

    const result: Recorder & {
      auth?: string;
      formatPriorities?: Array<"hls" | "flv">;
    } = {
      ...setting,
      quality: getValue("quality") ?? "highest",
      line: getValue("line"),
      disableProvideCommentsWhenRecording: disableProvideCommentsWhenRecording,
      saveGiftDanma: getValue("saveGiftDanma") ?? false,
      saveSCDanma: getValue("saveSCDanma") ?? true,
      saveCover: getValue("saveCover") ?? false,
      segment: getValue("segment") ?? 90,
      uid: uid,
      qualityRetry: getValue("qualityRetry") ?? 0,
      videoFormat: getValue("videoFormat") ?? "auto",
      debugLevel: getValue("debugLevel") ?? "none",
      recorderType: getValue("recorderType") ?? "ffmpeg",
      auth: auth,
      useM3U8Proxy: getValue("useM3U8Proxy") ?? false,
      useServerTimestamp: getValue("useServerTimestamp") ?? true,
      formatName: formatName,
      codecName: getValue("codecName") ?? "auto",
      source: getValue("source") ?? "auto",
      formatPriorities: formatPriorities,
      doubleScreen: getValue("doubleScreen"),
      sourcePriorities: sourcePriorities,
      api: api,
    };

    const customHost = getValue("customHost");
    if (customHost !== undefined) {
      result.customHost = customHost;
    }

    const extra = {
      ...(setting.extra ?? {}),
      ...(currentDouyinCookieRemark !== undefined ? { currentDouyinCookieRemark } : {}),
    };
    if (Object.keys(extra).length > 0) {
      result.extra = extra;
    }

    return result;
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
