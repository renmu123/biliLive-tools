import type {
  APIType,
  APIEndpoint,
  APIEndpointStatus,
  LoadBalancerConfig,
  RoomInfo,
} from "../types.js";
import { getRoomInfo } from "../douyin_api.js";

/**
 * API 负载均衡器类
 * 实现多个 API 接口的负载均衡调用，具备失败重试和禁用机制
 */
export class APILoadBalancer {
  private endpoints: APIEndpointStatus[] = [];
  private config: LoadBalancerConfig;

  constructor(config?: Partial<LoadBalancerConfig>) {
    this.config = {
      maxFailures: 3, // 连续失败3次后禁用
      blockDuration: 3 * 60 * 1000, // 禁用3分钟
      retryMultiplier: 1.5, // 重试时间倍增
      healthCheckInterval: 30 * 1000, // 30秒健康检查
      ...config,
    };

    // 初始化可用的 API 端点
    this.initializeEndpoints();
  }

  /**
   * 初始化 API 端点配置
   */
  private initializeEndpoints(): void {
    const defaultEndpoints: APIEndpoint[] = [
      { name: "web", priority: 2, weight: 1 },
      { name: "webHTML", priority: 4, weight: 1 },
      { name: "mobile", priority: 1, weight: 1 },
      { name: "userHTML", priority: 1, weight: 1 },
    ];

    this.endpoints = defaultEndpoints.map((endpoint) => ({
      endpoint,
      failureCount: 0,
      lastFailureTime: 0,
      isBlocked: false,
      nextRetryTime: 0,
    }));
  }

  /**
   * 获取下一个可用的 API 端点
   * 使用加权轮询算法，优先选择权重高且未被禁用的端点
   */
  private getNextEndpoint(): APIEndpointStatus | null {
    const now = Date.now();

    // 清理过期的禁用状态
    this.endpoints.forEach((status) => {
      if (status.isBlocked && now >= status.nextRetryTime) {
        status.isBlocked = false;
        status.failureCount = Math.max(0, status.failureCount - 1); // 部分恢复
      }
    });

    // 获取可用的端点
    const availableEndpoints = this.endpoints.filter((status) => !status.isBlocked);

    if (availableEndpoints.length === 0) {
      return null; // 所有端点都被禁用
    }

    // 按优先级和权重排序
    availableEndpoints.sort((a, b) => {
      if (a.endpoint.priority !== b.endpoint.priority) {
        return a.endpoint.priority - b.endpoint.priority; // 优先级越小越好
      }
      return b.endpoint.weight - a.endpoint.weight; // 权重越大越好
    });

    // 使用加权随机选择
    const totalWeight = availableEndpoints.reduce((sum, status) => sum + status.endpoint.weight, 0);
    const random = Math.random() * totalWeight;

    let currentWeight = 0;
    for (const status of availableEndpoints) {
      currentWeight += status.endpoint.weight;
      if (random <= currentWeight) {
        return status;
      }
    }

    // 如果加权选择失败，返回第一个可用的
    return availableEndpoints[0];
  }

  /**
   * 记录 API 调用失败
   */
  private recordFailure(apiType: APIType, error: Error): void {
    const status = this.endpoints.find((s) => s.endpoint.name === apiType);
    if (!status) return;

    status.failureCount++;
    status.lastFailureTime = Date.now();

    // 如果失败次数超过阈值，禁用该端点
    if (status.failureCount >= this.config.maxFailures) {
      status.isBlocked = true;
      const blockDuration =
        this.config.blockDuration *
        Math.pow(this.config.retryMultiplier, status.failureCount - this.config.maxFailures);
      status.nextRetryTime = Date.now() + blockDuration;

      console.warn(
        `API ${apiType} has been blocked due to ${status.failureCount} failures. Next retry at: ${new Date(status.nextRetryTime).toISOString()}`,
      );
    }
  }

  /**
   * 记录 API 调用成功
   */
  private recordSuccess(apiType: APIType): void {
    const status = this.endpoints.find((s) => s.endpoint.name === apiType);
    if (!status) return;

    // 成功调用后，减少失败计数
    if (status.failureCount > 0) {
      status.failureCount = Math.max(0, status.failureCount - 1);
    }

    // 如果之前被禁用，现在可以恢复
    if (status.isBlocked && status.failureCount === 0) {
      status.isBlocked = false;
      status.nextRetryTime = 0;
    }
  }

  /**
   * 使用负载均衡策略调用 getRoomInfo
   */
  async callWithLoadBalance(
    webRoomId: string,
    opts: {
      auth?: string;
      doubleScreen?: boolean;
      uid?: string | number;
    } = {},
  ): Promise<{
    living: boolean;
    roomId: string;
    owner: string;
    title: string;
    streams: any[];
    sources: any[];
    avatar: string;
    cover: string;
    liveId: string;
    uid: string;
  }> {
    const maxAttempts = this.endpoints.length;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const endpointStatus = this.getNextEndpoint();

      if (!endpointStatus) {
        throw new Error("所有 API 端点都不可用，请稍后重试");
      }

      const apiType = endpointStatus.endpoint.name;

      try {
        const result = await getRoomInfo(webRoomId, {
          ...opts,
          api: apiType,
        });

        // 调用成功，记录成功状态
        this.recordSuccess(apiType);
        return result;
      } catch (error) {
        lastError = error as Error;
        this.recordFailure(apiType, lastError);

        console.warn(
          `API ${apiType} failed (attempt ${attempt + 1}/${maxAttempts}):`,
          lastError.message,
        );

        // 如果这是最后一次尝试，或者没有更多可用端点，则抛出错误
        if (attempt === maxAttempts - 1) {
          break;
        }
      }
    }

    throw new Error(`所有 API 调用都失败了。最后一个错误: ${lastError?.message || "未知错误"}`);
  }

  /**
   * 获取当前端点状态（用于调试和监控）
   */
  getEndpointStatus(): APIEndpointStatus[] {
    return this.endpoints.map((status) => ({ ...status }));
  }

  /**
   * 手动重置某个端点的状态
   */
  resetEndpoint(apiType: APIType): void {
    const status = this.endpoints.find((s) => s.endpoint.name === apiType);
    if (status) {
      status.failureCount = 0;
      status.lastFailureTime = 0;
      status.isBlocked = false;
      status.nextRetryTime = 0;
    }
  }

  /**
   * 重置所有端点状态
   */
  resetAllEndpoints(): void {
    this.endpoints.forEach((status) => {
      status.failureCount = 0;
      status.lastFailureTime = 0;
      status.isBlocked = false;
      status.nextRetryTime = 0;
    });
  }

  /**
   * 更新端点配置
   */
  updateEndpointConfig(apiType: APIType, updates: Partial<APIEndpoint>): void {
    const status = this.endpoints.find((s) => s.endpoint.name === apiType);
    if (status) {
      Object.assign(status.endpoint, updates);
    }
  }

  /**
   * 获取负载均衡器配置
   */
  getConfig(): LoadBalancerConfig {
    return { ...this.config };
  }

  /**
   * 更新负载均衡器配置
   */
  updateConfig(updates: Partial<LoadBalancerConfig>): void {
    Object.assign(this.config, updates);
  }
}

// 创建全局单例实例
export const globalLoadBalancer = new APILoadBalancer();
