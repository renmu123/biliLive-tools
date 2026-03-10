/**
 * 小红书 API 层
 */

import type { HttpClient } from "../http.js";
import { ParseError } from "../errors.js";
import type { InitialState, LiveInfoResponse } from "./types.js";

/**
 * 获取小红书直播流信息
 */
export async function getXhsStreamUrl(http: HttpClient, roomId: string): Promise<LiveInfoResponse> {
  const headers = {
    "User-Agent": "ios/7.830 (ios 17.0; ; iPhone 15 (A2846/A3089/A3090/A3092))",
    "xy-common-params": "platform=iOS&sid=session.1722166379345546829388",
    referer: "https://app.xhs.cn/",
  };

  // 获取页面 HTML
  const html = await http.getText(`https://www.xiaohongshu.com/livestream/${roomId}`, { headers });

  // 提取初始状态数据
  const matchData = html.match(/<script>window\.__INITIAL_STATE__=(.*?)<\/script>/);
  if (!matchData) {
    throw new ParseError("无法找到初始状态数据", "xhs");
  }

  try {
    const jsonStr = matchData[1].replace(/undefined/g, "null");
    const jsonData: InitialState = JSON.parse(jsonStr);

    if (jsonData.liveStream) {
      const streamData = jsonData.liveStream;

      if (streamData.liveStatus === "success" && streamData.roomData) {
        const roomInfo = streamData.roomData.roomInfo;
        const title = roomInfo.roomTitle;

        // 排除回放
        if (title && !title.includes("回放")) {
          const anchorName = streamData.roomData.hostInfo.nickName;
          const avatar = streamData.roomData.hostInfo.avatar;
          const title = roomInfo.roomTitle;
          const roomId = roomInfo.roomId;
          const roomCover = roomInfo.roomCover;

          const finalFlvUrl = `http://live-source-play.xhscdn.com/live/${roomId}.flv`;
          const m3u8Url = `http://live-source-play.xhscdn.com/live/${roomId}.m3u8`;

          return {
            anchor_name: anchorName || "",
            avatar,
            is_live: true,
            title,
            flv_url: finalFlvUrl,
            m3u8_url: m3u8Url,
            cover: roomCover,
          };
        }
      }
    }
  } catch (error) {
    throw new ParseError(`解析直播信息失败: ${(error as Error).message}`, "xhs");
  }

  return {
    is_live: false,
  };
}
