import { PlatformParser } from "../types.js";
import type { RequestOptions, LiveInfo, SourceInfo, StreamInfo } from "../types.js";
import { ParseError } from "../errors.js";
import { HttpClient } from "../http.js";
import { getLiveInfo, getRoomInfo } from "./api.js";

export class DouyuParser extends PlatformParser<number> {
  readonly platform = "douyu";
  readonly siteURL = "https://www.douyu.com/";

  constructor(options?: RequestOptions) {
    super(options);
    this.httpClient = new HttpClient(options);
  }

  matchURL(url: string): boolean {
    return /douyu\.com/.test(url);
  }

  async extractRoomId(url: string): Promise<string | null> {
    // 支持：https://www.douyu.com/123456
    url = url.trim();

    // 从 URL 参数中获取 rid
    try {
      const urlObj = new URL(url);
      const rid = urlObj.searchParams.get("rid");
      if (rid) {
        return rid;
      }
    } catch {
      // URL 解析失败，继续尝试其他方法
    }

    // 尝试从页面解析房间 ID
    try {
      const html = await this.httpClient.getText(url);

      const matchedRoomId = html.match(/\\"room_id\\":\s*(\d+)/)?.[1];
      if (matchedRoomId) {
        return matchedRoomId;
      }

      // 从页面脚本中提取 room_id
      const matched = html.match(/\$ROOM\.room_id.?=(.*?);/);
      if (matched) {
        const roomId = matched[1].trim();
        if (roomId) return roomId;
      }

      // 从 canonical link 中提取 roomId
      const canonicalLink = html.match(/<link rel="canonical" href="(.*?)"/);
      if (canonicalLink) {
        const canonicalUrl = canonicalLink[1];
        const roomId = canonicalUrl.split("/").pop();
        if (roomId) return roomId;
      }
    } catch (error) {
      throw new ParseError(`无法从 URL 提取房间 ID: ${(error as Error).message}`, this.platform);
    }

    throw new ParseError(`无法从 URL 提取房间 ID: ${url}`, this.platform);
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
      const roomInfo = await getRoomInfo(this.httpClient, Number(roomId));
      const room = roomInfo.room;

      const liveStartTime = new Date(room.show_time * 1000);

      return {
        platform: this.platform,
        roomId,
        living: room.status === "1" && room.videoLoop !== 1,
        title: room.room_name,
        owner: room.nickname,
        avatar: room.avatar.big,
        cover: room.room_pic,
        liveStartTime,
        raw: mergedOpts.raw ? roomInfo : undefined,
      };
    } catch (error) {
      throw new ParseError(`获取直播间信息失败: ${(error as Error).message}`, this.platform);
    }
  }

  async getStreams(
    roomId: string,
    opts: { raw?: boolean; onlyAudio?: boolean; cdn?: string; rate?: number } = {},
  ): Promise<SourceInfo<number>[]> {
    const mergedOpts = {
      raw: false,
      onlyAudio: false,
      cdn: undefined,
      rate: 0,
      ...opts,
    };

    try {
      // 获取直播信息（包含流地址）
      const liveInfo = await getLiveInfo(this.httpClient, {
        channelId: roomId,
        cdn: mergedOpts.cdn,
        rate: mergedOpts.rate ?? 0,
        onlyAudio: mergedOpts.onlyAudio,
      });

      if (!liveInfo.living) {
        return [];
      }

      const sources: SourceInfo<number>[] = [];

      // 如果没有获取到任何流，但有当前流，至少返回当前流
      if (sources.length === 0 && liveInfo.currentStream) {
        sources.push({
          name: "默认线路",
          streams: [
            {
              url: liveInfo.currentStream.url,
              quality: liveInfo.currentStream.rate,
              qualityDesc: liveInfo.currentStream.name,
              format: "flv",
              onlyAudio: liveInfo.currentStream.onlyAudio,
            },
          ],
          cdn: liveInfo.currentStream.source,
        });
      }

      return sources;
    } catch (error) {
      throw new ParseError(`获取流地址失败: ${(error as Error).message}`, this.platform);
    }
  }
}
