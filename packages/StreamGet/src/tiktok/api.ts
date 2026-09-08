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

function getRequestOptions(options: TikTokParserOptions, mobile: boolean) {
  return {
    headers: getHeaders(options, mobile),
    proxy: options.proxy,
    timeout: options.timeout,
  };
}

export function getTikTokLiveRoom(data: TikTokResponse): TikTokLiveRoomUserInfo | undefined {
  return data.LiveRoom?.liveRoomUserInfo ?? data.data ?? undefined;
}

export async function fetchTikTokWebData(
  http: HttpClient,
  uniqueId: string,
  options: TikTokParserOptions = {},
): Promise<TikTokResponse> {
  const params = new URLSearchParams({
    aid: "1988",
    app_language: "zh-Hans",
    app_name: "tiktok_web",
    browser_language: "zh-CN",
    browser_name: "Mozilla",
    browser_online: "true",
    browser_platform: "Win32",
    browser_version: "5.0 (Windows)",
    channel: "tiktok_web",
    cookie_enabled: "true",
    data_collection_enabled: "true",
    device_id: "7666124801702397441",
    device_platform: "web_mobile",
    focus_state: "true",
    from_page: "",
    history_len: "4",
    is_fullscreen: "false",
    is_page_visible: "true",
    os: "android",
    priority_region: "JP",
    referer: "",
    region: "JP",
    screen_height: "882",
    screen_width: "427",
    sourceType: "54",
    tz_name: "Asia/Hong_Kong",
    uniqueId,
  });
  const liveUrl = `https://www.tiktok.com/@${encodeURIComponent(uniqueId)}/live`;
  const data = await http.get<TikTokResponse>(
    `https://www.tiktok.com/api-live/user/room?${params.toString()}`,
    getRequestOptions(options, true),
  );

  return { ...data, live_url: liveUrl };
}

export async function fetchTikTokLiveHtmlData(
  http: HttpClient,
  uniqueId: string,
  options: TikTokParserOptions = {},
): Promise<TikTokResponse> {
  const liveUrl = `https://www.tiktok.com/@${encodeURIComponent(uniqueId)}/live`;
  const html = await http.getText(liveUrl, getRequestOptions(options, false));
  if (html.includes("UNEXPECTED_EOF_WHILE_READING")) {
    return { live_url: liveUrl };
  }
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

  if (mode === "web" || mode === "auto") {
    return fetchTikTokWebData(http, uniqueId, options);
  }
  if (mode === "webHTML") {
    return fetchTikTokLiveHtmlData(http, uniqueId, options);
  }

  return Math.random() < 0.5
    ? fetchTikTokWebData(http, uniqueId, options)
    : fetchTikTokLiveHtmlData(http, uniqueId, options);
}
