import type { LocalRecordr, BaseRecordr } from "@biliLive-tools/types";
import type { AppConfig } from "../config.js";

// 定义独立配置类
export default class RecorderConfig {
  appConfig: AppConfig;

  constructor(appConfig: AppConfig) {
    this.appConfig = appConfig;
  }

  public get<K extends keyof LocalRecordr>(id: string, key: K): any {
    const settings = this.appConfig.get("recorders");
    const globalConfig = this.appConfig.get("recorder");

    const setting = settings.find((setting) => setting.id === id);
    if (!setting) return null;

    if (key in setting.noGlobalFollowFields) {
      return setting[key];
    } else {
      return globalConfig[key as keyof BaseRecordr] ?? setting[key];
    }
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
