export * from "./task.js";
import type { Line as UploadLine } from "@renmu/bili-api";
export * from "./preset.js";

// 弹幕配置
// export type DanmuConfig = {
//   resolution: [number, number];
//   scrolltime: number;
//   fixtime: number;
//   density: number;
//   customDensity: number;
//   fontname: string;
//   fontsize: number;
//   /** 百分制下的透明度 */
//   opacity100: number;
//   outline: number;
//   shadow: number;
//   displayarea: number;
//   scrollarea: number;
//   bold: boolean;
//   showusernames: boolean;
//   saveblocked: boolean;
//   showmsgbox: boolean;
//   msgboxsize: [number, number];
//   msgboxpos: [number, number];
//   msgboxfontsize: number;
//   msgboxduration: number;
//   giftminprice: number;
//   blockmode: ("R2L" | "L2R" | "TOP" | "BOTTOM" | "SPECIAL" | "COLOR" | "REPEAT")[];
//   statmode: ("TABLE" | "HISTOGRAM")[];
//   resolutionResponsive: false;
//   blacklist: string;
//   timeshift: number;
// };

// 通用预设
export type CommonPreset<T> = {
  id: string;
  name: string;
  config: T;
};

// ffmpeg预设配置
export type FfmpegPreset = CommonPreset<FfmpegOptions>;

export type CommonRoomConfig = {
  open: boolean;
  minSize: number;
  /** 视频标题 */
  title: string;
  uploadPresetId?: string;
  danmu: boolean;
  ffmpegPreset?: string;
  danmuPreset?: string;
  autoPartMerge: boolean;
  partMergeMinute?: number;
  uid?: number;
  /** 生成高能进度条 */
  hotProgress: boolean;
  /** 使用直播封面 */
  useLiveCover: boolean;
  /** 高能进度条：采样间隔 */
  hotProgressSample?: number;
  /** 高能进度条：高度 */
  hotProgressHeight?: number;
  /** 高能进度条：默认颜色 */
  hotProgressColor?: string;
  /** 高能进度条：覆盖颜色 */
  hotProgressFillColor?: string;
  /** 转封装为mp4 */
  convert2Mp4?: boolean;
  /** 转封装后删除源文件 */
  removeSourceAferrConvert2Mp4?: boolean;
  /** 压制完成后的操作 */
  afterConvertAction?: Array<"removeVideo" | "removeXml">;
  /** 限制只在某一段时间处理视频 */
  limitVideoConvertTime?: boolean;
  /** 允许视频处理时间 */
  videoHandleTime: [string, string];
  /** 上传完成后删除操作 */
  afterUploadDeletAction?: "none" | "delete" | "deleteAfterCheck";
  /** 限制只在某一段时间上传 */
  limitUploadTime?: boolean;
  /** 允许上传处理时间 */
  uploadHandleTime: [string, string];
  /** 分p标题模板 */
  partTitleTemplate: string;
  /** 同步器配置ID */
  syncId?: string;

  // 上传非弹幕版选项
  uploadNoDanmu?: boolean;
  // 上传非视频版预设
  noDanmuVideoPreset?: string;
};

// webhook房间配置
export type AppRoomConfig = {
  remark?: string;
  /**不为全局配置的选项 */
  noGlobal?: string[];
} & CommonRoomConfig;

// 工具页配置
export type ToolConfig = {
  /** 主页 */
  home: {
    /** 上传预设 */
    uploadPresetId: string;
    /** 弹幕转换预设 */
    danmuPresetId: string;
    /** ffmpeg预设 */
    ffmpegPresetId: string;
    /** 完成后移除源文件 */
    removeOrigin: boolean;
    /** 完成后自动上传 */
    autoUpload: boolean;
    /** 审核通过后删除源文件 */
    removeOriginAfterUploadCheck: boolean;
    /** 高能进度条 */
    hotProgress: boolean;
    /** 采样间隔 */
    hotProgressSample: number;
    /** 高度 */
    hotProgressHeight: number;
    /** 默认颜色 */
    hotProgressColor: string;
    /** 覆盖颜色 */
    hotProgressFillColor: string;
  };
  /** 翻译配置 */
  translate: {
    presetId?: string;
  };
  /** 上传配置 */
  upload: {
    /** 上传预设 */
    uploadPresetId: string;
    /** 审核通过后删除源文件 */
    removeOriginAfterUploadCheck: boolean;
  };
  /** 弹幕转换配置 */
  danmu: {
    /** 弹幕转换预设 */
    danmuPresetId: string;
    /** 保存类型 */
    saveRadio: 1 | 2;
    /** 保存路径 */
    savePath: string;
    /** 完成后移除源文件 */
    removeOrigin: boolean;
    /** 覆盖已存在的文件 */
    override: boolean;
  };
  video2mp4: {
    /** 保存类型 */
    saveRadio: 1 | 2;
    /** 保存路径 */
    savePath: string;
    /** 保留源文件 */
    saveOriginPath: boolean;
    /** 覆盖已存在的文件 */
    override: boolean;
    /** 完成后移除源文件 */
    removeOrigin: boolean;
    /** ffmpeg预设 */
    ffmpegPresetId: string;
    /** 弹幕预设 */
    danmuPresetId: string;
    /** 高能进度条 */
    hotProgress: boolean;
  };
  videoMerge: {
    /** 保存到原始文件夹 */
    saveOriginPath: boolean;
    /** 完成后移除源文件 */
    removeOrigin: boolean;
    /** 保留元数据 */
    keepFirstVideoMeta: boolean;
    /** 合并弹幕 */
    mergeXml: boolean;
  };
  /** 下载页 */
  download: {
    /** 保存路径 */
    savePath: string;
    /** 弹幕参数 */
    danmu: "none" | "xml";
    /** 斗鱼下载分辨率 */
    douyuResolution: "highest" | string;
    /** 下载时覆盖已有文件 */
    override: boolean;
    /** 只下载音频 */
    onlyAudio: boolean;
  };
  /** 切片 */
  videoCut: {
    /** 保存类型 */
    saveRadio: 1 | 2;
    /** 保存路径 */
    savePath: string;
    /** 覆盖已存在的文件 */
    override: boolean;
    /** ffmpeg预设 */
    ffmpegPresetId: string;
    /** 标题 */
    title: string;
    /** 弹幕预设 */
    danmuPresetId: string;
    /** 忽略弹幕 */
    ignoreDanmu: boolean;
  };
  /** 文件同步 */
  fileSync: {
    /** 完成后移除源文件 */
    removeOrigin: boolean;
    /** 同步类型 */
    syncType?: AppConfig["sync"]["syncConfigs"][number]["syncSource"];
    /** 目标路径 */
    targetPath: string;
  };
};

export type NotificationTaskStatus = "success" | "failure";
/**
 * 邮件配置
 */
export interface NotificationMailConfig {
  /** 邮件服务器 */
  host: string;
  /** 端口 */
  port: string;
  /** 邮箱账户 */
  user: string;
  /** 授权密码 */
  pass: string;
  /** 接收者 */
  to: string;
  /** 是否使用安全连接 */
  secure: boolean;
}
/**
 * server酱配置
 */
export interface NotificationServerConfig {
  key: string;
}
/**
 * ntfy配置
 */
export interface NotificationNtfyConfig {
  url: string;
  topic: string;
}

/**
 * tg配置
 */
export interface NotificationTgConfig {
  key: string;
  chat_id: string;
  proxyUrl?: string;
}

/**
 * push all in one推送配置
 */
export interface NotificationPushAllInAllConfig {
  server: string;
  key: string;
}

/**
 * 自定义HTTP通知配置
 */
export interface NotificationCustomHttpConfig {
  /** 请求URL */
  url: string;
  /** 请求方法 */
  method?: "GET" | "POST" | "PUT";
  /** 请求体，支持{{title}}和{{desc}}占位符 */
  body?: string;
  /** 请求头，每行一个，格式为key: value */
  headers?: string;
}

export type Theme = "system" | "light" | "dark";
type FormatName = "auto" | "flv" | "hls" | "fmp4" | "flv_only" | "hls_only" | "fmp4_only";
type CodecName = "auto" | "avc" | "hevc" | "avc_only" | "hevc_only";

interface BilibiliRecorderConfig {
  /** 账号 */
  uid?: number;
  /** 画质 30000：杜比 20000：4K 10000：原画 400：蓝光 250：超清 150：高清 80：流畅 */
  quality: 30000 | 20000 | 10000 | 400 | 250 | 150 | 80;
  /** 使用批量查询接口  */
  useBatchQuery: boolean;
  /** 使用本地反向代理避免分段 */
  useM3U8Proxy: boolean;
  /** 流格式 */
  formatName: FormatName;
  /** 流编码 */
  codecName: CodecName;
}
interface DouyuRecorderConfig {
  /** 画质：0：原画 2：高清 3：超清 4：蓝光4M 8：蓝光8M */
  quality: 0 | 2 | 3 | 4 | 8;
  source: string;
}

interface HuyaRecorderConfig {
  /** 画质：0:原画 14100: 2khdr 14000: 2k 4200:hdr(10m) 8000:蓝光8m 4000:蓝光4m 2000:超清 500:流畅 */
  quality: 0 | 20000 | 10000 | 14100 | 14000 | 4200 | 8000 | 4000 | 2000 | 500;
  /** 流格式 */
  formatName: FormatName;
  source: string;
}

interface DouyinRecorderConfig {
  quality: "origin" | "uhd" | "hd" | "sd" | "ld" | "ao" | "real_origin";
  /** 抖音cookie */
  cookie: string;
  /** 流格式 */
  formatName: FormatName;
  /** 是否使用双屏直播流 */
  doubleScreen: boolean;
}

// 录制全局配置
export interface GlobalRecorder {
  /** 保存根目录 */
  savePath: string;
  /** 命名规则 */
  nameRule: string;
  /** 自动录制 */
  autoRecord: boolean;
  /** 检查间隔 */
  checkInterval: number;
  /** 调试模式 */
  debugMode: boolean;
  /** 测试：录制错误立即重试 */
  recordRetryImmediately: boolean;
  /** 画质 */
  quality: "lowest" | "low" | "medium" | "high" | "highest";
  /** 线路 */
  line?: string;
  /** 录制弹幕 */
  disableProvideCommentsWhenRecording?: boolean;
  /** 保存礼物弹幕 */
  saveGiftDanma?: boolean;
  /** 保存高能弹幕 */
  saveSCDanma?: boolean;
  /** 弹幕是否使用服务端时间戳 */
  useServerTimestamp: boolean;
  /**分段时长，单位分钟 */
  segment?: number;
  /** 账号 */
  uid?: number;
  /** 保存封面 */
  saveCover?: boolean;
  /** 画质匹配重试次数 */
  qualityRetry: number;
  /** 视频格式 */
  videoFormat: "auto" | "ts" | "mkv";
  /** 支持的录制器 */
  recorderType: "ffmpeg" | "mesio";
  /** 保存弹幕测试 */
  saveDanma2DB: boolean;
  /** B站特有的配置 */
  bilibili: BilibiliRecorderConfig;
  /** 斗鱼特有的配置 */
  douyu: DouyuRecorderConfig;
  /** 虎牙特有的配置 */
  huya: HuyaRecorderConfig;
  /** 抖音特有的配置 */
  douyin: DouyinRecorderConfig;
}

export interface Recorder {
  providerId: "DouYu" | "HuYa" | "Bilibili" | "DouYin";
  id: string;
  channelId: string;
  remarks?: string;
  streamPriorities: any[];
  sourcePriorities: any[];
  extra: {
    createTimestamp?: number;
    /** B站主播的uid */
    recorderUid?: number;
    /** 头像 */
    avatar?: string;
  };
  disableAutoCheck?: boolean;
  /** 发送至发送至软件webhook */
  sendToWebhook?: boolean;
  /** 画质 */
  quality:
    | "lowest"
    | "low"
    | "medium"
    | "high"
    | "highest"
    | BilibiliRecorderConfig["quality"]
    | DouyuRecorderConfig["quality"]
    | HuyaRecorderConfig["quality"]
    | DouyinRecorderConfig["quality"];
  /** 线路，尚未使用 */
  line?: string;
  /** 录制弹幕 */
  disableProvideCommentsWhenRecording?: boolean;
  /** 保存礼物弹幕 */
  saveGiftDanma?: boolean;
  /** 弹幕是否使用服务端时间戳 */
  useServerTimestamp: boolean;
  /** 保存高能弹幕 */
  saveSCDanma?: boolean;
  /**分段时长，单位分钟 */
  segment?: number;
  /** 账号 */
  uid?: number;
  /** 保存封面 */
  saveCover?: boolean;
  /** 视频格式 */
  videoFormat: GlobalRecorder["videoFormat"];
  /** 录制器类型 */
  recorderType: GlobalRecorder["recorderType"];
  qualityRetry: GlobalRecorder["qualityRetry"];
  formatName: GlobalRecorder["bilibili"]["formatName"];
  useM3U8Proxy: GlobalRecorder["bilibili"]["useM3U8Proxy"];
  codecName: GlobalRecorder["bilibili"]["codecName"];
  source: GlobalRecorder["douyu"]["source"];
  /** 标题关键词，如果直播间标题包含这些关键词，则不会自动录制（仅对斗鱼有效），多个关键词用英文逗号分隔 */
  titleKeywords?: string;
  /** 开播推送 */
  liveStartNotification?: boolean;
  /** 抖音cookie */
  cookie?: string;
  /** 是否使用双屏直播流 */
  doubleScreen?: boolean;
  /** 流格式优先级 */
  // formatPriorities: Array<"flv" | "hls">;
  /** 只录制音频 */
  onlyAudio?: boolean;
  /** 监控时间段 */
  handleTime: [string | null, string | null];
  // 不跟随全局配置字段
  noGlobalFollowFields: Array<
    Exclude<
      keyof Recorder,
      | "providerId"
      | "id"
      | "channelId"
      | "remarks"
      | "extra"
      | "disableAutoCheck"
      | "sendToWebhook"
      | "streamPriorities"
      | "sourcePriorities"
      | "noGlobalFollowFields"
      | "line"
      | "titleKeywords"
      | "liveStartNotification"
      | "onlyAudio"
      | "handleTime"
    >
  >;
}

export type SyncType = "baiduPCS" | "aliyunpan" | "alist" | "pan123" | "copy";

export type SyncConfig = {
  id: string;
  name: string;
  syncSource: SyncType;
  folderStructure: string;
  targetFiles: ("source" | "danmaku" | "xml" | "cover")[];
};

// 全局配置
export interface AppConfig {
  logLevel: any;
  /** 允许自定义可执行文件地址 */
  customExecPath: boolean;
  ffmpegPath: string;
  ffprobePath: string;
  danmuFactoryPath: string;
  /** lossles-cut可执行路径 */
  losslessCutPath: string;
  /** mesio 可执行路径 */
  mesioPath: string;
  /** 保存到回收站 */
  trash: boolean;
  /** 自动检查更新 */
  autoUpdate?: boolean;
  /** 开机自启动 */
  autoLaunch: boolean;
  /** 配置持久化 */
  saveConfig: boolean;
  /** 最小化到任务栏 */
  minimizeToTray: boolean;
  /** 关闭到任务栏 */
  closeToTray: boolean;
  /** 主题 */
  theme: Theme;
  port: number;
  host: string;
  passKey: string;
  https?: boolean;
  webhook: {
    recoderFolder: string;
    blacklist: string;
    rooms: {
      [roomId: string]: AppRoomConfig;
    };
  } & CommonRoomConfig;
  /** 废弃：b站登录信息 */
  biliUser?: {
    [uid: number]: BiliUser;
  };
  /** 加密后的B站登录信息 */
  bilibiliUser: {
    [uid: number]: string;
  };
  /** 当前使用的b站uid */
  uid?: number;
  /** 工具页配置 */
  tool: ToolConfig;
  /** 通知配置 */
  notification: {
    /** 任务 */
    task: {
      ffmpeg: NotificationTaskStatus[];
      danmu: NotificationTaskStatus[];
      upload: NotificationTaskStatus[];
      download: NotificationTaskStatus[];
      douyuDownload: NotificationTaskStatus[];
      mediaStatusCheck: NotificationTaskStatus[];
      sync: NotificationTaskStatus[];
      diskSpaceCheck: {
        values: Array<"bilirecorder" | "bililiveTools">;
        /** 磁盘空间不足阈值，单位GB */
        threshold: number;
      };
    };
    /** 通知配置项 */
    setting: {
      // 通知类型，支持server酱和邮件
      type?: "server" | "mail" | "tg" | "system" | "ntfy" | "allInOne" | "customHttp";
      // server酱key
      server: NotificationServerConfig;
      mail: NotificationMailConfig;
      tg: NotificationTgConfig;
      ntfy: NotificationNtfyConfig;
      allInOne: NotificationPushAllInAllConfig;
      customHttp: NotificationCustomHttpConfig;
    };
    taskNotificationType: {
      liveStart: AppConfig["notification"]["setting"]["type"];
    };
  };
  // 同步
  sync: {
    baiduPCS: {
      execPath: string;
    };
    aliyunpan: {
      execPath: string;
    };
    alist: {
      apiUrl: string;
      username: string;
      hashPassword: string;
    };
    pan123: {
      clientId: string;
      clientSecret: string;
    };
    syncConfigs: SyncConfig[];
  };
  /** 翻译配置 */
  llmPresets: {
    id: string;
    type: "ollama";
    ollama: {
      server: string;
      model: string;
    };
    /** 函数调用 */
    functionCall: boolean;
    /** 自定义提示词 */
    prompt: string;
    /** 上下文长度 */
    contextLength: number;
    /** 无需翻译的词汇 */
    noTranslate: string;
    /** 创造性 */
    temperature: number;
  }[];
  /** 最大任务数 */
  task: {
    ffmpegMaxNum: number;
    douyuDownloadMaxNum: number;
    biliUploadMaxNum: number;
    biliDownloadMaxNum: number;
    syncMaxNum: number;
  };
  /** 上传配置 */
  biliUpload: {
    /** 线路 */
    line: UploadLine;
    /** 上传重试次数 */
    retryTimes: number;
    /** 上传超时时间 */
    retryDelay: number;
    /** 并发 */
    concurrency: number;
    /** 上传限速 */
    limitRate: number;
    /** 检查稿件间隔 */
    checkInterval: number;
    /** 账号授权自动更新 */
    accountAutoCheck: boolean;
    /** 使用必剪api */
    useBCutAPI: boolean;
    /** 上传分p持久化 */
    useUploadPartPersistence: boolean;
  };
  /** 录制配置 */
  recorder: GlobalRecorder;
  /** 直播间管理 */
  recorders: Recorder[];
  // 视频订阅
  video: {
    /** 订阅间隔 */
    subCheckInterval: number;
    /** 保存路径 */
    subSavePath: string;
  };
}

export interface Video2Mp4Options {
  saveRadio: 1 | 2; // 1：保存到原始文件夹，2：保存到特定文件夹
  saveOriginPath: boolean;
  savePath: string;

  override?: boolean; // 覆盖已存在的文件
  removeOrigin: boolean; // 完成后移除源文件
}

export interface VideoMergeOptions {
  output?: string;
  removeOrigin: boolean; // 完成后移除源文件
  saveOriginPath: boolean; // 保存到原始文件夹
  keepFirstVideoMeta: boolean; // 保留第一个视频元数据
}

export interface File {
  path: string; // /Users/xxx/Downloads/aaa.mp4
  filename: string; // aaa.mp4
  name: string; // aaa
  ext: string; // .mp4
  dir: string; // /Users/xxx/Downloads
}

export interface Progress {
  frames: number;
  currentFps: number;
  currentKbps: number;
  targetSize: number;
  timemark: string;
  percentage: number;
  percent?: number;
}

// export interface OpenDialogOptions extends ElectronOpenDialogOptions {
//   multi?: boolean;
// }
export type audioCodec = "copy" | "aac" | "ac3" | "flac" | "libopus" | "libmp3lame";
export type VideoCodec =
  | "copy"
  | "libx264"
  | "h264_qsv"
  | "h264_nvenc"
  | "h264_amf"
  | "libx265"
  | "hevc_qsv"
  | "hevc_nvenc"
  | "hevc_amf"
  | "libsvtav1"
  | "av1_qsv"
  | "av1_nvenc"
  | "av1_amf";
export interface FfmpegOptions {
  encoder: VideoCodec;
  bitrateControl?: "CRF" | "ABR" | "CBR" | "VBR" | "CQ" | "ICQ";
  crf?: number;
  bitrate?: number;
  audioCodec?: audioCodec;
  preset?:
    | "ultrafast"
    | "superfast"
    | "veryfast"
    | "faster"
    | "fast"
    | "medium"
    | "slow"
    | "slower"
    | "veryslow"
    | "placebo"
    | "0"
    | "1"
    | "2"
    | "3"
    | "4"
    | "5"
    | "6"
    | "7"
    | "8"
    | "9"
    | "10"
    | "11"
    | "12"
    | "13"
    | "p1"
    | "p2"
    | "p3"
    | "p4"
    | "p5"
    | "p6"
    | "p7"
    | "balanced"
    | "speed"
    | "quality"
    | "high_quality";
  /** 支持硬件解码 */
  decode?: boolean;
  /** 是否重缩放分辨率 */
  resetResolution?: boolean;
  /** 重缩放的分辨率 */
  resolutionWidth?: number;
  resolutionHeight?: number;
  /** 额外输出参数 */
  extraOptions?: string;
  /** 视频滤镜参数 */
  vf?: string;
  /** 10bit支持 */
  bit10?: boolean;
  /** 开始时间 */
  ss?: number | string;
  /** 结束时间 */
  to?: number | string;
  /** 缩放算法 */
  swsFlags?: string;
  /** 缩放方式，控制先缩放后渲染还是先渲染后缩放 */
  scaleMethod?: "auto" | "before" | "after";
  forceOriginalAspectRatio?: "auto" | "decrease" | "increase";
  /** 是否支持硬件scale过滤器 */
  hardwareScaleFilter?: boolean;
  /** 编码线程数 */
  encoderThreads?: number;
  /** 添加时间戳 */
  addTimestamp?: boolean;
  /** 时间戳x轴坐标 */
  timestampX?: number;
  /** 时间戳y轴坐标 */
  timestampY?: number;
  /** 时间戳字体大小 */
  timestampFontSize?: number;
  /** 时间戳颜色 */
  timestampFontColor?: string;
  /** 时间戳内容格式 */
  timestampFormat?: string;
  /** 时间戳额外参数 */
  timestampExtra?: string;
  /** 时间戳跟随弹幕字体 */
  timestampFollowDanmu?: boolean;
  /** pk优化 */
  pkOptimize?: boolean;
}

export interface BiliupConfig {
  /** 标题,稿件标题限制80字，去除前后空格 */
  title: string;
  /** 简介，去除前后空格，最多250 */
  desc?: string;
  dolby: 0 | 1; // 杜比
  hires: 0 | 1; // Hi-Res
  copyright: 1 | 2; // 1：自制，2：转载
  tag: string[]; // 标签，不能为空，不能超过10个，调用接口验证
  tid: number; // 174 投稿分区
  source?: string; // 转载来源
  dynamic?: string; // 空间动态
  /** 封面，可能为文件名也有可能是绝对路径 */
  cover?: string; // 封面
  noReprint?: 0 | 1; // 自制声明 0: 允许转载，1：禁止转载
  openElec?: 0 | 1; // 充电面板 0：不开启，1：开启
  closeDanmu?: 0 | 1; // 关闭弹幕 0：不关闭，1：关闭
  closeReply?: 0 | 1; // 关闭评论 0：不关闭，1：关闭
  /** 开启精选评论 0：开启，1：关闭 */
  selectiionReply?: 0 | 1;
  /** 合集id */
  seasonId?: number | null;
  /** 小节id */
  sectionId?: number;
  /** 创建该预设的uid */
  uid?: number | null;
  /** 是否允许二创：1：允许，-1：不允许 */
  recreate?: 1 | -1;
  /** 是否推送到动态：0：推送，1：不推送 */
  no_disturbance?: 0 | 1;
  /** 是否自动评论 */
  autoComment?: boolean;
  /** 是否评论置顶 */
  commentTop?: boolean;
  /** 评论内容 */
  comment?: string;
  /** 话题id */
  topic_id?: number;
  /** mission_id */
  mission_id?: number;
  /** 话题名称 */
  topic_name?: string | null;
  /** 是否仅自己可见 */
  is_only_self?: 0 | 1;
  /** 新分区 */
  human_type2?: number;
  /** 定时发布：10位秒级时间戳。必须距离提交时间>7200秒 */
  dtime?: number;
}

export type BiliupConfigAppend = Partial<BiliupConfig> & {
  vid: string | number;
};

export interface BiliupPreset {
  id: string;
  name: string;
  config: BiliupConfig;
}

export interface BiliUser {
  mid: number;
  name?: string;
  avatar?: string;
  rawAuth: string;
  cookie: {
    bili_jct: string;
    SESSDATA: string;
    DedeUserID: string;
    [key: string]: any;
  };
  expires: number;
  accessToken: string;
  refreshToken: string;
  platform: "TV";
}

export type HotProgressOptions = {
  width?: number;
  height?: number;
  interval?: number;
  color?: string;
  fillColor?: string;
  /** 视频时长，单位秒 */
  duration?: number;
  /** 视频文件，如果没有传递width和duration，自动计算 */
  videoPath?: string;
};

export type DanmaType = "text" | "sc" | "gift" | "guard" | "unknown";

export interface DanmuItem {
  text?: string;
  ts: number;
  timestamp?: number;
  type: DanmaType;
  user?: string;
  streamer?: string;
  room_id?: string;
  platform?: "bilibili" | "douyu" | "unknown" | string;
  gift_price?: number;
  source?: string;
  p?: string;
  live_start_time?: number;
  live_title?: string;
}
export interface SC extends DanmuItem {
  type: "sc";
  gift_count?: number;
}

export interface Danmu extends DanmuItem {
  type: "text";
}

export interface Gift extends DanmuItem {
  type: "gift";
  gift_name?: string;
  gift_count?: number;
}

export interface Guard extends DanmuItem {
  type: "guard";
  gift_name?: string;
  gift_count?: number;
}

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export interface GlobalConfig {
  videoPresetPath: string;
  danmuPresetPath: string;
  ffmpegPresetPath: string;
  configPath: string;
  logPath: string;
  defaultFfmpegPath: string;
  defaultFfprobePath: string;
  defaultDanmakuFactoryPath: string;
  version: string;
  userDataPath: string;
}
