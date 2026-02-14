import { HttpClient } from "./http.js";

/**
 * 核心类型定义
 */

// 代理配置
export interface ProxyConfig {
  uri: string; // 'http://127.0.0.1:7890', 'socks5://127.0.0.1:1080'
  token?: string;
}

// 请求选项
export interface RequestOptions {
  cookie?: string;
  headers?: Record<string, string>;
  timeout?: number;
  proxy?: ProxyConfig | string; // 支持简写为 URI 字符串
  [key: string]: any; // 平台特定选项
}

// 直播信息
export interface LiveInfo {
  platform: string;
  roomId: string;
  living: boolean;
  title: string;
  owner: string;
  avatar?: string;
  cover?: string;
  liveStartTime?: Date;
  raw?: any; // 原始数据，供平台特定字段使用
  [key: string]: any; // 平台特定字段
}

// 流信息（泛型，保留平台原生质量）
export interface StreamInfo<Q = any> {
  url: string;
  quality: Q; // 平台原生质量（Bilibili: qn number, DouYin: key string）
  qualityDesc: string;
  format: string;
  [key: string]: any;
}

// 线路信息
export interface SourceInfo<Q = any> {
  name: string;
  streams: StreamInfo<Q>[];
  [key: string]: any;
}

// 解析结果
export interface ParseResult<Q = any> {
  liveInfo: LiveInfo;
  sources: SourceInfo<Q>[];
}

// 平台解析器抽象类
export abstract class PlatformParser<Q = any> {
  abstract readonly platform: string;
  abstract readonly siteURL: string;

  protected options?: RequestOptions;
  protected httpClient: HttpClient; // 由子类初始化，避免循环依赖

  constructor(options?: RequestOptions) {
    this.options = options;
    this.httpClient = new HttpClient(options);
  }

  abstract matchURL(url: string): boolean;
  abstract extractRoomId(url: string): Promise<string | null>;
  abstract getLiveInfo(roomId: string, opts?: RequestOptions): Promise<LiveInfo>;
  abstract getStreams(roomId: string, opts?: RequestOptions): Promise<SourceInfo<Q>[]>;

  async parse(urlOrRoomId: string, opts?: RequestOptions): Promise<ParseResult<Q>> {
    const roomId = await this.extractRoomId(urlOrRoomId);
    if (!roomId) throw new Error("解析失败");
    const mergedOpts = this.mergeOptions(opts);

    const [liveInfo, sources] = await Promise.all([
      this.getLiveInfo(roomId, mergedOpts),
      this.getStreams(roomId, mergedOpts),
    ]);

    return { liveInfo, sources };
  }

  // 合并选项的辅助方法
  protected mergeOptions(opts?: RequestOptions): RequestOptions {
    return { ...this.options, ...opts };
  }
}
