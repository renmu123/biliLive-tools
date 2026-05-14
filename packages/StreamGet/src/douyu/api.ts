/**
 * DouYu API 层
 * 基于 DouYuRecorder 的实现迁移
 */

import type { HttpClient } from "../http.js";
import { ParseError, NetworkError } from "../errors.js";
import type {
  RoomInfo,
  LiveInfoResult,
  // SourceProfile,
  // StreamProfile,
} from "./types.js";
import { getH5Play } from "./h5-play.js";
import { getH5PlayV1 } from "./h5-play-v1.js";

/**
 * 对斗鱼 getH5Play 接口的封装
 */
export async function getLiveInfo(
  http: HttpClient,
  opts: {
    channelId: string;
    cdn?: string;
    rate?: number;
    rejectSignFnCache?: boolean;
    onlyAudio?: boolean;
  },
): Promise<LiveInfoResult> {
  try {
    const json = await getH5PlayV1(http, opts);

    // 不存在的房间、已被封禁、未开播
    if ([-3, -4, -5].includes(json.error)) {
      return { living: false };
    }

    if (json.error !== 0) {
      throw new ParseError("Unexpected error code: " + json.error, "douyu");
    }

    const streamUrl = `${json.data.rtmp_url}/${json.data.rtmp_live}`;
    let cdn = json.data.rtmp_cdn;
    let onlyAudio = false;

    try {
      const url = new URL(streamUrl);
      cdn = url.searchParams.get("fcdn") ?? "";
      if (url.searchParams.get("only-audio") === "1") {
        onlyAudio = true;
      }
    } catch (error) {
      console.warn("解析 rtmp_url 失败", error);
    }

    return {
      living: true,
      sources: json.data.cdnsWithName,
      streams: json.data.multirates,
      isSupportRateSwitch: json.data.rateSwitch === 1,
      isOriginalStream: json.data.rateSwitch !== 1,
      currentStream: {
        onlyAudio,
        source: cdn,
        name:
          json.data.rateSwitch !== 1
            ? "原画"
            : (json.data.multirates.find(({ rate }) => rate === json.data.rate)?.name ?? "未知"),
        rate: json.data.rate,
        url: streamUrl,
      },
    };
  } catch (error) {
    if (error instanceof ParseError) {
      throw error;
    }
    throw new NetworkError(`请求失败: ${(error as Error).message}`, "douyu");
  }
}

/**
 * 获取直播间相关信息
 */
export async function getRoomInfo(http: HttpClient, roomId: number): Promise<RoomInfo> {
  try {
    const response = await http.get<RoomInfo>(`https://www.douyu.com/betard/${roomId}`);
    return response;
  } catch (error) {
    throw new NetworkError(`获取房间信息失败: ${(error as Error).message}`, "douyu");
  }
}
