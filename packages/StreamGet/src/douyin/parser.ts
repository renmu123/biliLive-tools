/**
 * DouYin 平台解析器（骨架实现）
 */

import { PlatformParser } from "../types.js";
import type { RequestOptions, LiveInfo, SourceInfo } from "../types.js";
import { ParseError } from "../errors.js";

export type DouyinQualityKey = "origin" | "uhd" | "hd" | "sd" | "ld" | "ao" | "real_origin";

export class DouyinParser extends PlatformParser<DouyinQualityKey> {
  readonly platform = "douyin";
  readonly siteURL = "https://live.douyin.com/";

  constructor(options?: RequestOptions) {
    super(options);
  }

  matchURL(url: string): boolean {
    return /(live\.)?douyin\.com/.test(url) || /v\.douyin\.com/.test(url);
  }

  extractRoomId(url: string): string {
    // 支持：https://live.douyin.com/123456789
    const match = url.match(/live\.douyin\.com\/(\d+)/);
    if (match) return match[1];

    // 如果是短链接或用户页，需要异步解析
    // TODO: 实现短链接解析
    return url;
  }

  async getLiveInfo(roomId: string, opts?: RequestOptions): Promise<LiveInfo> {
    const mergedOpts = this.mergeOptions(opts);

    // TODO: 实现 DouYin API 调用
    throw new ParseError("DouYin 平台解析器尚未实现", this.platform);
  }

  async getStreams(roomId: string, opts?: RequestOptions): Promise<SourceInfo<DouyinQualityKey>[]> {
    const mergedOpts = this.mergeOptions(opts);

    // TODO: 实现流地址获取
    throw new ParseError("DouYin 平台解析器尚未实现", this.platform);
  }
}
