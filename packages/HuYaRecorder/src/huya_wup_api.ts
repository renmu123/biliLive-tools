/**
 * 虎牙 WUP 协议客户端
 * 参考 DanmakuRender 项目实现
 * @see https://github.com/SmallPeaches/DanmakuRender/pull/527/files
 */

import { requester } from "./requester.js";
import TarsStream from "@tars/stream";

const Tup = TarsStream.Tup;

const WUP_URL = "https://wup.huya.com";
const WUP_YST_URL = "https://snmhuya.yst.aisee.tv";
const WUP_UA = "HYSDK(Windows, 30000002)_APP(pc_exe&7030003&official)_SDK(trans&2.29.0.5493)";
const HUYA_ORIGIN = "https://www.huya.com";

/**
 * CDN Token 扩展响应接口
 */
export interface CdnTokenExInfo {
  sFlvToken: string;
  iExpireTime: number;
  ua: string;
}

// ============================================================================
// TARS 结构体定义
// ============================================================================

/**
 * UserId 结构体
 */
class HuyaUserId {
  lUid: number;
  sGuid: string;
  sToken: string;
  sHuYaUA: string;
  sCookie: string;
  iTokenType: number;
  sDeviceId: string;
  sQIMEI: string;

  constructor() {
    this.lUid = 0; // tag=0
    this.sGuid = ""; // tag=1
    this.sToken = ""; // tag=2
    this.sHuYaUA = ""; // tag=3
    this.sCookie = ""; // tag=4
    this.iTokenType = 0; // tag=5
    this.sDeviceId = ""; // tag=6
    this.sQIMEI = ""; // tag=7
  }

  _writeTo(os: any): void {
    os.writeInt64(0, this.lUid);
    os.writeString(1, this.sGuid);
    os.writeString(2, this.sToken);
    os.writeString(3, this.sHuYaUA);
    os.writeString(4, this.sCookie);
    os.writeInt32(5, this.iTokenType);
    os.writeString(6, this.sDeviceId);
    os.writeString(7, this.sQIMEI);
  }

  _readFrom(is: any): void {
    this.lUid = is.readInt64(0, false, 0);
    this.sGuid = is.readString(1, false, "");
    this.sToken = is.readString(2, false, "");
    this.sHuYaUA = is.readString(3, false, "");
    this.sCookie = is.readString(4, false, "");
    this.iTokenType = is.readInt32(5, false, 0);
    this.sDeviceId = is.readString(6, false, "");
    this.sQIMEI = is.readString(7, false, "");
  }
}

/**
 * GetCdnTokenExReq 请求结构体
 */
class HuyaGetCdnTokenExReq {
  sFlvUrl: string;
  sStreamName: string;
  iLoopTime: number;
  tId: HuyaUserId;
  iAppId: number;

  constructor(streamName = "") {
    this.sFlvUrl = ""; // tag=0
    this.sStreamName = streamName; // tag=1
    this.iLoopTime = 0; // tag=2
    this.tId = new HuyaUserId(); // tag=3
    this.iAppId = 66; // tag=4
  }

  _writeTo(os: any): void {
    os.writeString(0, this.sFlvUrl);
    os.writeString(1, this.sStreamName);
    os.writeInt32(2, this.iLoopTime);
    os.writeStruct(3, this.tId);
    os.writeInt32(4, this.iAppId);
  }

  _readFrom(is: any): void {
    this.sFlvUrl = is.readString(0, false, "");
    this.sStreamName = is.readString(1, false, "");
    this.iLoopTime = is.readInt32(2, false, 0);
    this.tId = is.readStruct(3, false, HuyaUserId);
    this.iAppId = is.readInt32(4, false, 66);
  }
}

/**
 * GetCdnTokenExRsp 响应结构体
 */
class HuyaGetCdnTokenExRsp {
  sFlvToken: string;
  iExpireTime: number;

  constructor() {
    this.sFlvToken = ""; // tag=0
    this.iExpireTime = 0; // tag=1
  }

  _writeTo(os: any): void {
    os.writeString(0, this.sFlvToken);
    os.writeInt64(1, this.iExpireTime);
  }

  _readFrom(is: any): void {
    this.sFlvToken = is.readString(0, false, "");
    this.iExpireTime = is.readInt64(1, false, 0);
  }
}

// ============================================================================
// WUP 协议处理
// ============================================================================

/**
 * 生成随机虎牙 UA
 */
function generateRandomHuYaUA(): string {
  const platforms = [
    { name: "adr", version: "13.1.0", hasApiLevel: true },
    { name: "ios", version: "13.1.0", hasApiLevel: false },
    { name: "huya_nftv", version: "2.6.10", hasApiLevel: true },
    { name: "pc_exe", version: "7000000", hasApiLevel: false },
  ];

  const platform = platforms[Math.floor(Math.random() * platforms.length)];
  let version = platform.version;

  // 对于支持多版本号的平台，添加随机版本号
  if (platform.name === "adr" || platform.name === "huya_nftv") {
    const subVersion = Math.floor(Math.random() * 2000) + 3000;
    version = `${version}.${subVersion}`;
  }

  let ua = `${platform.name}&${version}&official`;

  // 添加 Android API Level
  if (platform.hasApiLevel) {
    const apiLevel = Math.floor(Math.random() * 9) + 28; // 28-36
    ua = `${ua}&${apiLevel}`;
  }

  return ua;
}

/**
 * 构建 getCdnTokenInfoEx 请求
 * @param streamName - 流名称
 * @returns TARS 编码的请求体
 */
function buildGetCdnTokenInfoExRequest(streamName: string, ua: string): Buffer {
  // 1. 创建 UserId 对象
  const userId = new HuyaUserId();
  userId.sHuYaUA = ua;

  // 2. 创建请求对象
  const req = new HuyaGetCdnTokenExReq(streamName);
  req.tId = userId;

  // 3. 创建 TUP 实例
  const tup = new Tup();

  // 4. 设置请求头信息
  tup.tupVersion = 3;
  tup.requestId = Math.abs(Math.floor(Math.random() * 1000000));
  tup.servantName = "liveui";
  tup.funcName = "getCdnTokenInfoEx";

  // 5. 写入请求结构体到 body["tReq"]
  tup.writeStruct("tReq", req);

  // 6. 编码为二进制
  const binBuffer = tup.encode();
  return binBuffer.toNodeBuffer();
}

/**
 * 解码 getCdnTokenInfoEx 响应
 * @param responseBytes - 响应二进制数据
 * @returns 解码后的响应对象
 */
function decodeGetCdnTokenInfoExResponse(responseBytes: Buffer): HuyaGetCdnTokenExRsp {
  // 1. 将 Node.js Buffer 转换为 BinBuffer
  const binBuffer = new TarsStream.BinBuffer();
  binBuffer.writeNodeBuffer(responseBytes);

  // 2. 创建 TUP 实例并解码
  const tup = new Tup();
  tup.decode(binBuffer);

  // 3. 读取响应结构体 body["tRsp"]
  const resp = new HuyaGetCdnTokenExRsp();
  tup.readStruct("tRsp", resp as any);

  return resp;
}

/**
 * 发送 WUP 请求到虎牙服务器
 * @param requestBody - 请求体
 * @param funcName - 函数名
 * @returns 响应体
 */
async function sendWupRequest(
  requestBody: Buffer,
  funcName?: string,
  ua?: string,
): Promise<Buffer> {
  // 随机选择服务器地址
  let url = WUP_URL;
  if (Math.random() > 0.5 && funcName) {
    url = `${WUP_YST_URL}/liveui/${funcName}`;
  }

  const response = await requester.post(url, requestBody, {
    headers: {
      "User-Agent": ua ?? WUP_UA,
      Origin: HUYA_ORIGIN,
      Referer: HUYA_ORIGIN,
      "Content-Type": "application/octet-stream",
    },
    responseType: "arraybuffer",
  });

  return Buffer.from(response.data);
}

/**
 * 获取 CDN Token 信息(使用 getCdnTokenInfoEx API)
 * @param streamName - 流名称
 * @returns CDN Token 信息
 */
export async function getCdnTokenInfoEx(streamName: string): Promise<CdnTokenExInfo> {
  const ua = generateRandomHuYaUA();
  const requestBody = buildGetCdnTokenInfoExRequest(streamName, ua);
  const responseBytes = await sendWupRequest(requestBody, "getCdnTokenInfoEx", ua);
  const tokenInfo = decodeGetCdnTokenInfoExResponse(responseBytes);

  return {
    sFlvToken: tokenInfo.sFlvToken,
    iExpireTime: tokenInfo.iExpireTime,
    ua,
  };
}

export {
  // 类
  HuyaUserId,
  HuyaGetCdnTokenExReq,
  HuyaGetCdnTokenExRsp,
  // 核心函数
  buildGetCdnTokenInfoExRequest,
  decodeGetCdnTokenInfoExResponse,
  sendWupRequest,
  generateRandomHuYaUA,
  // 常量
  WUP_URL,
  WUP_YST_URL,
  WUP_UA,
  HUYA_ORIGIN,
};
