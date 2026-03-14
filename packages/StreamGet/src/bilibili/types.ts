/**
 * Bilibili 平台特定类型
 */

export interface BilibiliResp<T = unknown> {
  code: number;
  message: string;
  msg?: string;
  data: T;
}

export type LiveStatus =
  | 0 // 未开播
  | 1 // 直播中
  | 2; // 轮播中

export interface StreamProfile {
  desc: string;
  qn: number;
}

export interface SourceProfile {
  name: string;
  host: string;
  extra: string;
  stream_ttl: number;
}

export interface ProtocolInfo {
  protocol_name: "http_stream" | "http_hls";
  format: FormatInfo[];
}

export interface FormatInfo {
  format_name: string | "flv" | "ts" | "fmp4";
  codec: CodecInfo[];
}

export interface CodecInfo {
  codec_name: string | "avc" | "hevc";
  accept_qn: number[];
  base_url: string;
  current_qn: number;
  url_info: Omit<SourceProfile, "name">[];
}
