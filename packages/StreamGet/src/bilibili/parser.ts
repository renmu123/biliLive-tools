/**
 * Bilibili 平台解析器
 */
import path from "node:path";
import { PlatformParser } from "../types.js";
import type { RequestOptions, LiveInfo, SourceInfo, StreamInfo } from "../types.js";
import { ParseError } from "../errors.js";
import { HttpClient } from "../http.js";
import { getRoomInit, getRoomBaseInfo, getStatusInfoByUIDs, getRoomPlayInfo } from "./api.js";

export class BilibiliParser extends PlatformParser<number> {
  readonly platform = "bilibili";
  readonly siteURL = "https://live.bilibili.com/";

  constructor(options?: RequestOptions) {
    super(options);
    this.httpClient = new HttpClient(options);
  }

  matchURL(url: string): boolean {
    return /live\.bilibili\.com/.test(url);
  }

  async extractRoomId(url: string): Promise<string | null> {
    if (!this.matchURL(url)) return null;
    const id = path.basename(new URL(url).pathname);
    const data = await getRoomInit(this.httpClient, id);

    return String(data.room_id);
  }

  async getLiveInfo(roomId: string, opts?: RequestOptions): Promise<LiveInfo> {
    const mergedOpts = this.mergeOptions(opts);
    const roomIdNum = Number(roomId);

    try {
      // 获取房间初始信息
      const roomInit = await getRoomInit(this.httpClient, roomIdNum);

      // 获取详细状态信息
      const statusInfo = await getStatusInfoByUIDs(this.httpClient, [roomInit.uid]);
      const status = statusInfo[roomInit.uid];

      if (status) {
        const liveStartTime = new Date(status.live_time * 1000);
        return {
          platform: this.platform,
          roomId,
          living: roomInit.live_status === 1 && !roomInit.encrypted,
          title: status.title,
          owner: status.uname,
          avatar: status.face,
          cover: status.cover_from_user,
          liveStartTime,
          // 平台特定字段
          uid: roomInit.uid,
          shortId: roomInit.short_id,
          online: status.online,
        };
      } else {
        // 如果获取不到状态信息，尝试使用 getRoomBaseInfo
        const baseInfo = await getRoomBaseInfo(this.httpClient, roomIdNum);
        const roomData = baseInfo[roomIdNum];

        const liveStartTime = new Date(roomData.live_time);
        return {
          platform: this.platform,
          roomId,
          living: roomInit.live_status === 1 && !roomInit.encrypted,
          title: roomData.title,
          owner: roomData.uname,
          avatar: "",
          cover: roomData.cover || roomData.keyframe,
          liveStartTime,
          // 平台特定字段
          uid: roomInit.uid,
          shortId: roomInit.short_id,
          areaName: roomData.area_name,
          areaId: roomData.area_id,
        };
      }
    } catch (error) {
      throw new ParseError(`获取直播间信息失败: ${(error as Error).message}`, this.platform);
    }
  }

  async getStreams(roomId: string, opts?: RequestOptions): Promise<SourceInfo<number>[]> {
    const mergedOpts = this.mergeOptions(opts);
    const roomIdNum = Number(roomId);

    try {
      // 请求最高画质以获取所有可用选项
      const res = await getRoomPlayInfo(this.httpClient, roomIdNum, {
        qn: 30000,
        cookie: mergedOpts.cookie,
        onlyAudio: mergedOpts.onlyAudio,
      });

      const sources: SourceInfo<number>[] = [];
      const playurl = res.playurl_info.playurl;

      // 遍历所有协议、格式、编码组合
      for (const stream of playurl.stream) {
        for (const format of stream.format) {
          for (const codec of format.codec) {
            // 为每个 URL 信息创建流
            codec.url_info.forEach((urlInfo, idx) => {
              const url = urlInfo.host + codec.base_url + urlInfo.extra;

              // 为每个支持的画质创建流信息
              codec.accept_qn.forEach((qn) => {
                const qnDesc = playurl.g_qn_desc.find((desc) => desc.qn === qn);
                if (!qnDesc) return;

                const streamInfo: StreamInfo<number> = {
                  url,
                  quality: qn,
                  qualityDesc: qnDesc.desc,
                  format: format.format_name,
                  // 平台特定字段
                  protocol: stream.protocol_name,
                  codec: codec.codec_name,
                  currentQn: codec.current_qn,
                };

                // 按 CDN 线路分组
                const sourceName = idx === 0 ? "主线" : `备线${idx}`;
                let source = sources.find((s) => s.name === sourceName);
                if (!source) {
                  source = {
                    name: sourceName,
                    streams: [],
                  };
                  sources.push(source);
                }

                source.streams.push(streamInfo);
              });
            });
          }
        }
      }

      return sources;
    } catch (error) {
      throw new ParseError(`获取流地址失败: ${(error as Error).message}`, this.platform);
    }
  }
}

export default BilibiliParser;
