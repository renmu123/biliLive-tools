import type { LocalRecordr, BaseRecordr } from "@biliLive-tools/types";
import type { AppConfig } from "../config.js";

// 定义独立配置类
export default class RecorderConfig {
  appConfig: AppConfig;

  constructor(appConfig: AppConfig) {
    this.appConfig = appConfig;
  }

  public get(id: string): LocalRecordr | null {
    const getValue = <K extends keyof BaseRecordr>(key: K): BaseRecordr[K] => {
      if ((setting?.noGlobalFollowFields ?? []).includes(key)) {
        return setting![key];
      } else {
        return globalConfig[key];
      }
    };

    const settings = this.appConfig.get("recorders");
    const globalConfig = this.appConfig.get("recorder");

    const setting = settings.find((setting) => setting.id === id);
    if (!setting) return null;

    return {
      ...setting,
      quality: getValue("quality") ?? "highest",
      line: getValue("line"),
      disableProvideCommentsWhenRecording: getValue("disableProvideCommentsWhenRecording") ?? true,
      saveGiftDanma: getValue("saveGiftDanma") ?? false,
      saveSCDanma: getValue("saveSCDanma") ?? true,
      saveCover: getValue("saveCover") ?? false,
      segment: getValue("segment") ?? 60,
      uid: getValue("uid"),
    };
  }
  public list(): LocalRecordr[] {
    const recorders = this.appConfig.get("recorders");
    return recorders
      .map((recorder) => {
        return this.get(recorder.id);
      })
      .filter((recorder): recorder is LocalRecordr => recorder != null);
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
