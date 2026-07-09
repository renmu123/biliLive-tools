/**
 * HTTP 客户端（支持代理）
 */

import { request, ProxyAgent, Agent } from "undici";
import { promisify } from "node:util";
import { brotliDecompress, gunzip, inflate } from "node:zlib";
import type { RequestOptions, ProxyConfig } from "./types.js";
import { NetworkError } from "./errors.js";

const decompressors = {
  br: promisify(brotliDecompress),
  deflate: promisify(inflate),
  gzip: promisify(gunzip),
} as const;

async function decodeTextBody(
  body: ArrayBuffer,
  contentEncoding?: string | string[],
): Promise<string> {
  let data: Buffer<ArrayBufferLike> = Buffer.from(body);
  const encodings = (Array.isArray(contentEncoding) ? contentEncoding.join(",") : contentEncoding)
    ?.split(",")
    .map((encoding) => encoding.trim().toLowerCase())
    .filter((encoding) => encoding && encoding !== "identity");

  // Content-Encoding 按应用顺序声明，解码时需要反向处理。
  for (const encoding of encodings?.reverse() ?? []) {
    const decompress = decompressors[encoding as keyof typeof decompressors];
    if (!decompress) {
      throw new Error(`不支持的响应压缩格式: ${encoding}`);
    }
    data = await decompress(data);
  }

  return data.toString("utf8");
}

export class HttpClient {
  private agent?: Agent | ProxyAgent;

  constructor(private defaultOptions?: RequestOptions) {
    this.updateAgent(defaultOptions?.proxy);
  }

  private updateAgent(proxy?: ProxyConfig | string) {
    if (proxy) {
      const uri = typeof proxy === "string" ? proxy : proxy.uri;
      const token = typeof proxy === "object" ? proxy.token : undefined;
      this.agent = new ProxyAgent({ uri, token });
    } else {
      this.agent = undefined; // 使用默认 agent
    }
  }

  async request(url: string, options: RequestOptions = {}) {
    const mergedOpts = { ...this.defaultOptions, ...options };
    this.updateAgent(mergedOpts.proxy);

    try {
      const response = await request(url, {
        method: mergedOpts.method || "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          ...mergedOpts.headers,
        },
        body: mergedOpts.body,
        dispatcher: this.agent,
        headersTimeout: mergedOpts.timeout || 10000,
      });
      return response;
    } catch (error) {
      throw new NetworkError(`请求失败: ${(error as Error).message}`, undefined);
    }
  }

  async get<T = any>(url: string, opts?: RequestOptions): Promise<T> {
    const mergedOpts = { ...this.defaultOptions, ...opts };

    // 如果本次请求有不同的 proxy 配置，临时创建 agent
    const agent = opts?.proxy
      ? typeof opts.proxy === "string"
        ? new ProxyAgent({ uri: opts.proxy })
        : new ProxyAgent(opts.proxy)
      : this.agent;

    try {
      const response = await request(url, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          ...mergedOpts?.headers,
        },
        dispatcher: agent,
        headersTimeout: mergedOpts?.timeout || 10000,
      });

      const data = await response.body.json();
      return data as T;
    } catch (error) {
      throw new NetworkError(`请求失败: ${(error as Error).message}`, undefined);
    }
  }

  async post<T = any>(url: string, body: any, opts?: RequestOptions): Promise<T> {
    const mergedOpts = { ...this.defaultOptions, ...opts };

    const agent = opts?.proxy
      ? typeof opts.proxy === "string"
        ? new ProxyAgent({ uri: opts.proxy })
        : new ProxyAgent(opts.proxy)
      : this.agent;

    try {
      const contentType =
        mergedOpts?.headers?.["Content-Type"] ||
        mergedOpts?.headers?.["content-type"] ||
        "application/json";

      let requestBody: string;
      if (contentType.includes("application/x-www-form-urlencoded") && typeof body === "string") {
        // URL 编码表单数据，直接使用字符串
        requestBody = body;
      } else if (typeof body === "string") {
        // 其他字符串 body
        requestBody = body;
      } else {
        // 对象转 JSON
        requestBody = JSON.stringify(body);
      }

      const response = await request(url, {
        method: "POST",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Content-Type": contentType,
          ...mergedOpts?.headers,
        },
        body: requestBody,
        dispatcher: agent,
        headersTimeout: mergedOpts?.timeout || 10000,
      });

      const data = await response.body.json();
      return data as T;
    } catch (error) {
      throw new NetworkError(`请求失败: ${(error as Error).message}`, undefined);
    }
  }

  async getText(url: string, opts?: RequestOptions): Promise<string> {
    const mergedOpts = { ...this.defaultOptions, ...opts };

    const agent = opts?.proxy
      ? typeof opts.proxy === "string"
        ? new ProxyAgent({ uri: opts.proxy })
        : new ProxyAgent(opts.proxy)
      : this.agent;

    try {
      const response = await request(url, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "*/*",
          ...mergedOpts?.headers,
        },
        dispatcher: agent,
        headersTimeout: mergedOpts?.timeout || 10000,
      });
      const body = await response.body.arrayBuffer();
      return await decodeTextBody(body, response.headers["content-encoding"]);
    } catch (error) {
      throw new NetworkError(`请求失败: ${(error as Error).message}`, undefined);
    }
  }

  // 带重试的请求
  async withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }

    throw lastError;
  }
}

// 创建单例（可选，也可以每个 parser 自己创建）
export const http = new HttpClient();
