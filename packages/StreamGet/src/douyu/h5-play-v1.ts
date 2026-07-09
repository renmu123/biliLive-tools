import type { HttpClient } from "../http.js";
import { ParseError, NetworkError } from "../errors.js";
import { md5 } from "../utils.js";
import type { GetH5PlayOptions, GetH5PlayResponse } from "./h5-play.js";

const DEFAULT_DID = "10000000000000000000000000001501";
const ENCRYPTION_CACHE_TTL = 5 * 60 * 1000;

interface EncryptionData {
  key: string;
  rand_str: string;
  enc_time: number;
  is_special: number;
  enc_data: string;
}

interface EncryptionCacheEntry {
  expiresAt: number;
  data: EncryptionData;
}

const encryptionCache = new Map<string, EncryptionCacheEntry>();

function buildAuth(roomId: string, timestamp: number, encryptionData: EncryptionData): string {
  const input = encryptionData.is_special === 1 ? "" : `${roomId}${timestamp}`;
  let seed = encryptionData.rand_str;

  for (let index = 0; index < encryptionData.enc_time; index++) {
    seed = md5(seed + encryptionData.key);
  }

  return md5(seed + encryptionData.key + input);
}

function buildBody(
  opts: GetH5PlayOptions,
  did: string,
  timestamp: number,
  auth: string,
  encData: string,
) {
  return new URLSearchParams({
    enc_data: encData,
    tt: String(timestamp),
    did,
    auth,
    cdn: opts.cdn ?? "",
    rate: String(opts.rate ?? 0),
    hevc: opts.hevc ? "1" : "0",
    fa: opts.onlyAudio ? "1" : "0",
    ive: "0",
  }).toString();
}

async function getEncryption(http: HttpClient, did: string): Promise<EncryptionData> {
  const cached = encryptionCache.get(did);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const response = await http.get<{
      error: number;
      data?: EncryptionData;
    }>(`https://www.douyu.com/wgapi/livenc/liveweb/websec/getEncryption?did=${did}`);

    if (response.error !== 0) {
      throw new ParseError("Unexpected error code: " + response.error, "douyu");
    }

    if (!response.data) {
      throw new ParseError(
        "Unexpected result with websec/getEncryption: " + JSON.stringify(response),
        "douyu",
      );
    }

    encryptionCache.set(did, {
      data: response.data,
      expiresAt: Date.now() + ENCRYPTION_CACHE_TTL,
    });

    return response.data;
  } catch (error) {
    if (error instanceof ParseError) {
      throw error;
    }
    throw new NetworkError(`获取加密参数失败: ${(error as Error).message}`, "douyu");
  }
}

export async function getH5PlayV1(
  http: HttpClient,
  opts: GetH5PlayOptions,
): Promise<GetH5PlayResponse> {
  const did = DEFAULT_DID;
  const timestamp = Math.round(Date.now() / 1000);
  const encryptionData = await getEncryption(http, did);
  const auth = buildAuth(opts.channelId, timestamp, encryptionData);

  try {
    const response = await http.post<GetH5PlayResponse>(
      `https://www.douyu.com/lapi/live/getH5PlayV1/${opts.channelId}`,
      buildBody(opts, did, timestamp, auth, encryptionData.enc_data),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    return response;
  } catch (error) {
    if (error instanceof ParseError) {
      throw error;
    }
    throw new NetworkError(`请求失败: ${(error as Error).message}`, "douyu");
  }
}
