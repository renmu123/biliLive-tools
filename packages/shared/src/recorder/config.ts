import { get } from "lodash-es";
import { getCookie } from "../task/bili.js";

import type { LocalRecordr, BaseRecordr } from "@biliLive-tools/types";
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
  ): (LocalRecordr & { qualityRetry: number; auth?: string; useM3U8Proxy: boolean }) | null {
    const getValue = <K extends keyof BaseRecordr>(key: K): BaseRecordr[K] => {
      if ((setting?.noGlobalFollowFields ?? []).includes(key)) {
        // @ts-ignore
        return setting?.[key];
      } else {
        if (key === "uid") {
          // @ts-ignore
          return get(globalConfig, "bilibili.uid");
          // @ts-ignore
        } else if (key === "useM3U8Proxy") {
          // @ts-ignore
          return get(globalConfig, "bilibili.useM3U8Proxy");
        } else {
          // @ts-ignore
          return get(globalConfig, key);
        }
      }
    };

    const settings = this.appConfig.get("recorders");
    const globalConfig = this.appConfig.get("recorder");

    const setting = settings.find((setting) => setting.id === id);
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
      segment: getValue("segment") ?? 60,
      uid: uid,
      convert2Mp4: globalConfig["convert2Mp4"] ?? false,
      // @ts-ignore
      qualityRetry: getValue("qualityRetry") ?? 0,
      auth: auth,
      // @ts-ignore
      useM3U8Proxy: getValue("useM3U8Proxy") ?? false,
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
  public add(recorder: LocalRecordr) {
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
  public update(recorder: Omit<LocalRecordr, "providerId" | "channelId" | "owner">) {
    const recorders = this.appConfig.get("recorders");
    const item = recorders.find((item) => item.id === recorder.id);
    if (item == null) return;
    Object.assign(item, recorder);
    this.appConfig.set("recorders", recorders);
  }
}
