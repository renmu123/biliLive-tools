import { PlatformParser } from "../types.js";
import type { LiveInfo, ParseResult, RequestOptions, SourceInfo, StreamInfo } from "../types.js";
import { ParseError } from "../errors.js";
import { fetchTikTokData, getTikTokLiveRoom } from "./api.js";
import type {
  TikTokParserOptions,
  TikTokPullData,
  TikTokResponse,
  TikTokSdkParams,
  TikTokStreamData,
  TikTokStreamFormat,
} from "./types.js";

type ResolvedTikTokOptions = RequestOptions &
  TikTokParserOptions & {
    api: NonNullable<TikTokParserOptions["api"]>;
    format: TikTokStreamFormat[];
    raw: boolean;
  };

interface ParsedQuality {
  bitrate: number;
  codec: string;
  definition: string;
  key: string;
  main: {
    flv?: string;
    hls?: string;
  };
  raw: TikTokSdkParams;
  resolution: string;
}

function parseStartTime(value?: number | string): Date | undefined {
  if (value === undefined || value === "") return undefined;

  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return undefined;
  const date = new Date(timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function appendCodec(url: string, codec: string): string {
  if (!codec || /[?&]codec=/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}codec=${encodeURIComponent(codec)}`;
}

function parseQualities(streamData: TikTokStreamData): ParsedQuality[] {
  const rawStreamData = streamData.pull_data?.stream_data;
  if (!rawStreamData) return [];

  let pullData: TikTokPullData;
  try {
    pullData = JSON.parse(rawStreamData) as TikTokPullData;
  } catch (error) {
    throw new ParseError(`解析 TikTok 流数据失败: ${(error as Error).message}`, "tiktok");
  }

  const qualities: ParsedQuality[] = [];
  for (const [key, stream] of Object.entries(pullData.data ?? {})) {
    const main = stream.main;
    if (!main?.sdk_params) continue;

    let sdkParams: TikTokSdkParams;
    try {
      sdkParams = JSON.parse(main.sdk_params) as TikTokSdkParams;
    } catch {
      continue;
    }

    const bitrate = Number(sdkParams.vbitrate ?? 0);
    const resolution = sdkParams.resolution ?? "";
    if (!main.flv && !main.hls) {
      continue;
    }

    qualities.push({
      bitrate,
      codec: sdkParams.VCodec ?? "",
      definition: sdkParams.definition ?? key,
      key,
      main,
      raw: sdkParams,
      resolution,
    });
  }

  return qualities.sort((a, b) => {
    if (a.bitrate !== b.bitrate) return b.bitrate - a.bitrate;
    const [aWidth = 0, aHeight = 0] = a.resolution.split("x").map(Number);
    const [bWidth = 0, bHeight = 0] = b.resolution.split("x").map(Number);
    return bWidth - aWidth || bHeight - aHeight;
  });
}

export class TikTokParser extends PlatformParser<string> {
  readonly platform = "tiktok";
  readonly siteURL = "https://www.tiktok.com/";

  matchURL(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return hostname === "tiktok.com" || hostname.endsWith(".tiktok.com");
    } catch {
      return false;
    }
  }

  async extractRoomId(urlOrRoomId: string): Promise<string> {
    const input = urlOrRoomId.trim();
    const match = input.match(/tiktok\.com\/@([^/?#]+)\/live(?:[/?#]|$)/i);
    if (match) {
      return decodeURIComponent(match[1]);
    }

    if (!input.includes("://") && /^@?[\w.-]+$/.test(input)) {
      return input.replace(/^@/, "");
    }

    throw new ParseError(`无法从 URL 提取 TikTok 用户 ID: ${urlOrRoomId}`, this.platform);
  }

  private resolveOptions(opts?: RequestOptions & TikTokParserOptions): ResolvedTikTokOptions {
    const merged = this.mergeOptions(opts);
    return {
      ...merged,
      api: merged.api ?? "random",
      format: merged.format ?? ["flv", "hls"],
      raw: merged.raw ?? false,
    };
  }

  private async fetch(roomId: string, opts?: RequestOptions & TikTokParserOptions) {
    const options = this.resolveOptions(opts);
    const data = await fetchTikTokData(this.httpClient, roomId, options);
    if (!getTikTokLiveRoom(data)) {
      throw new Error(data?.message || "解析失败");
    }
    return {
      data,
      options,
    };
  }

  private toLiveInfo(roomId: string, data: TikTokResponse, raw: boolean): LiveInfo {
    const liveRoomInfo = getTikTokLiveRoom(data);
    const user = liveRoomInfo?.user;
    const room = liveRoomInfo?.liveRoom;
    return {
      platform: this.platform,
      roomId,
      living: Number(user?.status ?? 4) === 2,
      title: room?.title ?? "",
      owner: user?.nickname ?? user?.uniqueId ?? "",
      avatar: user?.avatarMedium ?? "",
      cover: room?.coverUrl ?? "",
      liveStartTime: parseStartTime(room?.startTime),
      area: "",
      raw: raw ? data : undefined,
    };
  }

  private toSources(data: TikTokResponse, options: ResolvedTikTokOptions): SourceInfo<string>[] {
    const liveRoomInfo = getTikTokLiveRoom(data);
    if (Number(liveRoomInfo?.user?.status ?? 4) !== 2) {
      return [];
    }

    const room = liveRoomInfo?.liveRoom;
    const streamDataList = [room?.streamData, room?.hevcStreamData].filter(
      (streamData): streamData is TikTokStreamData => Boolean(streamData),
    );
    if (streamDataList.length === 0) {
      throw new ParseError("解析错误", this.platform);
    }

    const streams: StreamInfo<string>[] = [];
    for (const streamData of streamDataList) {
      for (const quality of parseQualities(streamData)) {
        for (const format of options.format) {
          const url = quality.main[format];
          if (!url) continue;
          streams.push({
            url: appendCodec(url, quality.codec),
            quality: quality.key,
            qualityDesc: quality.definition,
            format,
            bitrate: quality.bitrate,
            codec: quality.codec,
            resolution: quality.resolution,
            raw: options.raw ? quality.raw : undefined,
          });
        }
      }
    }

    return streams.length > 0 ? [{ name: "自动", streams }] : [];
  }

  async getRoomInfo(
    roomId: string,
    opts?: RequestOptions & TikTokParserOptions,
  ): Promise<LiveInfo> {
    try {
      const { data, options } = await this.fetch(roomId, opts);
      return this.toLiveInfo(roomId, data, options.raw);
    } catch (error) {
      if (error instanceof ParseError) throw error;
      throw new ParseError(`获取直播间信息失败: ${(error as Error).message}`, this.platform);
    }
  }

  async getStreams(
    roomId: string,
    opts?: RequestOptions & TikTokParserOptions,
  ): Promise<SourceInfo<string>[]> {
    try {
      const { data, options } = await this.fetch(roomId, opts);
      return this.toSources(data, options);
    } catch (error) {
      if (error instanceof ParseError) throw error;
      throw new ParseError(`获取流地址失败: ${(error as Error).message}`, this.platform);
    }
  }

  override async parse(
    urlOrRoomId: string,
    opts?: RequestOptions & TikTokParserOptions,
  ): Promise<ParseResult<string>> {
    const roomId = await this.extractRoomId(urlOrRoomId);
    const { data, options } = await this.fetch(roomId, opts);
    return {
      liveInfo: this.toLiveInfo(roomId, data, options.raw),
      sources: this.toSources(data, options),
    };
  }
}

export default TikTokParser;
