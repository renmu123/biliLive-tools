import { PlatformParser } from "../types.js";
import type { RequestOptions, LiveInfo, SourceInfo } from "../types.js";
import { ParseError } from "../errors.js";
import { HttpClient } from "../http.js";
import { fetchKuaishouPage, parseInitialState, extractStreams } from "./api.js";

export class KuaishouParser extends PlatformParser<any> {
  readonly platform = "kuaishou";
  readonly siteURL = "https://live.kuaishou.com/";
  static readonly matchPattern = /kuaishou\.com/;

  constructor(options?: RequestOptions) {
    super(options);
    this.httpClient = new HttpClient(options);
  }

  matchURL(url: string): boolean {
    return KuaishouParser.matchPattern.test(url);
  }

  async extractRoomId(url: string): Promise<string> {
    url = url.trim();

    if (!KuaishouParser.matchPattern.test(url)) {
      throw new ParseError("不是快手直播链接", this.platform);
    }

    try {
      const urlObj = new URL(url);
      const match = urlObj.pathname.match(/^\/u(?:ser)?\/([^/]+)/);
      if (!match || !match[1]) {
        throw new ParseError("无法提取 userId", this.platform);
      }
      return decodeURIComponent(match[1]);
    } catch (e) {
      if (e instanceof ParseError) throw e;
      throw new ParseError(`URL 解析失败: ${(e as Error).message}`, this.platform);
    }
  }

  async getRoomInfo(
    userId: string,
    opts?: RequestOptions,
  ): Promise<LiveInfo> {
    try {
      const liveroom = await this._fetchLiveroom(userId, opts);

      if (!liveroom?.playList?.[0]) {
        return {
          platform: this.platform,
          roomId: userId,
          living: false,
          title: "",
          owner: "",
          avatar: "",
          cover: "",
        };
      }

      const first = liveroom.playList[0];
      const author = first.author || {};
      const liveStream = first.liveStream || {};
      // 快手 SSR 中 title 可能在 caption、name 或 author.description 字段
      const title = liveStream.caption || liveStream.name || author.description || "";
      return {
        platform: this.platform,
        roomId: userId,
        living: !!first.isLiving,
        title,
        owner: author.name || "",
        avatar: author.avatar || "",
        cover: liveStream.poster || "",
        raw: opts?.raw ? liveroom : undefined,
      };
    } catch (error) {
      if (error instanceof ParseError) throw error;
      throw new ParseError(
        `获取直播间信息失败: ${(error as Error).message}`,
        this.platform,
      );
    }
  }

  async getStreams(
    userId: string,
    opts?: RequestOptions,
  ): Promise<SourceInfo<any>[]> {
    try {
      const liveroom = await this._fetchLiveroom(userId, opts);
      return extractStreams(liveroom);
    } catch (error) {
      if (error instanceof ParseError) throw error;
      throw new ParseError(
        `获取流地址失败: ${(error as Error).message}`,
        this.platform,
      );
    }
  }

  async _fetchLiveroom(userId: string, _opts?: RequestOptions): Promise<any> {
    const { html } = await fetchKuaishouPage(this.httpClient, userId);
    return parseInitialState(html).liveroom;
  }
}
