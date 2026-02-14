/**
 * HuYa 平台解析器（骨架实现）
 */

import { PlatformParser } from "../types.js";
import type { RequestOptions, LiveInfo, SourceInfo } from "../types.js";
import { ParseError } from "../errors.js";
import { HttpClient } from "../http.js";

export class HuyaParser extends PlatformParser<number> {
  readonly platform = "huya";
  readonly siteURL = "https://www.huya.com/";

  constructor(options?: RequestOptions) {
    super(options);
    this.httpClient = new HttpClient(options);
  }

  matchURL(url: string): boolean {
    return /huya\.com/.test(url);
  }

  extractRoomId(url: string): string {
    // 支持：https://www.huya.com/123456
    const match = url.match(/huya\.com\/(\w+)/);
    if (match) return match[1];

    return url;
  }

  async getLiveInfo(roomId: string, opts?: RequestOptions): Promise<LiveInfo> {
    const mergedOpts = this.mergeOptions(opts);

    // TODO: 实现 HuYa API 调用
    // 支持多 API 模式：auto/web/mp/wup
    // 保留原生 bitRate 值
    throw new ParseError("HuYa 平台解析器尚未实现", this.platform);
  }

  async getStreams(roomId: string, opts?: RequestOptions): Promise<SourceInfo<number>[]> {
    const mergedOpts = this.mergeOptions(opts);

    // TODO: 实现流地址获取
    throw new ParseError("HuYa 平台解析器尚未实现", this.platform);
  }
}
