import { globalLoadBalancer } from "./loadBalancer.js";
import type { APIType, LoadBalancerConfig } from "../types.js";

/**
 * 负载均衡器管理工具类
 * 提供简化的接口来管理和配置负载均衡器
 */
export class LoadBalancerManager {
  /**
   * 获取所有端点的当前状态
   */
  static getStatus() {
    return globalLoadBalancer.getEndpointStatus().map((status) => ({
      api: status.endpoint.name,
      priority: status.endpoint.priority,
      weight: status.endpoint.weight,
      failureCount: status.failureCount,
      isBlocked: status.isBlocked,
      lastFailureTime: status.lastFailureTime
        ? new Date(status.lastFailureTime).toISOString()
        : null,
      nextRetryTime: status.nextRetryTime ? new Date(status.nextRetryTime).toISOString() : null,
    }));
  }

  /**
   * 重置指定 API 的状态
   */
  static resetAPI(apiType: APIType) {
    if (apiType === "balance") {
      throw new Error("Cannot reset 'balance' type. Use resetAll() instead.");
    }
    globalLoadBalancer.resetEndpoint(apiType);
  }

  /**
   * 重置所有 API 的状态
   */
  static resetAll() {
    globalLoadBalancer.resetAllEndpoints();
  }

  /**
   * 更新 API 端点的配置
   */
  static updateAPIConfig(apiType: APIType, config: { priority?: number; weight?: number }) {
    if (apiType === "balance") {
      throw new Error("Cannot update 'balance' type configuration.");
    }
    globalLoadBalancer.updateEndpointConfig(apiType, config);
  }

  /**
   * 获取负载均衡器配置
   */
  static getConfig(): LoadBalancerConfig {
    return globalLoadBalancer.getConfig();
  }

  /**
   * 更新负载均衡器配置
   */
  static updateConfig(config: Partial<LoadBalancerConfig>) {
    globalLoadBalancer.updateConfig(config);
  }

  /**
   * 获取健康的（未被禁用的）API 列表
   */
  static getHealthyAPIs(): APIType[] {
    return globalLoadBalancer
      .getEndpointStatus()
      .filter((status) => !status.isBlocked)
      .map((status) => status.endpoint.name);
  }

  /**
   * 获取被禁用的 API 列表
   */
  static getBlockedAPIs(): APIType[] {
    return globalLoadBalancer
      .getEndpointStatus()
      .filter((status) => status.isBlocked)
      .map((status) => status.endpoint.name);
  }

  /**
   * 检查特定 API 是否可用
   */
  static isAPIHealthy(apiType: APIType): boolean {
    if (apiType === "balance") return true; // balance 类型总是可用的

    const status = globalLoadBalancer.getEndpointStatus().find((s) => s.endpoint.name === apiType);

    return status ? !status.isBlocked : false;
  }

  /**
   * 获取推荐使用的 API（基于当前状态和权重）
   */
  static getRecommendedAPI(): APIType | null {
    const healthyEndpoints = globalLoadBalancer
      .getEndpointStatus()
      .filter((status) => !status.isBlocked)
      .sort((a, b) => {
        if (a.endpoint.priority !== b.endpoint.priority) {
          return a.endpoint.priority - b.endpoint.priority;
        }
        return b.endpoint.weight - a.endpoint.weight;
      });

    return healthyEndpoints.length > 0 ? healthyEndpoints[0].endpoint.name : null;
  }

  /**
   * 打印当前负载均衡器状态（用于调试）
   */
  static printStatus() {
    console.log("=== 负载均衡器状态 ===");
    console.log("配置:", LoadBalancerManager.getConfig());
    console.log("端点状态:");
    console.table(LoadBalancerManager.getStatus());
    console.log("健康的 APIs:", LoadBalancerManager.getHealthyAPIs());
    console.log("被禁用的 APIs:", LoadBalancerManager.getBlockedAPIs());
    console.log("推荐 API:", LoadBalancerManager.getRecommendedAPI());
  }
}

// 暴露简化的管理函数
export const loadBalancer = {
  getStatus: LoadBalancerManager.getStatus,
  resetAPI: LoadBalancerManager.resetAPI,
  resetAll: LoadBalancerManager.resetAll,
  updateAPIConfig: LoadBalancerManager.updateAPIConfig,
  getConfig: LoadBalancerManager.getConfig,
  updateConfig: LoadBalancerManager.updateConfig,
  getHealthyAPIs: LoadBalancerManager.getHealthyAPIs,
  getBlockedAPIs: LoadBalancerManager.getBlockedAPIs,
  isAPIHealthy: LoadBalancerManager.isAPIHealthy,
  getRecommendedAPI: LoadBalancerManager.getRecommendedAPI,
  printStatus: LoadBalancerManager.printStatus,
};
