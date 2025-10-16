export type APIType = "web" | "webHTML" | "mobile" | "userHTML" | "auto";

export interface APIEndpoint {
  name: APIType;
  priority: number; // 优先级，数字越小优先级越高
  weight: number; // 权重，用于负载均衡
}

export interface APIEndpointStatus {
  endpoint: APIEndpoint;
  failureCount: number;
  lastFailureTime: number;
  isBlocked: boolean;
  nextRetryTime: number;
}

export interface LoadBalancerConfig {
  maxFailures: number; // 最大失败次数，超过后进入禁用状态
  blockDuration: number; // 禁用时长（毫秒）
  retryMultiplier: number; // 重试倍增系数
  healthCheckInterval: number; // 健康检查间隔（毫秒）
}

export interface RoomInfo {
  living: boolean;
  nickname: string;
  sec_uid: string;
  avatar: string;
  api: Exclude<APIType, "auto">;
  room: {
    title: string;
    cover: string;
    id_str: string;
    stream_url: any | null;
  } | null;
}
