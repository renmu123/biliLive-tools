import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { defaultsDeep, get, cloneDeep } from "lodash-es";
import { TypedEmitter } from "tiny-typed-emitter";
import { APP_DEFAULT_CONFIG } from "./enum.js";

import type { AppConfig as AppConfigType, DeepPartial } from "@biliLive-tools/types";

interface ConfigEvents {
  /** 更新配置时触发 */
  update: (newData: any, oldData: any) => void;
}

export default class Config extends TypedEmitter<ConfigEvents> {
  filepath: string;
  data: {
    [propName: string]: any;
  };
  constructor() {
    super();
    this.filepath = "";
    this.data = {};
  }
  set(key: string | number, value: any) {
    this.read();
    const oldData = cloneDeep(this.data);
    this.data[key] = value;
    this.save();
    this.emit("update", this.data, oldData);
  }
  setAll(data: { [propName: string]: any }) {
    const oldData = this.read();
    this.data = data;
    this.save();
    this.emit("update", this.data, oldData);
  }
  get(key: string | number) {
    this.read();
    return this.data[key];
  }
  save() {
    // 保存文件
    fs.writeFileSync(this.filepath, JSON.stringify(this.data));
  }
  load(filepath: string) {
    this.filepath = filepath;
  }
  init(filepath: string, initData: { [propName: string]: any } = {}) {
    this.filepath = filepath;
    if (!fs.existsSync(this.filepath)) {
      this.data = initData;
    } else {
      this.read();
      this.data = defaultsDeep(this.data, initData);
    }
    this.save();
  }
  clear() {
    // 清空文件
    this.data = {};
    this.save();
  }
  read() {
    // 读取文件
    this.data = JSON.parse(fs.readFileSync(this.filepath, "utf-8"));
    return this.data;
  }
}

export class AppConfig extends Config {
  declare data: AppConfigType;
  constructor(configPath?: string) {
    super();
    if (configPath) {
      this.load(configPath);
    }
  }
  load(filepath: string) {
    this.init(filepath);
  }
  // 需要传递：{ffmpegPath:"",ffprobePath:"",tool:{download:{savePath:""}}}
  init(filepath: string, data: DeepPartial<AppConfigType> = {}) {
    APP_DEFAULT_CONFIG.tool.download.savePath = path.join(os.homedir(), "Downloads");
    APP_DEFAULT_CONFIG.recorder.savePath = path.join(os.homedir(), "Downloads");
    // 16位随机密码，包含大小写字母和数字
    APP_DEFAULT_CONFIG.passKey = Math.random().toString(36).slice(-16);

    const initData = defaultsDeep(data, APP_DEFAULT_CONFIG);
    super.init(filepath, initData);
  }
  get<K extends keyof AppConfigType>(key: K): AppConfigType[K] {
    return super.get(key);
  }
  // 使用lodash的get方法，保留type
  getDeep<TPath extends string>(path: TPath): ReturnType<typeof get> {
    return get(this.data, path);
  }
  set<K extends keyof AppConfigType>(key: K, value: AppConfigType[K]) {
    return super.set(key, value);
  }
  setAll(newConfig: AppConfigType) {
    return super.setAll(newConfig);
  }
  getAll() {
    const data = this.read() as AppConfigType;
    return data;
  }
}

export const appConfig = new AppConfig();
