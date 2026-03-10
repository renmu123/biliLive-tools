import { PlatformParser } from "../types.js";
import type { RequestOptions, LiveInfo, SourceInfo, StreamInfo } from "../types.js";
import { ParseError } from "../errors.js";
import { HttpClient } from "../http.js";
import { getXhsStreamUrl } from "./api.js";

export default class XhsParser extends PlatformParser<string> {
  readonly platform = "xhs";
  readonly siteURL = "https://www.xiaohongshu.com/";
  static readonly matchPattern = /xiaohongshu\.com|xhslink\.com/;

  constructor(options?: RequestOptions) {
    super(options);
    this.httpClient = new HttpClient(options);
  }

  matchURL(url: string): boolean {
    return XhsParser.matchPattern.test(url);
  }

  async extractUrl(url: string): Promise<{ roomId: string | null; userId: string | null }> {
    // 小红书使用完整 URL 作为房间 ID
    url = url.trim();

    // 如果是短链接，需要先解析
    if (url.includes("xhslink.com")) {
      try {
        // request 会返回重定向后的内容
        const response = await this.httpClient.request(url, {});
        const href = response.headers.location;

        if (!href) {
          throw new ParseError(`无法获取重定向 URL`, this.platform);
        }
        if (Array.isArray(href)) {
          throw new ParseError(`重定向 URL 格式不正确`, this.platform);
        }
        const urlObj = new URL(href);
        const roomId = urlObj.pathname.split("/").pop() || null;
        const userId = urlObj.searchParams.get("host_id") || null;
        return { roomId, userId };
        // 从 HTML 中提取真实 URL
      } catch (error) {
        throw new ParseError(`无法解析短链接: ${(error as Error).message}`, this.platform);
      }
    }

    // 验证是否是有效的小红书 URL
    if (/xiaohongshu\.com/.test(url)) {
      const urlObj = new URL(url);
      const roomId = urlObj.pathname.split("/").pop() || null;
      const userId = urlObj.searchParams.get("host_id") || null;
      return { roomId, userId };
    }

    throw new ParseError(`无法从 URL 提取房间 ID: ${url}`, this.platform);
  }
  async extractRoomId(url: string): Promise<string | null> {
    const { roomId } = await this.extractUrl(url);
    return roomId;
  }
  async extractUserId(url: string): Promise<string | null> {
    const { userId } = await this.extractUrl(url);
    return userId;
  }

  async getLiveInfo(
    roomId: string,
    opts: {
      raw?: boolean;
    } = {},
  ): Promise<LiveInfo> {
    const mergedOpts = {
      raw: false,
      ...opts,
    };

    try {
      const streamInfo = await getXhsStreamUrl(this.httpClient, roomId);

      return {
        platform: this.platform,
        roomId,
        living: streamInfo.is_live,
        title: streamInfo.title || "",
        owner: streamInfo.anchor_name || "",
        avatar: streamInfo.avatar || "",
        cover: streamInfo.cover || "",
        liveStartTime: undefined,
        raw: mergedOpts.raw ? streamInfo : undefined,
      };
    } catch (error) {
      throw new ParseError(`获取直播间信息失败: ${(error as Error).message}`, this.platform);
    }
  }

  async getStreams(
    roomId: string,
    opts: { raw?: boolean; format?: Array<"flv" | "hls"> } = {},
  ): Promise<SourceInfo<string>[]> {
    const mergedOpts = {
      raw: false,
      format: ["flv", "hls"] as Array<"flv" | "hls">,
      ...opts,
    };

    try {
      const streamInfo = await getXhsStreamUrl(this.httpClient, roomId);

      if (!streamInfo.is_live) {
        return [];
      }

      const sources: SourceInfo<string>[] = [];

      // 构建流信息
      const streams: StreamInfo<string>[] = [];

      if (mergedOpts.format.includes("flv") && streamInfo.flv_url) {
        streams.push({
          url: streamInfo.flv_url,
          quality: "原画",
          qualityDesc: "原画",
          format: "flv",
        });
      }

      if (mergedOpts.format.includes("hls") && streamInfo.m3u8_url) {
        streams.push({
          url: streamInfo.m3u8_url,
          quality: "原画",
          qualityDesc: "原画",
          format: "hls",
        });
      }

      // 如果有流，添加到 sources
      if (streams.length > 0) {
        sources.push({
          name: "默认线路",
          streams,
        });
      }

      return sources;
    } catch (error) {
      throw new ParseError(`获取流地址失败: ${(error as Error).message}`, this.platform);
    }
  }
}

export { XhsParser };
