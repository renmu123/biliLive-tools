/**
 * 小红书 API 层
 */

import type { HttpClient } from "../http.js";
import { ParseError } from "../errors.js";
import type { InitialState, LiveInfoResponse } from "./types.js";

import { Client } from "xhshow-js";

async function sign(redId: string) {
  const client = new Client();
  const a1Value = "197a7bb6c2for5ej34uc35be293t8xsy0powsxf8j50000682673"; // 从 Cookie 中获取
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
  console.log("x-s:", xs);

  // 生成其他必要的头部
  const xt = client.getXT();
  console.log("x-t:", xt);

  const b3TraceId = client.getB3TraceId();
  console.log("x-b3-traceid:", b3TraceId);

  const xrayTraceId = client.getXrayTraceId();
  console.log("x-xray-traceid:", xrayTraceId);

  // 生成 x-s-common 签名
  const cookies = {
    a1: a1Value,
    web_session: "040069b2dfffefcb5c75fc56853b4b5e77750b",
  };
  const xsCommon = client.signXSCommon(cookies);
  console.log("x-s-common:", xsCommon);

  return {
    "X-s": xs,
    "X-t": String(xt),
    "X-S-Common": xsCommon,
    "x-b3-traceid": b3TraceId,
    "x-xray-traceid": xrayTraceId,
  };
}

export async function check(http: HttpClient) {
  const redId = "likekkkil";
  const signHeaders = await sign(redId);

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
        cookie: "as",
      },
    },
  );

  console.log("Response:", response);
  return response;
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
