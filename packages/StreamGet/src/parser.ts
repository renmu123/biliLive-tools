/**
 * 通用解析器（自动检测平台）
 */

import { registry } from "./registry.js";
import { UnsupportedPlatformError } from "./errors.js";
import type { RequestOptions, ParseResult, LiveInfo, SourceInfo } from "./types.js";

export class StreamParser {
  constructor(private options?: RequestOptions) {}

  /**
   * 通用解析：自动检测平台并解析
   */
  async parse(urlOrRoomId: string, opts?: RequestOptions): Promise<ParseResult> {
    const platform = registry.detectPlatform(urlOrRoomId);

    if (!platform) {
      throw new UnsupportedPlatformError(urlOrRoomId);
    }

    const parser = registry.create(platform, { ...this.options, ...opts });
    if (!parser) {
      throw new UnsupportedPlatformError(urlOrRoomId);
    }

    return parser.parse(urlOrRoomId, opts);
  }

  /**
   * 检测平台
   */
  detectPlatform(url: string): string | null {
    return registry.detectPlatform(url);
  }

  /**
   * 获取直播信息（需要先指定平台）
   */
  async getLiveInfo(platform: string, roomId: string, opts?: RequestOptions): Promise<LiveInfo> {
    const parser = registry.create(platform, { ...this.options, ...opts });
    if (!parser) {
      throw new UnsupportedPlatformError(platform);
    }
    return parser.getLiveInfo(roomId, opts);
  }

  /**
   * 获取流地址（需要先指定平台）
   */
  async getStreams(platform: string, roomId: string, opts?: RequestOptions): Promise<SourceInfo[]> {
    const parser = registry.create(platform, { ...this.options, ...opts });
    if (!parser) {
      throw new UnsupportedPlatformError(platform);
    }
    return parser.getStreams(roomId, opts);
  }

  /**
   * 列出所有支持的平台
   */
  listPlatforms(): string[] {
    return registry.list();
  }
}
