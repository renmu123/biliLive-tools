import type { AppConfig } from "@biliLive-tools/types";

export enum TaskType {
  danmu = "danmu",
  ffmpeg = "ffmpeg",
  bili = "bili",
  biliUpload = "biliUpload",
  biliDownload = "biliDownload",
  douyuDownload = "douyuDownload",
  subtitleTranslate = "subtitleTranslate",
}

export enum NotificationType {
  server = "server",
  mail = "mail",
  tg = "tg",
  system = "system",
  ntfy = "ntfy",
  allInOne = "allInOne",
}

export enum LLMType {
  ollama = "ollama",
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
  passKey: "",
  https: false,
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
    uploadNoDanmu: false,
    noDanmuVideoPreset: undefined,
  },
  ffmpegPath: "",
  ffprobePath: "",
  danmuFactoryPath: "",
  losslessCutPath: "",
  /** 允许自定义可执行文件地址 */
  customExecPath: false,
  bilibiliUser: {},
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
      danmuPresetId: "default",
    },
    videoMerge: {
      saveOriginPath: false,
      removeOrigin: false,
    },
    download: {
      savePath: "",
      danmu: "none",
      douyuResolution: "highest",
      override: false,
      onlyAudio: false,
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
    ffmpegMaxNum: 3,
    douyuDownloadMaxNum: 2,
    biliUploadMaxNum: 2,
    biliDownloadMaxNum: 2,
  },
  notification: {
    task: {
      ffmpeg: [],
      danmu: [],
      upload: [],
      download: [],
      douyuDownload: [],
      mediaStatusCheck: [],
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
      allInOne: {
        server: "",
        key: "",
      },
    },
  },
  llmPresets: [],
  biliUpload: {
    line: "auto",
    concurrency: 3,
    limitRate: 0,
    retryTimes: 5,
    retryDelay: 7000,
    checkInterval: 600,
  },
  recorder: {
    savePath: "",
    nameRule: "{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}",
    autoRecord: true,
    quality: "highest",
    line: undefined,
    checkInterval: 60,
    disableProvideCommentsWhenRecording: false,
    segment: 60,
    saveGiftDanma: false,
    saveSCDanma: true,
    saveCover: false,
    uid: undefined,
    debugMode: false,
    convert2Mp4: false,
    bilibili: {
      uid: "",
      quality: 10000,
    },
  },
  recorders: [],
};
