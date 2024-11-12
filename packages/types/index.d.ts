// @ts-ignore
import type { Line as UploadLine } from "@renmu/bili-api";

// 弹幕配置
export type DanmuConfig = {
  resolution: [number, number];
  scrolltime: number;
  fixtime: number;
  density: number;
  customDensity: number;
  fontname: string;
  fontsize: number;
  /**   百分制下的透明度 */
  opacity100: number;
  outline: number;
  shadow: number;
  displayarea: number;
  scrollarea: number;
  bold: boolean;
  showusernames: boolean;
  saveblocked: boolean;
  showmsgbox: boolean;
  msgboxsize: [number, number];
  msgboxpos: [number, number];
  msgboxfontsize: number;
  msgboxduration: number;
  giftminprice: number;
  blockmode: ("R2L" | "L2R" | "TOP" | "BOTTOM" | "SPECIAL" | "COLOR" | "REPEAT")[];
  statmode: ("TABLE" | "HISTOGRAM")[];
  resolutionResponsive: false;
  blacklist: string;
  timeshift: number;
};

// 弹幕预设配置
export type DanmuPreset = {
  id: string;
  name: string;
  config: DanmuConfig;
};

// 通用预设
export type CommonPreset<T> = {
  id: string;
  name: string;
  config: T;
};

// ffmpeg预设配置
export type FfmpegPreset = CommonPreset<FfmpegOptions>;

type CommonRoomConfig = {
  open: boolean;
  minSize: number;
  /** 视频标题 */
  title: string;
  /** 使用视频文件名作为标题 */
  useVideoAsTitle?: boolean;
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
  /** 压制完成后删除文件 */
  removeOriginAfterConvert?: boolean;
  /** 上传完成后删除文件 */
  removeOriginAfterUpload?: boolean;
  /** 不压制后处理 */
  noConvertHandleVideo?: boolean;
  /** 限制只在某一段时间上传 */
  limitUploadTime?: boolean;
  /** 允许上传处理时间 */
  uploadHandleTime: [string, string];

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
    /** 完成后打开文件夹 */
    openFolder: boolean;
    /** 完成后自动上传 */
    autoUpload: boolean;
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
    /** 完成后打开文件夹 */
    openFolder: boolean;
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
  };
  videoMerge: {
    /** 保存到原始文件夹 */
    saveOriginPath: boolean;
    /** 完成后移除源文件 */
    removeOrigin: boolean;
  };
  /** 下载页 */
  download: {
    /** 保存路径 */
    savePath: string;
    /** 弹幕参数 */
    danmu: "none" | "xml" | "ass";
    /** 斗鱼下载分辨率 */
    douyuResolution: "highest" | string;
    /** 下载时覆盖已有文件 */
    override: boolean;
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
}
export type Theme = "system" | "light" | "dark";

interface BaseRecordr {
  /** 画质 */
  quality: "lowest" | "low" | "medium" | "high" | "highest";
  /** 线路 */
  line?: string; // "auto" | "tct-h5" | "hw-h5"
  /** 录制弹幕 */
  disableProvideCommentsWhenRecording?: boolean;
  /** 保存礼物弹幕 */
  saveGiftDanma?: boolean;
  /** 保存高能弹幕 */
  saveSCDanma?: boolean;
  /**分段时长，单位分钟 */
  segment?: number;
  /** 账号 */
  uid?: string;
}

export interface GlobalRecorder extends BaseRecordr {
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
}

export interface LocalRecordr extends BaseRecordr {
  providerId: string;
  id: string;
  channelId: string;
  remarks?: string;
  streamPriorities: any[];
  sourcePriorities: any[];
  extra?: { createTimestamp?: number };
  disableAutoCheck?: boolean;
  /** 发送至webhook */
  sendToWebhook?: boolean;
  // 不跟随全局配置字段
  noGlobalFollowFields?: (keyof BaseRecordr)[];
}

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
    };
    /** 通知配置项 */
    setting: {
      // 通知类型，支持server酱和邮件
      type?: "server" | "mail" | "tg" | "system" | "ntfy";
      // server酱key
      server: NotificationServerConfig;
      mail: NotificationMailConfig;
      tg: NotificationTgConfig;
      ntfy: NotificationNtfyConfig;
    };
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
    /** 检查稿件间隔 */
    checkInterval: number;
  };
  /** 录制配置 */
  recorder: GlobalRecorder;
  /** 直播间管理 */
  recorders: LocalRecordr[];
}

// export type LogLevel = ElectronLoGLevel;

export interface DanmuOptions {
  saveRadio?: 1 | 2; // 1：保存到原始文件夹，2：保存到特定文件夹
  savePath?: string;

  removeOrigin: boolean; // 完成后移除源文件
  copyInput?: boolean; // 复制源文件到临时文件夹
}
export interface Video2Mp4Options {
  saveRadio: 1 | 2; // 1：保存到原始文件夹，2：保存到特定文件夹
  saveOriginPath: boolean;
  savePath: string;

  override?: boolean; // 覆盖已存在的文件
  removeOrigin: boolean; // 完成后移除源文件
}

export interface VideoMergeOptions {
  savePath: string;

  removeOrigin: boolean; // 完成后移除源文件
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
    | "p7";
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

export type hotProgressOptions = {
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
}

export interface Danmu extends DanmuItem {
  type: "text";
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
}
