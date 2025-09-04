import { Emitter } from "mitt";
import { ChannelId, Message, Quality } from "./common.js";
import { RecorderProvider } from "./manager.js";
import { AnyObject, PickRequired, UnknownObject } from "./utils.js";

type FormatName = "auto" | "flv" | "hls" | "fmp4" | "flv_only" | "hls_only" | "fmp4_only";
type CodecName = "auto" | "avc" | "hevc" | "avc_only" | "hevc_only";

export interface RecorderCreateOpts<E extends AnyObject = UnknownObject> {
  providerId: RecorderProvider<E>["id"];
  channelId: ChannelId;
  // 预期上它应该是一个系统内的唯一 id，用于操作时的目标指定
  id?: string;
  // 备注，可填入频道名、主播名等
  remarks?: string;
  // 为 true 时 manager 将跳过自动检查
  disableAutoCheck?: boolean;
  // 用于性能优化的选项，为 true 时禁用弹幕录制
  disableProvideCommentsWhenRecording?: boolean;
  // 该项为用户配置，交给 recorder 作为决定使用哪个视频流的依据
  quality: Quality;
  // 该项为用户配置，不同画质的视频流的优先级，如果设置了此项，将优先根据此决定使用哪个流，除非所有的指定流无效
  streamPriorities: string[];
  // 该项为用户配置，不同源（CDN）的优先级，如果设置了此项，将优先根据此决定使用哪个源，除非所有的指定源无效
  sourcePriorities: string[];
  formatPriorities?: Array<"flv" | "hls">;
  // 指定cdn
  source?: string;
  // 该项为用户配置，指定录制的片段时长，单位为秒，如果设置了此项，将按此时长切片录制
  segment?: number;
  // 保存礼物弹幕
  saveGiftDanma?: boolean;
  // 保存高能弹幕
  saveSCDanma?: boolean;
  /** 保存封面 */
  saveCover?: boolean;
  /** 身份验证 */
  auth?: string;
  /** cookie所有者uid,B站弹幕录制 */
  uid?: number;
  /** 画质匹配重试次数 */
  qualityRetry?: number;
  /** 抖音是否使用双屏直播流，开启后如果是双屏直播，那么就使用拼接的流，默认为true */
  doubleScreen?: boolean;
  /** B站是否使用m3u8代理 */
  useM3U8Proxy?: boolean;
  /**B站m3u8代理url */
  m3u8ProxyUrl?: string;
  /** 流格式 */
  formatName?: FormatName;
  /** 流编码 */
  codecName?: CodecName;
  /** 选择使用的api，虎牙支持 */
  api?: "auto" | "web" | "mp";
  /** 标题关键词，如果直播间标题包含这些关键词，则不会自动录制（仅对斗鱼有效），多个关键词用英文逗号分隔 */
  titleKeywords?: string;
  /** 用于指定录制文件格式，auto时，分段使用ts，不分段使用mp4 */
  videoFormat?: "auto" | "ts" | "mkv";
  /** 录制类型 */
  recorderType?: "ffmpeg" | "mesio";
  /** 流格式优先级 */
  formatriorities?: Array<"flv" | "hls">;
  /** 只录制音频 */
  onlyAudio?: boolean;
  /** 监控时间段 */
  handleTime?: [string | null, string | null];
  /** 控制弹幕是否使用服务端时间戳 */
  useServerTimestamp?: boolean;
  // 可持久化的额外字段，让 provider、manager 开发者可以有更多 customize 的空间
  extra?: Partial<E>;
}

export type SerializedRecorder<E extends AnyObject> = PickRequired<RecorderCreateOpts<E>, "id"> &
  Pick<
    Recorder<E>,
    | "id"
    | "channelId"
    | "remarks"
    | "disableAutoCheck"
    | "quality"
    | "streamPriorities"
    | "sourcePriorities"
    | "extra"
    | "segment"
    | "saveSCDanma"
    | "saveCover"
    | "saveGiftDanma"
    | "disableProvideCommentsWhenRecording"
    | "liveInfo"
    | "uid"
    | "titleKeywords"
    // | "recordHandle"
  >;

export type RecorderState = "idle" | "recording" | "stopping-record";
export type Progress = { time: string | null };

export interface RecordHandle {
  // 表示这一次录制操作的唯一 id
  id: string;
  stream: string;
  source: string;
  url: string;
  ffmpegArgs?: string[];
  progress?: Progress;

  savePath: string;

  stop: (this: RecordHandle, reason?: string, tempStopIntervalCheck?: boolean) => Promise<void>;
  cut: (this: RecordHandle) => Promise<void>;
}

export interface DebugLog {
  type: string | "common" | "ffmpeg" | "error";
  text: string;
}

export type GetSavePath = (data: { owner: string; title: string; startTime?: number }) => string;

export interface Recorder<E extends AnyObject = UnknownObject>
  extends Emitter<{
      RecordStart: RecordHandle;
      RecordSegment?: RecordHandle;
      videoFileCreated: { filename: string; cover?: string };
      videoFileCompleted: { filename: string };
      progress: Progress;
      RecordStop: { recordHandle: RecordHandle; reason?: string };
      Updated: (string | keyof Recorder)[];
      Message: Message;
      DebugLog: DebugLog;
    }>,
    RecorderCreateOpts<E> {
  // 这里 id 设计成 string 而不是 string | number，主要是为了方便调用方少做一些类型处理，
  // 如果确实需要 number 类型的 id，可以先转为 string 的，在查询、存储时转回 number。
  id: string;
  extra: Partial<E>;
  // 该项由 recorder 自身控制，决定有哪些可用的视频流
  availableStreams: string[];
  // 该项由 recorder 自身控制，决定有哪些可用的源（CDN）
  availableSources: string[];
  usedStream?: string;
  usedSource?: string;
  state: RecorderState;
  // 默认画质重试次数
  qualityMaxRetry: number;
  // 画质重试次数上限
  qualityRetry: number;
  // B站弹幕录制，cookie拥有者的uid
  uid?: number;
  liveInfo?: {
    living: boolean;
    owner: string;
    title: string;
    startTime?: Date;
    avatar: string;
    cover: string;
    liveId?: string;
  };
  tempStopIntervalCheck?: boolean;
  // TODO: 随机的一条近期弹幕 / 评论，这或许应该放在 manager 层做，上面再加个频率统计之类的
  // recently comment: { time, text, ... }

  getChannelURL: (this: Recorder<E>) => string;

  // TODO: 这个接口以后可能会拆成两个，因为要考虑有些网站可能会提供批量检查直播状态的接口，比如斗鱼
  checkLiveStatusAndRecord: (
    this: Recorder<E>,
    opts: {
      getSavePath: GetSavePath;
      banLiveId?: string;
      isManualStart?: boolean;
    },
  ) => Promise<RecordHandle | null>;
  // 正在进行的录制的操作接口
  recordHandle?: RecordHandle;

  // 提取需要序列化存储的数据到扁平的 json 数据结构
  toJSON: (this: Recorder<E>) => SerializedRecorder<E>;

  getLiveInfo: (this: Recorder<E>) => Promise<{
    owner: string;
    title: string;
    avatar: string;
    cover: string;
    channelId: ChannelId;
    living: boolean;
    startTime: Date;
  }>;
  getStream: (this: Recorder<E>) => Promise<{
    source: string;
    name: string;
    url: string;
  }>;
}
