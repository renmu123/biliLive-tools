import type { ProxyConfig } from "../types.js";

export type TikTokApiMode = "auto" | "app" | "web";
export type TikTokStreamFormat = "flv" | "hls";

export type TikTokImage = string;

export interface TikTokUser {
  nickname?: string;
  uniqueId?: string;
  status?: number | string;
  avatarThumb: TikTokImage;
  avatarMedium: TikTokImage;
  avatarLarger: TikTokImage;
}

export interface TikTokStreamData {
  pull_data?: {
    stream_data?: string;
  };
}

export interface TikTokLiveRoom {
  title?: string;
  startTime?: number | string;
  coverUrl?: TikTokImage;
  streamData?: TikTokStreamData;
  hevcStreamData?: TikTokStreamData;
}

export interface TikTokLiveRoomUserInfo {
  user?: TikTokUser;
  liveRoom?: TikTokLiveRoom;
}

export interface TikTokResponse {
  data?: TikTokLiveRoomUserInfo | null;
  message?: string;
  LiveRoom?: {
    liveRoomUserInfo?: TikTokLiveRoomUserInfo;
  };
  live_url?: string;
  [key: string]: unknown;
}

export interface TikTokSdkParams {
  VCodec?: string;
  definition?: string;
  resolution?: string;
  vbitrate?: number | string;
  [key: string]: unknown;
}

export interface TikTokQualityMain {
  flv?: string;
  hls?: string;
  sdk_params?: string;
}

export interface TikTokQualityData {
  main?: TikTokQualityMain;
}

export interface TikTokPullData {
  data?: Record<string, TikTokQualityData>;
}

export interface TikTokParserOptions {
  api?: TikTokApiMode;
  cookie?: string;
  format?: TikTokStreamFormat[];
  headers?: Record<string, string>;
  hevc?: boolean;
  isHevc?: boolean;
  proxy?: ProxyConfig | string;
  raw?: boolean;
  timeout?: number;
}
