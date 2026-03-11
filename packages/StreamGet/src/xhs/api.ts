/**
 * 小红书 API 层
 */

import type { HttpClient } from "../http.js";
import { ParseError } from "../errors.js";
import type { InitialState, LiveInfoResponse } from "./types.js";

import { Client } from "xhshow-js";
import cookie from "cookie";

function sign(cookieStr: string, redId: string) {
  const parsed = cookie.parse(cookieStr);
  const a1Value = parsed.a1;
  const webSession = parsed.web_session;
  if (!a1Value || !webSession) {
    throw new ParseError("cookie 中缺少 a1 或 web_session 字段", "xhs");
  }

  const client = new Client();
  const method = "POST";
  const uri = "/api/sns/web/v1/search/usersearch";
  const payload = {
    search_user_request: {
      keyword: redId,
      search_id: "2g39ymjpqpfbtw6glpziw",
      page: 1,
      page_size: 15,
      biz_type: "web_search_user",
      request_id: "1736316032-1773206973040",
    },
  };

  const xs = client.signXS(method, uri, a1Value, "xhs-pc-web", payload);
  const xt = client.getXT();
  const b3TraceId = client.getB3TraceId();
  const xrayTraceId = client.getXrayTraceId();

  const xsCommon = client.signXSCommon({ a1: a1Value, web_session: webSession });

  return {
    "X-s": xs,
    "X-t": String(xt),
    "X-S-Common": xsCommon,
    "x-b3-traceid": b3TraceId,
    "x-xray-traceid": xrayTraceId,
  };
}

/**
 * 用户搜索
 * @param http
 * @param redId
 * @param cookie
 * @returns
 */
export async function userSearch(http: HttpClient, redId: string, cookie: string) {
  const signHeaders = sign(cookie, redId);

  const response = await http.post(
    "https://edith.xiaohongshu.com/api/sns/web/v1/search/usersearch",
    {
      search_user_request: {
        keyword: redId,
        search_id: "2g39ymjpqpfbtw6glpziw",
        page: 1,
        page_size: 15,
        biz_type: "web_search_user",
        request_id: "1736316032-1773206973040",
      },
    },
    {
      headers: {
        ...signHeaders,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0",
        referer: "https://www.xiaohongshu.com/",
        cookie,
      },
    },
  );

  return response;
}

/**
 * 解析用户页面
 * @param http
 * @param roomId
 * @returns
 */
export async function getUserInfo(http: HttpClient, uid: string) {
  const html = await http.getText(`https://www.xiaohongshu.com/user/profile/${uid}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:148.0) Gecko/20100101 Firefox/148.0",
      referer: "https://www.xiaohongshu.com/",
    },
  });
  // 提取初始状态数据
  const matchData = html.match(/<script>window\.__INITIAL_STATE__=(.*?)<\/script>/);
  if (!matchData) {
    throw new ParseError("无法找到初始状态数据", "xhs");
  }

  try {
    const jsonStr = matchData[1].replace(/undefined/g, "null");
    const jsonData = JSON.parse(jsonStr);
    return jsonData;
  } catch (error) {
    throw new ParseError(`解析用户信息失败: ${(error as Error).message}`, "xhs");
  }
}

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
