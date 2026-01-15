import axios, { type AxiosInstance } from "axios";
import type {
  AcoustIDConfig,
  AcoustIDLookupParams,
  AcoustIDResponse,
  AcoustIDResult,
} from "./types.js";

/**
 * AcoustID 音频识别客户端
 * 用于通过音频指纹识别音乐信息
 */
export class AcoustIDClient {
  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly retries: number;
  private readonly retryDelay: number;
  private readonly meta: string[];
  private readonly axiosInstance: AxiosInstance;

  private static readonly API_URL = "https://api.acoustid.org/v2/lookup";

  constructor(config: AcoustIDConfig) {
    this.apiKey = config.apiKey;
    this.timeout = config.timeout ?? 10000;
    this.retries = config.retries ?? 1;
    this.retryDelay = config.retryDelay ?? 1000;
    this.meta = config.meta ?? ["recordings", "releasegroups", "compress"];

    this.axiosInstance = axios.create({
      timeout: this.timeout,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  }

  /**
   * 查询音频指纹
   * @param fingerprint 音频指纹数据（由 fpcalc 或类似工具生成）
   * @param duration 音频时长（秒）
   * @returns 识别结果列表
   */
  async lookup(fingerprint: string, duration: number): Promise<AcoustIDResult[]> {
    const params: AcoustIDLookupParams = {
      client: this.apiKey,
      fingerprint,
      duration,
      meta: this.meta,
    };

    const response = await this.requestWithRetry(params);
    return this.parseResponse(response);
  }

  /**
   * 带重试机制的请求
   */
  private async requestWithRetry(params: AcoustIDLookupParams): Promise<AcoustIDResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const response = await this.axiosInstance.post<AcoustIDResponse>(
          AcoustIDClient.API_URL,
          this.buildFormData(params),
        );

        if (response.status === 200) {
          return response.data;
        }

        throw new Error(`HTTP error! status: ${response.status}`);
      } catch (error) {
        lastError = error as Error;

        // 如果不是最后一次尝试，则等待后重试
        if (attempt < this.retries) {
          await this.delay(this.retryDelay);
          continue;
        }
      }
    }

    throw new Error(
      `AcoustID API 请求失败，重试 ${this.retries} 次后仍失败: ${lastError?.message}`,
    );
  }

  /**
   * 构建表单数据
   */
  private buildFormData(params: AcoustIDLookupParams): string {
    const formData = new URLSearchParams();
    formData.append("client", params.client);
    formData.append("fingerprint", params.fingerprint);
    formData.append("duration", params.duration.toString());

    if (params.meta && params.meta.length > 0) {
      formData.append("meta", params.meta.join(" "));
    }

    return formData.toString();
  }

  /**
   * 解析 API 响应
   */
  private parseResponse(response: AcoustIDResponse): AcoustIDResult[] {
    if (response.status === "error") {
      throw new Error(
        `AcoustID API 错误: ${response.error?.message || "未知错误"} (code: ${response.error?.code})`,
      );
    }

    if (!response.results || response.results.length === 0) {
      return [];
    }

    return response.results;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 获取最佳匹配结果
   * @param results 查询结果列表
   * @returns 得分最高的结果，如果没有结果则返回 null
   */
  static getBestMatch(results: AcoustIDResult[]): AcoustIDResult | null {
    if (!results || results.length === 0) {
      return null;
    }

    return results.reduce((best, current) => (current.score > best.score ? current : best));
  }

  /**
   * 格式化识别结果为可读字符串
   * @param result 识别结果
   * @returns 格式化的字符串
   */
  static formatResult(result: AcoustIDResult): string {
    const lines: string[] = [];
    lines.push(`匹配得分: ${(result.score * 100).toFixed(2)}%`);
    lines.push(`指纹 ID: ${result.id}`);

    if (result.recordings && result.recordings.length > 0) {
      const recording = result.recordings[0];
      lines.push(`标题: ${recording.title || "未知"}`);

      if (recording.artists && recording.artists.length > 0) {
        const artists = recording.artists.map((a) => a.name).join(", ");
        lines.push(`艺术家: ${artists}`);
      }

      if (recording.duration) {
        lines.push(`时长: ${recording.duration.toFixed(2)} 秒`);
      }

      if (recording.releases && recording.releases.length > 0) {
        const release = recording.releases[0];
        lines.push(`专辑: ${release.title}`);
        if (release.date?.year) {
          lines.push(`发行年份: ${release.date.year}`);
        }
      }
    }

    return lines.join("\n");
  }
}

/**
 * 创建 AcoustID 客户端实例
 * @param apiKey AcoustID API Key
 * @param config 可选配置
 * @returns AcoustID 客户端实例
 */
export function createAcoustIDClient(
  apiKey: string,
  config?: Partial<Omit<AcoustIDConfig, "apiKey">>,
): AcoustIDClient {
  return new AcoustIDClient({
    apiKey,
    ...config,
  });
}
