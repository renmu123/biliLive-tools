import type { AppConfig } from "@biliLive-tools/types";

export enum TaskType {
  danmu = "danmu",
  ffmpeg = "ffmpeg",
  bili = "bili",
  biliUpload = "biliUpload",
  biliDownload = "biliDownload",
  douyuDownload = "douyuDownload",
  m3u8Download = "m3u8Download",
  huyaDownload = "huyaDownload",
  kuaishouDownload = "kuaishouDownload",
  subtitleTranslate = "subtitleTranslate",
  sync = "sync",
}

export enum NotificationType {
  server = "server",
  mail = "mail",
  tg = "tg",
  system = "system",
  ntfy = "ntfy",
  allInOne = "allInOne",
  customHttp = "customHttp",
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
    afterConvertAction: [],
    autoPartMerge: false,
    partMergeMinute: 10,
    hotProgress: false,
    useLiveCover: false,
    partTitleTemplate: "{{filename}}",
    hotProgressSample: 30,
    hotProgressHeight: 60,
    hotProgressColor: "#f9f5f3",
    hotProgressFillColor: "#333333",
    convert2Mp4: false,
    removeSourceAferrConvert2Mp4: true,
    syncId: undefined,
    uploadHandleTime: ["00:00:00", "23:59:59"],
    limitUploadTime: false,
    uploadNoDanmu: false,
    noDanmuVideoPreset: undefined,
    limitVideoConvertTime: false,
    videoHandleTime: ["00:00:00", "23:59:59"],
    afterUploadDeletAction: "none",
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
      autoUpload: false,
      removeOriginAfterUploadCheck: false,
      hotProgress: false,
      hotProgressSample: 30,
      hotProgressHeight: 60,
      hotProgressColor: "#f9f5f3",
      hotProgressFillColor: "#333333",
    },
    upload: {
      uploadPresetId: "default",
      removeOriginAfterUploadCheck: false,
    },
    fileSync: {
      removeOrigin: false,
      syncType: undefined,
      targetPath: "/",
    },
    danmu: {
      danmuPresetId: "default",
      saveRadio: 1,
      savePath: "",
      removeOrigin: false,
      override: true,
    },
    video2mp4: {
      saveRadio: 1,
      savePath: "",
      saveOriginPath: false,
      override: false,
      removeOrigin: false,
      ffmpegPresetId: "b_copy",
      danmuPresetId: "default",
      hotProgress: false,
    },
    videoMerge: {
      saveOriginPath: false,
      removeOrigin: false,
      keepFirstVideoMeta: false,
      mergeXml: false,
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
      saveRadio: 1,
      savePath: ".\\导出文件夹",
      override: false,
      ffmpegPresetId: "b_libx264",
      title: "{{filename}}-{{label}}-{{num}}",
      danmuPresetId: "default",
      ignoreDanmu: false,
    },
  },
  task: {
    ffmpegMaxNum: 3,
    douyuDownloadMaxNum: 2,
    biliUploadMaxNum: 2,
    biliDownloadMaxNum: 2,
    syncMaxNum: 3,
  },
  notification: {
    task: {
      ffmpeg: [],
      danmu: [],
      upload: [],
      download: [],
      douyuDownload: [],
      mediaStatusCheck: [],
      diskSpaceCheck: {
        values: [],
        threshold: 10,
      },
      sync: [],
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
        proxyUrl: "",
      },
      ntfy: {
        url: "",
        topic: "",
      },
      allInOne: {
        server: "",
        key: "",
      },
      customHttp: {
        url: "",
        method: "GET",
        body: "",
        headers: "",
      },
    },
    taskNotificationType: {
      liveStart: "system",
    },
  },
  sync: {
    baiduPCS: {
      execPath: "",
    },
    aliyunpan: {
      execPath: "",
    },
    alist: {
      apiUrl: "",
      username: "",
      hashPassword: "",
    },
    pan123: {
      clientId: "",
      clientSecret: "",
    },
    syncConfigs: [],
  },
  llmPresets: [],
  biliUpload: {
    line: "auto",
    concurrency: 3,
    limitRate: 0,
    retryTimes: 10,
    retryDelay: 7000,
    checkInterval: 600,
    accountAutoCheck: false,
    useBCutAPI: false,
    useUploadPartPersistence: true,
  },
  recorder: {
    savePath: "",
    nameRule: "{platform}/{owner}/{year}-{month}-{date} {hour}-{min}-{sec} {title}",
    autoRecord: true,
    quality: "highest",
    line: undefined,
    checkInterval: 60,
    disableProvideCommentsWhenRecording: false,
    segment: 90,
    saveGiftDanma: false,
    saveSCDanma: true,
    saveCover: false,
    uid: undefined,
    debugMode: false,
    qualityRetry: 0,
    videoFormat: "auto",
    useServerTimestamp: true,
    recordRetryImmediately: false,
    bilibili: {
      uid: undefined,
      quality: 10000,
      useBatchQuery: false,
      useM3U8Proxy: true,
      formatName: "auto",
      codecName: "auto",
    },
    douyu: {
      quality: 0,
      source: "auto",
    },
    huya: {
      quality: 0,
      formatName: "auto",
      source: "auto",
    },
    douyin: {
      quality: "origin",
      formatName: "auto",
      cookie: "",
      doubleScreen: true,
    },
    saveDanma2DB: false,
  },
  video: {
    subCheckInterval: 60,
    subSavePath: "",
  },
  recorders: [],
};

export const nvencPresets = [
  {
    value: "p1",
    label: "fastest",
  },
  {
    value: "p2",
    label: "faster",
  },
  {
    value: "p3",
    label: "fast",
  },
  {
    value: "p4",
    label: "medium",
  },
  {
    value: "p5",
    label: "slow",
  },
  {
    value: "p6",
    label: "slower",
  },
  {
    value: "p7",
    label: "slowest",
  },
];

export const qsvPresets = [
  {
    value: "veryfast",
    label: "veryfast",
  },
  {
    value: "faster",
    label: "faster",
  },
  {
    value: "fast",
    label: "fast",
  },
  {
    value: "medium",
    label: "medium",
  },
  {
    value: "slow",
    label: "slow",
  },
  {
    value: "slower",
    label: "slower",
  },
  {
    value: "veryslow",
    label: "veryslow",
  },
];

export const cpuPresets = [
  {
    value: "ultrafast",
    label: "ultrafast",
  },
  {
    value: "superfast",
    label: "superfast",
  },
  {
    value: "veryfast",
    label: "veryfast",
  },
  {
    value: "faster",
    label: "faster",
  },
  {
    value: "fast",
    label: "fast",
  },
  {
    value: "medium",
    label: "medium",
  },
  {
    value: "slow",
    label: "slow",
  },
  {
    value: "slower",
    label: "slower",
  },
  {
    value: "veryslow",
    label: "veryslow",
  },
  {
    value: "placebo",
    label: "placebo",
  },
];

export const amfPresets = [
  {
    value: "speed",
    label: "speed",
  },
  {
    value: "balanced",
    label: "balanced",
  },
  {
    value: "quality",
    label: "quality",
  },
];

export const amfAv1Presets = [
  ...amfPresets,
  {
    value: "high_quality",
    label: "high quality",
  },
];

export const videoEncoders = [
  {
    value: "copy",
    label: "copy(复制流)",
    birateControls: [
      {
        value: "CRF",
        label: "CRF",
      },
    ],
  },
  {
    value: "libx264",
    label: "H.264(x264)",
    birateControls: [
      {
        value: "CRF",
        label: "CRF",
      },
      {
        value: "VBR",
        label: "平均比特率",
      },
    ],
    presets: cpuPresets,
  },
  {
    value: "h264_qsv",
    label: "H.264(Intel QSV)",
    birateControls: [
      {
        value: "ICQ",
        label: "ICQ",
      },
      {
        value: "VBR",
        label: "平均比特率",
      },
    ],
    presets: qsvPresets,
  },
  {
    value: "h264_nvenc",
    label: "H.264(NVIDIA NVEnc)",
    birateControls: [
      {
        value: "CQ",
        label: "CQ",
      },
      {
        value: "VBR",
        label: "平均比特率",
      },
    ],
    presets: nvencPresets,
  },
  {
    value: "h264_amf",
    label: "H.264(AMD AMF)",
    birateControls: [
      {
        value: "VBR",
        label: "平均比特率",
      },
    ],
    presets: amfPresets,
  },

  {
    value: "libx265",
    label: "H.265(x265)",
    birateControls: [
      {
        value: "CRF",
        label: "CRF",
      },
      {
        value: "VBR",
        label: "平均比特率",
      },
    ],
    presets: cpuPresets,
  },
  {
    value: "hevc_qsv",
    label: "H.265(Intel QSV)",
    birateControls: [
      {
        value: "ICQ",
        label: "ICQ",
      },
      {
        value: "VBR",
        label: "平均比特率",
      },
    ],
    presets: qsvPresets,
  },
  {
    value: "hevc_nvenc",
    label: "H.265(NVIDIA NVEnc)",
    birateControls: [
      {
        value: "CQ",
        label: "CQ",
      },
      {
        value: "VBR",
        label: "平均比特率",
      },
    ],
    presets: nvencPresets,
  },
  {
    value: "hevc_amf",
    label: "H.265(AMD AMF)",
    birateControls: [
      {
        value: "VBR",
        label: "平均比特率",
      },
    ],
    presets: amfPresets,
  },

  {
    value: "libsvtav1",
    label: "AV1 (libsvtav1)",
    birateControls: [
      {
        value: "CRF",
        label: "CRF",
      },
      {
        value: "VBR",
        label: "平均比特率",
      },
    ],
    presets: [
      {
        value: "0",
        label: "0",
      },
      {
        value: "1",
        label: "1",
      },
      {
        value: "2",
        label: "2",
      },
      {
        value: "3",
        label: "3",
      },
      {
        value: "4",
        label: "4",
      },
      {
        value: "5",
        label: "5",
      },
      {
        value: "6",
        label: "6",
      },
      {
        value: "7",
        label: "7",
      },
      {
        value: "8",
        label: "8",
      },
      {
        value: "9",
        label: "9",
      },
      {
        value: "10",
        label: "10",
      },
      {
        value: "11",
        label: "11",
      },
      {
        value: "12",
        label: "12",
      },
      {
        value: "13",
        label: "13",
      },
    ],
  },
  {
    value: "av1_qsv",
    label: "AV1 (Intel QSV)",
    birateControls: [
      {
        value: "ICQ",
        label: "ICQ",
      },
      {
        value: "VBR",
        label: "平均比特率",
      },
    ],
    presets: qsvPresets,
  },
  {
    value: "av1_nvenc",
    label: "AV1 (NVIDIA NVEnc)",
    birateControls: [
      {
        value: "CQ",
        label: "CQ",
      },
      {
        value: "VBR",
        label: "平均比特率",
      },
    ],
    presets: nvencPresets,
  },
  {
    value: "av1_amf",
    label: "AV1 (AMD AMF)",
    birateControls: [
      {
        value: "VBR",
        label: "平均比特率",
      },
    ],
    presets: amfAv1Presets,
  },
];
