import type { AppConfig, Recorder } from "@biliLive-tools/types";

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
  douyinLiveDownload = "douyinLiveDownload",
  subtitleTranslate = "subtitleTranslate",
  sync = "sync",
  flvRepair = "flvRepair",
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
  logLevel: "debug",
  autoUpdate: true,
  autoLaunch: false,
  trash: false,
  saveConfig: false,
  minimizeToTray: false,
  closeToTray: true,
  theme: "system",
  menuBarVisible: true,
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
    flvRepair: false,
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
  mesioPath: "",
  bililiveRecorderPath: "",
  audiowaveformPath: "",
  cacheFolder: "",
  /** 允许自定义可执行文件地址 */
  customExecPath: false,
  requestInfoForRecord: true,
  biliUploadFileNameType: "ask",
  cutPageInNewWindow: false,
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
    flvRepair: {
      type: "bililive",
      saveRadio: 1,
      savePath: "",
    },
    download: {
      savePath: "",
      danmu: "none",
      douyuResolution: "highest",
      override: false,
      onlyAudio: false,
      onlyDanmu: false,
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
      exportSubtitle: true,
    },
  },
  task: {
    ffmpegMaxNum: 3,
    douyuDownloadMaxNum: 2,
    biliUploadMaxNum: 2,
    biliDownloadMaxNum: 2,
    syncMaxNum: 3,
  },
  videoCut: {
    autoSave: true,
    cacheWaveform: true,
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
      limitRate: 0, // KB
      retry: 0,
    },
    pan123: {
      clientId: "",
      clientSecret: "",
      limitRate: 0,
    },
    syncConfigs: [],
  },
  llmPresets: [],
  ai: {
    vendors: [],
    songRecognizeLlm: {
      vendorId: undefined,
      prompt: `
你是一个极度专业的音乐识别专家，擅长从存在误差的 ASR（语音识别）文本中提取核心语义，并精准锁定歌曲信息。
从搜索结果中精确获取歌名以及需确保返回的【歌词】版本为官方标准发行版，不要遗漏，请提供【歌词】
# Output Format
输出JSON，格式如下
{
  "lyrics": "[查询到的完整标准歌词]",
  "name": "[准确的歌曲名称]"
}`,
      model: "qwen-plus",
      enableSearch: true,
      maxInputLength: 300,
      enableStructuredOutput: true,
      lyricOptimize: true,
    },
    songLyricOptimize: {
      vendorId: undefined,
      prompt: `
# Role
你是一个极度严谨的音频字幕对齐专家，擅长将破碎的 ASR 识别结果（ASR_Data）完美映射到标准文本（Standard_Lyrics）上。

# Core Algorithm: Anchor-Based Alignment
1. 语义锚点定位：首先在 Standard_Lyrics 中识别出每一行（Line）。
2. 碎片重组（Merging）：
  扫描 ASR_Data，将物理时间连续且语义指向 Standard_Lyrics 同一行的多个片段进行合并。
  新 st (begin_time) = 合并序列中第一个片段的 st。
  新 et (end_time) = 合并序列中最后一个片段的 et。
3. 文本重写（Rewriting）：
  严禁使用 ASR 的原始文本作为输出。一旦确定了 ASR 片段对应的标准歌词行，直接将该行的 Standard_Lyrics 赋值给 t 字段。
  即使 ASR 识别漏字、错字，也要以 Standard_Lyrics 的完整内容填充。

# Constraints
  换行一致性 (Strict)：原则上 Standard_Lyrics 的每一个换行对应一个 JSON 对象。
  长句处理 (Long Sentence)：若原歌词单行过长导致 ASR 时间跨度巨大，请观察 ASR 内部的停顿（Gap > 500ms），并在标准文本的自然断句点进行切分，生成两个连续的 JSON 对象。
  禁止时间戳漂移：所有时间戳必须直接取自原始 ASR_Data 的边缘值，不得进行加减运算或平均化处理。
  数据完整性：输出必须包含 Standard_Lyrics 中的所有行。如果某行歌词在 ASR 中找不到对应（如长空白），请根据前后时间戳推算一个合理的静默区间或沿用上一个片段的结束时间，但优先确保文本完整。

# Workflow
  读取 Standard_Lyrics。
  遍历 Standard_Lyrics 的每一行，在 ASR_Data 中寻找最匹配的起始与结束索引。
  执行合并并生成 JSON。

## Output Format
仅输出 JSON 对象，格式如下： {"data": [{"st": 123, "et": 456, "t": "标准歌词内容"}]}
`,
      model: "",
      enableStructuredOutput: true,
    },
    subtitleRecognize: {
      vendorId: undefined,
      model: "fun-asr",
    },
  },
  biliUpload: {
    line: "auto",
    concurrency: 3,
    limitRate: 0,
    retryTimes: 10,
    retryDelay: 7000,
    checkInterval: 600,
    minUploadInterval: 0,
    accountAutoCheck: true,
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
    maxThreadCount: 3,
    waitTime: 0,
    disableProvideCommentsWhenRecording: false,
    segment: "90",
    saveGiftDanma: false,
    saveSCDanma: true,
    saveCover: false,
    uid: undefined,
    debugMode: false,
    debugLevel: "none",
    qualityRetry: 0,
    videoFormat: "auto",
    recorderType: "bililive",
    useServerTimestamp: true,
    recordRetryImmediately: true,
    bilibili: {
      uid: undefined,
      quality: 10000,
      useBatchQuery: false,
      useM3U8Proxy: true,
      formatName: "auto",
      codecName: "auto",
      customHost: undefined,
    },
    douyu: {
      quality: 0,
      source: "auto",
    },
    huya: {
      quality: 0,
      formatName: "auto",
      source: "auto",
      api: "auto",
    },
    douyin: {
      quality: "origin",
      formatName: "auto",
      cookie: "",
      doubleScreen: true,
      api: "web",
    },
    saveDanma2DB: false,
  },
  video: {
    subCheckInterval: 60,
    subSavePath: "",
  },
  recorders: [],
  virtualRecord: {
    config: [],
    startTime: Date.now(),
  },
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

export const defaultRecordConfig: Omit<Recorder, "id"> = {
  providerId: "DouYu",
  channelId: "",
  segment: "60",
  quality: "highest",
  disableProvideCommentsWhenRecording: false,
  saveGiftDanma: false,
  saveSCDanma: true,
  streamPriorities: [],
  sourcePriorities: [],
  disableAutoCheck: false,
  sendToWebhook: false,
  noGlobalFollowFields: [],
  saveCover: false,
  extra: {},
  qualityRetry: 0,
  formatName: "auto",
  useM3U8Proxy: false,
  codecName: "auto",
  titleKeywords: "",
  liveStartNotification: false,
  liveEndNotification: false,
  weight: 10,
  source: "auto",
  videoFormat: "auto",
  recorderType: "ffmpeg",
  cookie: "",
  doubleScreen: true,
  useServerTimestamp: true,
  handleTime: [null, null],
  debugLevel: "none",
  api: "web",
};
