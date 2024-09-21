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

// export const APP_DEFAULT_CONFIG: AppConfigType = {
//   logLevel: "warn",
//   autoUpdate: true,
//   autoLaunch: false,
//   trash: false,
//   saveConfig: false,
//   minimizeToTray: false,
//   closeToTray: true,
//   theme: "system",
//   port: 18010,
//   host: "127.0.0.1",
//   webhook: {
//     open: false,
//     recoderFolder: "",
//     minSize: 20,
//     title: "【{{user}}】{{title}}-{{now}}",
//     uploadPresetId: undefined,
//     blacklist: "",
//     danmu: false,
//     rooms: {},
//     ffmpegPreset: undefined,
//     danmuPreset: undefined,
//     autoPartMerge: false,
//     partMergeMinute: 10,
//     hotProgress: false,
//     useLiveCover: false,
//     hotProgressSample: 30,
//     hotProgressHeight: 60,
//     hotProgressColor: "#f9f5f3",
//     hotProgressFillColor: "#333333",
//     convert2Mp4: false,
//     useVideoAsTitle: false,
//     uploadHandleTime: ["00:00:00", "23:59:59"],
//     limitUploadTime: false,
//   },
//   ffmpegPath: "",
//   ffprobePath: "",
//   danmuFactoryPath: "",
//   losslessCutPath: "",
//   /** 允许自定义可执行文件地址 */
//   customExecPath: false,
//   bilibiliUser: {},
//   tool: {
//     home: {
//       uploadPresetId: "default",
//       danmuPresetId: "default",
//       ffmpegPresetId: "b_libx264",
//       removeOrigin: false,
//       openFolder: false,
//       autoUpload: false,
//       hotProgress: false,
//       hotProgressSample: 30,
//       hotProgressHeight: 60,
//       hotProgressColor: "#f9f5f3",
//       hotProgressFillColor: "#333333",
//     },
//     upload: {
//       uploadPresetId: "default",
//     },
//     danmu: {
//       danmuPresetId: "default",
//       saveRadio: 1,
//       savePath: "",
//       removeOrigin: false,
//       openFolder: false,
//     },
//     video2mp4: {
//       saveRadio: 1,
//       savePath: "",
//       saveOriginPath: false,
//       override: false,
//       removeOrigin: false,
//       ffmpegPresetId: "b_copy",
//     },
//     videoMerge: {
//       saveOriginPath: false,
//       removeOrigin: false,
//     },
//     download: {
//       savePath: path.join(os.homedir(), "Downloads"),
//     },
//     translate: {
//       presetId: undefined,
//     },
//     videoCut: {
//       /** 保存类型 */
//       saveRadio: 1,
//       /** 保存路径 */
//       savePath: ".\\导出文件夹",
//       /** 覆盖已存在的文件 */
//       override: false,
//       /** ffmpeg预设 */
//       ffmpegPresetId: "b_libx264",
//       title: "{{filename}}-{{label}}-{{num}}",
//       danmuPresetId: "default",
//     },
//   },
//   task: {
//     ffmpegMaxNum: -1,
//     douyuDownloadMaxNum: 2,
//     biliUploadMaxNum: -1,
//   },
//   notification: {
//     task: {
//       ffmpeg: [],
//       danmu: [],
//       upload: [],
//       download: [],
//       douyuDownload: [],
//       mediaStatusCheck: [],
//     },
//     setting: {
//       type: undefined,
//       server: {
//         key: "",
//       },
//       mail: {
//         host: "",
//         port: "465",
//         user: "",
//         pass: "",
//         to: "",
//         secure: true,
//       },
//       tg: {
//         key: "",
//         chat_id: "",
//       },
//       ntfy: {
//         url: "",
//         topic: "",
//       },
//     },
//   },
//   llmPresets: [],
//   biliUpload: {
//     line: "auto",
//     concurrency: 3,
//     retryTimes: 3,
//     retryDelay: 2000,
//     checkInterval: 600,
//   },
//   recorder: {
//     savePath: path.join(os.homedir(), "Downloads"),
//     nameRule: "{owner}\\{year}-{month}-{date} {hour}-{min}-{sec} {title}",
//     autoRecord: true,
//     quality: "highest",
//     line: undefined,
//     checkInterval: 60,
//     disableProvideCommentsWhenRecording: false,
//     segment: 60,
//     saveGiftDanma: false,
//     saveSCDanma: true,
//   },
//   recorders: [],
// };

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
