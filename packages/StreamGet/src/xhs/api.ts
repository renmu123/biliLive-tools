/**
 * 小红书 API 层
 */

import type { HttpClient } from "../http.js";
import { ParseError } from "../errors.js";
import type { CurrentRoomInfoResponse, LiveInfoResponse } from "./types.js";

import { Client } from "xhshow-js";
import type { RequestPayload } from "xhshow-js";
import cookie from "cookie";

function signXS(
  client: Client,
  cookieStr: string,
  method: "GET" | "POST",
  uri: string,
  payload: RequestPayload,
) {
  const a1Value = cookie.parse(cookieStr).a1;
  if (!a1Value) {
    throw new ParseError("cookie 中缺少 a1 字段，无法生成 X-s", "xhs");
  }
  return client.signXS(method, uri, a1Value, "xhs-pc-web", payload);
}

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

  const xs = signXS(client, cookieStr, method, uri, payload);
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

/** 获取分享页当前直播间信息，根据 Cookie 中的 a1 生成本次请求的 X-s。 */
export async function getCurrentRoomInfo(
  http: HttpClient,
  roomId: string,
  opts?: { cookie?: string; source?: string },
): Promise<CurrentRoomInfoResponse> {
  const url = new URL(
    "https://live-room.xiaohongshu.com/api/sns/red/live/h5/v1/room/current_room_info",
  );
  const source = opts?.source ?? "share_out_of_app";
  url.searchParams.set("room_id", roomId);
  url.searchParams.set("source", source);
  const xs = signXS(new Client(), opts?.cookie || "a1=1221", "GET", url.pathname, {
    room_id: roomId,
    source,
  });

  return http.get<CurrentRoomInfoResponse>(url.toString(), {
    headers: {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "zh-CN,zh;q=0.9,zh-TW;q=0.8,zh-HK;q=0.7,en-US;q=0.6,en;q=0.5",
      "X-s": xs,
      Cookie: opts?.cookie || "",
    },
  });
}

/**
 * 获取小红书直播流信息
 */
export async function getXhsStreamUrl(
  http: HttpClient,
  roomId: string,
  opts?: { cookie?: string; source?: string },
): Promise<LiveInfoResponse> {
  const response = await getCurrentRoomInfo(http, roomId, opts);
  if (!response.success || !response.data?.room_info) {
    throw new ParseError(response.msg || "直播间信息为空", "xhs");
  }

  const { room_info: roomInfo, host_info: hostInfo } = response.data;
  const title = roomInfo.room_title || "";
  // 排除回放
  if (roomInfo.status !== 2 || !title || title.includes("回放")) {
    return { is_live: false };
  }

  const liveRoomId = roomInfo.room_id || roomId;
  return {
    anchor_name: hostInfo?.nick_name || "",
    avatar: hostInfo?.avatar,
    is_live: true,
    title,
    flv_url: `http://live-source-play.xhscdn.com/live/${liveRoomId}.flv`,
    m3u8_url: `http://live-source-play.xhscdn.com/live/${liveRoomId}.m3u8`,
    cover: roomInfo.room_cover,
  };
}
