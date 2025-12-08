/**
 * 虎牙 WUP 协议客户端
 * 参考 https://github.com/hua0512/rust-srec 实现
 */

import { requester } from "./requester.js";
import TarsStream from "@tars/stream";

const Tup = TarsStream.Tup;

const WUP_URL = "https://wup.huya.com";
const WUP_UA = "HYSDK(Windows, 30000002)_APP(pc_exe&7030003&official)_SDK(trans&2.29.0.5493)";
const HUYA_ORIGIN = "https://www.huya.com";

/**
 * 流信息接口
 */
export interface StreamInfo {
  url: string;
  streamFormat: string;
  extras?: StreamExtras;
}

/**
 * 流扩展信息接口
 */
export interface StreamExtras {
  cdn?: string;
  stream_name: string;
  presenter_uid?: number;
}

/**
 * CDN Token 信息接口
 */
export interface CdnTokenInfo {
  url: string;
  cdnType: string;
  streamName: string;
  presenterUid: number;
  antiCode: string;
  sTime: string;
  flvAntiCode: string;
  hlsAntiCode: string;
}

// ============================================================================
// TARS 结构体定义
// ============================================================================

/**
 * GetCdnTokenInfoReq 请求结构体
 * 对应 Rust 代码中的 GetCdnTokenInfoReq
 */
class GetCdnTokenInfoReq {
  url: string;
  cdnType: string;
  streamName: string;
  presenterUid: number;

  constructor(url = "", streamName = "", cdnType = "", presenterUid = 0) {
    this.url = url; // tag=0, String
    this.cdnType = cdnType; // tag=1, String
    this.streamName = streamName; // tag=2, String
    this.presenterUid = presenterUid; // tag=3, Long/Int64
  }

  /**
   * TARS 编码方法 - 将结构体写入输出流
   * @param os - TARS 输出流
   */
  _writeTo(os: any): void {
    os.writeString(0, this.url);
    os.writeString(1, this.cdnType);
    os.writeString(2, this.streamName);
    os.writeInt64(3, this.presenterUid);
  }

  /**
   * TARS 解码方法 - 从输入流读取结构体
   * @param is - TARS 输入流
   */
  _readFrom(is: any): void {
    this.url = is.readString(0, false, "");
    this.cdnType = is.readString(1, false, "");
    this.streamName = is.readString(2, false, "");
    this.presenterUid = is.readInt64(3, false, 0);
  }
}

/**
 * HuyaGetTokenResp 响应结构体
 * 对应 Rust 代码中的 HuyaGetTokenResp
 */
class HuyaGetTokenResp {
  url: string;
  cdnType: string;
  streamName: string;
  presenterUid: number;
  antiCode: string;
  sTime: string;
  flvAntiCode: string;
  hlsAntiCode: string;

  constructor() {
    this.url = ""; // tag=0
    this.cdnType = ""; // tag=1
    this.streamName = ""; // tag=2
    this.presenterUid = 0; // tag=3
    this.antiCode = ""; // tag=4
    this.sTime = ""; // tag=5
    this.flvAntiCode = ""; // tag=6
    this.hlsAntiCode = ""; // tag=7
  }

  /**
   * TARS 编码方法 - 将结构体写入输出流
   * @param os - TARS 输出流
   */
  _writeTo(os: any): void {
    os.writeString(0, this.url);
    os.writeString(1, this.cdnType);
    os.writeString(2, this.streamName);
    os.writeInt64(3, this.presenterUid);
    os.writeString(4, this.antiCode);
    os.writeString(5, this.sTime);
    os.writeString(6, this.flvAntiCode);
    os.writeString(7, this.hlsAntiCode);
  }

  /**
   * TARS 解码方法 - 从输入流读取结构体
   * @param is - TARS 输入流
   */
  _readFrom(is: any): void {
    this.url = is.readString(0, false, "");
    this.cdnType = is.readString(1, false, "");
    this.streamName = is.readString(2, false, "");
    this.presenterUid = is.readInt64(3, false, 0);
    this.antiCode = is.readString(4, false, "");
    this.sTime = is.readString(5, false, "");
    this.flvAntiCode = is.readString(6, false, "");
    this.hlsAntiCode = is.readString(7, false, "");
  }
}

// ============================================================================
// WUP 协议处理
// ============================================================================

/**
 * 构建 getCdnTokenInfo 请求
 * 对应 Rust 中的 build_get_cdn_token_info_request 函数
 *
 * @param streamName - 流名称
 * @param cdnType - CDN 类型 (例如: "AL")
 * @param presenterUid - 主播 UID
 * @returns TARS 编码的请求体
 */
function buildGetCdnTokenInfoRequest(
  streamName: string,
  cdnType: string,
  presenterUid: number,
): Buffer {
  // 1. 创建请求对象
  const req = new GetCdnTokenInfoReq("", streamName, cdnType, presenterUid);

  // 2. 创建 TUP 实例
  const tup = new Tup();

  // 3. 设置请求头信息
  tup.tupVersion = 3; // version: 3
  tup.requestId = 1; // request_id: 1
  tup.servantName = "liveui"; // servant_name: "liveui"
  tup.funcName = "getCdnTokenInfo"; // func_name: "getCdnTokenInfo"

  // 4. 写入请求结构体到 body["tReq"]
  tup.writeStruct("tReq", req);

  // 5. 编码为二进制
  const binBuffer = tup.encode();
  return binBuffer.toNodeBuffer();
}

/**
 * 解码 getCdnTokenInfo 响应
 * 对应 Rust 中的 decode_get_cdn_token_info_response 函数
 *
 * @param responseBytes - 响应二进制数据
 * @returns 解码后的响应对象
 */
function decodeGetCdnTokenInfoResponse(responseBytes: Buffer): HuyaGetTokenResp {
  // 1. 将 Node.js Buffer 转换为 BinBuffer
  const binBuffer = new TarsStream.BinBuffer();
  binBuffer.writeNodeBuffer(responseBytes);

  // 2. 创建 TUP 实例并解码
  const tup = new Tup();
  tup.decode(binBuffer);

  // 3. 读取响应结构体 body["tRsp"]
  const resp = new HuyaGetTokenResp();
  tup.readStruct("tRsp", resp as any);

  // 4. 返回响应对象
  return resp;
}

/**
 * 发送 WUP 请求到虎牙服务器
 *
 * @param requestBody - 请求体
 * @returns 响应体
 */
async function sendWupRequest(requestBody: Buffer): Promise<Buffer> {
  const response = await requester.post(WUP_URL, requestBody, {
    headers: {
      "User-Agent": WUP_UA,
      Origin: HUYA_ORIGIN,
      Referer: HUYA_ORIGIN,
      "Content-Type": "application/octet-stream",
    },
    responseType: "arraybuffer",
  });

  return Buffer.from(response.data);
}

/**
 * 获取虎牙流的真实 URL(使用 WUP 协议)
 * 对应 Rust 中的 get_stream_url_wup 方法
 *
 * @param streamInfo - 流信息对象
 * @returns 真实流 URL
 */
export async function getStreamUrlWup(streamInfo: StreamInfo): Promise<string> {
  // 1. 提取参数
  const { extras } = streamInfo;
  if (!extras) {
    throw new Error("Stream extras not found for WUP request");
  }

  const cdn = extras.cdn || "AL";
  const streamName = extras.stream_name;
  const presenterUid = extras.presenter_uid || 0;

  if (!streamName) {
    throw new Error("Stream name not found in extras");
  }

  // 2. 构建请求
  const requestBody = buildGetCdnTokenInfoRequest(streamName, cdn, presenterUid);

  // 3. 发送请求
  const responseBytes = await sendWupRequest(requestBody);

  // 4. 解码响应
  const tokenInfo = decodeGetCdnTokenInfoResponse(responseBytes);

  // 5. 获取防盗链参数
  const antiCode =
    streamInfo.streamFormat === "flv" ? tokenInfo.flvAntiCode : tokenInfo.hlsAntiCode;

  // 6. 解析原始 URL
  const url = new URL(streamInfo.url);
  const host = url.host;
  const pathParts = url.pathname.split("/");
  const pathPrefix = pathParts[1] || "";
  const baseUrl = `${url.protocol}//${host}/${pathPrefix}`;

  // 7. 确定文件后缀
  const suffix = streamInfo.streamFormat;

  // 8. 构建新 URL
  const newUrl = `${baseUrl}/${streamName}.${suffix}?${antiCode}`;

  return newUrl;
}

/**
 * 简化版本：直接获取防盗链参数
 *
 * @param streamName - 流名称
 * @param cdnType - CDN 类型
 * @param presenterUid - 主播 UID
 * @returns 包含 flvAntiCode 和 hlsAntiCode
 */
export async function getCdnTokenInfo(
  streamName: string,
  cdnType = "AL",
  presenterUid = 0,
): Promise<CdnTokenInfo> {
  const requestBody = buildGetCdnTokenInfoRequest(streamName, cdnType, presenterUid);
  const responseBytes = await sendWupRequest(requestBody);
  const tokenInfo = decodeGetCdnTokenInfoResponse(responseBytes);

  return tokenInfo;
}

export {
  // 类
  GetCdnTokenInfoReq,
  HuyaGetTokenResp,
  // 核心函数
  buildGetCdnTokenInfoRequest,
  decodeGetCdnTokenInfoResponse,
  sendWupRequest,
  // 常量
  WUP_URL,
  WUP_UA,
  HUYA_ORIGIN,
};
