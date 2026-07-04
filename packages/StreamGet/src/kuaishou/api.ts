/**
 * 快手直播页面数据解析
 *
 * 从 SSR 页面中提取 __INITIAL_STATE__ 并解析为结构化数据。
 * 不需要 __NS 签名，直接 HTTP GET 即可获取。
 */

import type { LiveInfo, SourceInfo, StreamInfo } from "../types.js";
import { ParseError } from "../errors.js";
import { HttpClient } from "../http.js";

/** 快手页面拉取/解析结果 */
export interface KuaishouPageData {
  liveroom: any;
  did: string;
}

/** 用户代理池，用于风控规避 */
const UA_POOL = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

/** 从 HTML 中提取 __INITIAL_STATE__ JSON 字符串 */
export function parseInitialState(html: string): any {
  // 先找到 __INITIAL_STATE__ 标记
  const marker = "__INITIAL_STATE__=";
  const idx = html.indexOf(marker);
  if (idx === -1) {
    throw new ParseError("未找到 __INITIAL_STATE__", "kuaishou");
  }

  // JSON 从标记后面的大括号开始
  const start = idx + marker.length;
  if (html[start] !== "{") {
    throw new ParseError("__INITIAL_STATE__ 格式异常", "kuaishou");
  }

  // 数大括号找到 JSON 结尾
  let depth = 0;
  let end = start;
  for (let i = start; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  if (depth !== 0) {
    throw new ParseError("__INITIAL_STATE__ JSON 未正确闭合", "kuaishou");
  }

  try {
    // 快手 SSR 输出中有时含 `:undefined`（非标准 JSON）
    // 替换为 `:null` 使其可解析
    const jsonStr = html.substring(start, end).replace(/:\s*undefined(?=\s*[,}\]])/g, ":null");
    return JSON.parse(jsonStr);
  } catch (e: any) {
    throw new ParseError(`__INITIAL_STATE__ JSON 解析失败: ${e.message}`, "kuaishou");
  }
}

/** 
 * 提取生成 SourceInfo 的流数据
 * 按 CDN 分组，每条 source 对应一个 CDN
 */
export function extractStreams(liveroom: any): SourceInfo<any>[] {
  if (!liveroom || !Array.isArray(liveroom.playList)) {
    throw new ParseError("数据格式异常: 缺少 playList", "kuaishou");
  }

  if (liveroom.playList.length === 0) {
    return [];
  }

  const first = liveroom.playList[0];
  if (!first.isLiving) {
    return [];
  }

  const liveStream = first.liveStream;
  if (!liveStream) {
    throw new ParseError("数据格式异常: liveStream 缺失", "kuaishou");
  }

  const sources: SourceInfo<any>[] = [];

  // ---- 方案 A: playUrls -> FLV (主方案) ----
  // 合并所有编码（h264、h265、hevc）的所有画质到 CDN 分组
  if (liveStream.playUrls) {
    const playUrls = liveStream.playUrls;
    const codecKeys = ["h264", "h265", "hevc"].filter((k) => playUrls[k]);

    // 按 CDN 分组
    const cdnGroups = new Map<string, StreamInfo<any>[]>();

    for (const codecKey of codecKeys) {
      const adaptationSet = playUrls[codecKey].adaptationSet;
      if (!adaptationSet || !Array.isArray(adaptationSet.representation)) continue;

      for (const rep of adaptationSet.representation) {
        if (!rep.url) continue;
        try {
          const urlObj = new URL(rep.url);
          const cdn = urlObj.hostname;

          if (!cdnGroups.has(cdn)) {
            cdnGroups.set(cdn, []);
          }

          const qualityDesc =
            rep.qualityLabel ||
            (rep.qualityType === "BLUE_RAY"
              ? "蓝光"
              : rep.qualityType === "SUPER"
                ? "超清"
                : rep.qualityType === "HIGH"
                  ? "高清"
                  : "标清");
          const streamInfo: StreamInfo<any> = {
            url: rep.url,
            quality: rep.qualityType || rep.qualityLabel || "STANDARD",
            qualityDesc,
            format: "flv",
            bitrate: rep.bitrate || rep.averageBitrate,
            width: rep.width,
            height: rep.height,
            codecs: rep.codecs || codecKey,
          };
          cdnGroups.get(cdn)!.push(streamInfo);
        } catch {
          continue;
        }
      }
    }

    // 每个 CDN 一组 source，按 bitrate 降序
    for (const [cdn, streams] of cdnGroups.entries()) {
      streams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
      sources.push({ name: cdn, streams });
    }
  }

  // ---- 方案 B: hlsPlayUrl -> HLS (兜底) ----
  if (liveStream.hlsPlayUrl) {
    try {
      const urlObj = new URL(liveStream.hlsPlayUrl);
      const cdn = urlObj.hostname;
      const hlsStream: StreamInfo<any> = {
        url: liveStream.hlsPlayUrl,
        quality: "HLS",
        qualityDesc: "HLS 自动",
        format: "hls",
        bitrate: 0,
      };

      // 找同名 CDN 追加，或新建
      const existing = sources.find(s => s.name === cdn);
      if (existing) {
        existing.streams.push(hlsStream);
      } else {
        sources.push({ name: cdn, streams: [hlsStream] });
      }
    } catch {
      // URL 解析失败跳过
    }
  }

  return sources;
}

/** 
 * 拉取快手用户主页
 * 内置风控处理：随机延迟 1-3s，随机 UA，501 时重试
 */
export async function fetchKuaishouPage(
  httpClient: HttpClient,
  userId: string,
): Promise<{ html: string; did: string }> {
  const url = `https://live.kuaishou.com/u/${encodeURIComponent(userId)}`;

  // 随机延迟 1-3 秒
  const delay = 1000 + Math.random() * 2000;
  await new Promise((r) => setTimeout(r, delay));

  // 随机选 UA
  const ua = UA_POOL[Math.floor(Math.random() * UA_POOL.length)];

  // 首次请求
  let response = await httpClient.request(url, {
    headers: {
      "User-Agent": ua,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    // 不传 cookie，让服务器分配新 did
  });

  // 501 限流处理：等 60s 重试一次
  if (response.statusCode === 501) {
    await new Promise((r) => setTimeout(r, 60000));
    response = await httpClient.request(url, {
      headers: {
        "User-Agent": ua,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
  }

  // 非 200 都抛异常
  if (response.statusCode !== 200) {
    throw new ParseError(
      `快手页面返回 HTTP ${response.statusCode}`,
      "kuaishou",
    );
  }

  // 读取 HTML
  const html = await response.body.text();

  // 从 set-cookie 中提取 did
  const setCookieRaw = response.headers["set-cookie"];
  const setCookie = Array.isArray(setCookieRaw) ? setCookieRaw[0] : (setCookieRaw || "");
  const didMatch = setCookie.match(/did=([^;]+)/);
  const did = didMatch ? didMatch[1] : "";

  return { html, did };
}
