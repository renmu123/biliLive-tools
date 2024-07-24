import fs from "node:fs";

import type { AppConfig } from "@biliLive-tools/types";
import { defaultsDeep } from "lodash-es";
// import log from "../utils/log";
// import { setFfmpegPath } from "./video";

export default class Config {
  filepath: string;
  protected data: {
    [propName: string]: any;
  };
  constructor() {
    this.filepath = "";
    this.data = {};
  }
  set(key: string | number, value: any) {
    this.data[key] = value;
    this.save();
  }
  setAll(data: { [propName: string]: any }) {
    this.data = data;
    this.save();
  }
  get(key: string | number) {
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
      // console.log(
      //   "init111111111",
      //   JSON.parse(JSON.stringify(this.data)),
      //   JSON.parse(JSON.stringify(initData)),
      //   JSON.parse(JSON.stringify(defaultsDeep(this.data, initData))),
      //   JSON.parse(JSON.stringify(defaultsDeep(initData, this.data))),
      // );
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

export const APP_DEFAULT_CONFIG: AppConfig = {
  logLevel: "warn",
  autoUpdate: true,
  autoLaunch: false,
  trash: false,
  saveConfig: false,
  minimizeToTray: false,
  closeToTray: true,
  theme: "system",
  port: 18010,
  host: "127.0.0.1",
  webhook: {
    open: false,
    recoderFolder: "",
    minSize: 20,
    title: "【{{user}}】{{title}}-{{now}}",
    uploadPresetId: undefined,
    blacklist: "",
    danmu: false,
    rooms: {},
    ffmpegPreset: undefined,
    danmuPreset: undefined,
    autoPartMerge: false,
    partMergeMinute: 10,
    hotProgress: false,
    useLiveCover: false,
    hotProgressSample: 30,
    hotProgressHeight: 60,
    hotProgressColor: "#f9f5f3",
    hotProgressFillColor: "#333333",
    convert2Mp4: false,
    useVideoAsTitle: false,
    uploadHandleTime: ["00:00:00", "23:59:59"],
    limitUploadTime: false,
  },
  // ffmpegPath: path.join(
  //   path.dirname(app.getPath("exe")),
  //   "resources",
  //   "app.asar.unpacked",
  //   "resources",
  //   "bin",
  //   "ffmpeg.exe",
  // ),
  // ffprobePath: path.join(
  //   path.dirname(app.getPath("exe")),
  //   "resources",
  //   "app.asar.unpacked",
  //   "resources",
  //   "bin",
  //   "ffprobe.exe",
  // ),
  ffmpegPath: "",
  ffprobePath: "",
  danmuFactoryPath: "",
  losslessCutPath: "",
  /** 允许自定义可执行文件地址 */
  customExecPath: false,
  biliUser: {},
  tool: {
    home: {
      uploadPresetId: "default",
      danmuPresetId: "default",
      ffmpegPresetId: "b_libx264",
      removeOrigin: false,
      openFolder: false,
      autoUpload: false,
      hotProgress: false,
      hotProgressSample: 30,
      hotProgressHeight: 60,
      hotProgressColor: "#f9f5f3",
      hotProgressFillColor: "#333333",
    },
    upload: {
      uploadPresetId: "default",
    },
    danmu: {
      danmuPresetId: "default",
      saveRadio: 1,
      savePath: "",
      removeOrigin: false,
      openFolder: false,
    },
    video2mp4: {
      saveRadio: 1,
      savePath: "",
      saveOriginPath: false,
      override: false,
      removeOrigin: false,
      ffmpegPresetId: "b_copy",
    },
    videoMerge: {
      saveOriginPath: false,
      removeOrigin: false,
    },
    download: {
      savePath: "",
      // savePath: app.getPath("downloads"),
    },
    translate: {
      presetId: undefined,
    },
    videoCut: {
      /** 保存类型 */
      saveRadio: 1,
      /** 保存路径 */
      savePath: ".\\导出文件夹",
      /** 覆盖已存在的文件 */
      override: false,
      /** ffmpeg预设 */
      ffmpegPresetId: "b_libx264",
      title: "{{filename}}-{{label}}-{{num}}",
      danmuPresetId: "default",
    },
  },
  task: {
    ffmpegMaxNum: -1,
  },
  notification: {
    task: {
      ffmpeg: [],
      danmu: [],
      upload: [],
      download: [],
    },
    setting: {
      type: undefined,
      server: {
        key: "",
      },
      mail: {
        host: "",
        port: "465",
        user: "",
        pass: "",
        to: "",
        secure: true,
      },
      tg: {
        key: "",
        chat_id: "",
      },
      ntfy: {
        url: "",
        topic: "",
      },
    },
  },
  llmPresets: [],
};

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

class AppConfigClass extends Config {
  constructor() {
    super();
  }
  load(filepath: string) {
    this.init(filepath);
  }
  // 需要传递：{ffmpegPath:"",ffprobePath:"",tool:{download:{savePath:""}}}
  init(filepath: string, data: DeepPartial<AppConfig> = {}) {
    const initData = defaultsDeep(data, APP_DEFAULT_CONFIG);
    super.init(filepath, initData);
  }
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return super.get(key);
  }
  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]) {
    return super.set(key, value);
  }
  setAll(newConfig: AppConfig) {
    return super.setAll(newConfig);
  }
  getAll() {
    const data = this.read() as AppConfig;
    return data;
  }
}

export const appConfig = new AppConfigClass();
