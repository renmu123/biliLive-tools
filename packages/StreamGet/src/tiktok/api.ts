import type { HttpClient } from "../http.js";
import { ParseError } from "../errors.js";
import type {
  TikTokApiMode,
  TikTokLiveRoomUserInfo,
  TikTokParserOptions,
  TikTokResponse,
} from "./types.js";

const PC_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0";
const MOBILE_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36 Edg/145.0.0.0";

function getHeaders(options: TikTokParserOptions, mobile: boolean): Record<string, string> {
  return {
    referer: "https://www.tiktok.com/",
    "User-Agent": mobile ? MOBILE_USER_AGENT : PC_USER_AGENT,
    ...(options.cookie ? { cookie: options.cookie } : {}),
    ...options.headers,
  };
}

export function getTikTokLiveRoom(data: TikTokResponse): TikTokLiveRoomUserInfo | undefined {
  return data.LiveRoom?.liveRoomUserInfo ?? data.data ?? undefined;
}

export async function fetchTikTokAppData(
  http: HttpClient,
  uniqueId: string,
  options: TikTokParserOptions = {},
): Promise<TikTokResponse> {
  const params = new URLSearchParams({
    aid: "1988",
    app_language: "en",
    os: "android",
    referer: "https://www.tiktok.com/",
    sourceType: "54",
    uniqueId,
  });
  console.log("dadas", options);
  const liveUrl = `https://www.tiktok.com/@${encodeURIComponent(uniqueId)}/live`;
  const data = await http.get<TikTokResponse>(
    `https://www.tiktok.com/api-live/user/room?${params.toString()}`,
    { headers: getHeaders(options, true), cookie: options.cookie },
  );

  return { ...data, live_url: liveUrl };
}

export async function fetchTikTokWebData(
  http: HttpClient,
  uniqueId: string,
  options: TikTokParserOptions = {},
): Promise<TikTokResponse> {
  const liveUrl = `https://www.tiktok.com/@${encodeURIComponent(uniqueId)}/live`;
  const html = await http.getText(liveUrl, { headers: getHeaders(options, false) });

  if (html.includes("We regret to inform you that we have discontinued operating TikTok")) {
    const message = html.match(
      /<p[^>]*>\s*(We regret to inform you that we have discontinued[\s\S]*?)\.\s*<\/p>/i,
    )?.[1];
    throw new ParseError(
      `当前代理节点所在地区无法访问 TikTok，请切换其他地区的节点${message ? `: ${message}` : ""}`,
      "tiktok",
    );
  }

  if (html.includes("UNEXPECTED_EOF_WHILE_READING")) {
    return { live_url: liveUrl };
  }
  const fs = await import("fs");
  fs.writeFileSync("dasd.html", html);
  const json = html.match(/<script\b[^>]*\bid=["']SIGI_STATE["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (!json) {
    throw new ParseError("无法从 TikTok 页面找到 SIGI_STATE 数据", "tiktok");
  }

  try {
    return { ...(JSON.parse(json) as TikTokResponse), live_url: liveUrl };
  } catch (error) {
    throw new ParseError(`解析 TikTok 页面数据失败: ${(error as Error).message}`, "tiktok");
  }
}

export async function fetchTikTokData(
  http: HttpClient,
  uniqueId: string,
  options: TikTokParserOptions = {},
): Promise<TikTokResponse> {
  const mode: TikTokApiMode = options.api ?? "auto";

  if (mode === "app") {
    return fetchTikTokAppData(http, uniqueId, options);
  }
  if (mode === "web") {
    return fetchTikTokWebData(http, uniqueId, options);
  }

  try {
    const appData = await fetchTikTokAppData(http, uniqueId, options);
    if (getTikTokLiveRoom(appData)) {
      return appData;
    }
  } catch {
    // App 接口可能因地区或风控不可用，自动模式继续尝试网页数据。
  }

  return fetchTikTokWebData(http, uniqueId, options);
}
