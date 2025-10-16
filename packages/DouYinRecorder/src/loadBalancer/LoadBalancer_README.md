# 抖音录播器负载均衡功能

## 概述

新增了 `balance` API 类型，实现了智能负载均衡调用多个抖音API接口。当某个接口连续失败时，会自动禁用该接口一段时间，确保系统的稳定性和可用性。

## 功能特性

- **智能负载均衡**: 根据权重和优先级自动选择最合适的API接口
- **失败重试机制**: 接口失败时自动切换到其他可用接口
- **熔断保护**: 连续失败的接口会被临时禁用，避免持续调用失败的接口
- **自动恢复**: 被禁用的接口在一定时间后会自动恢复，支持指数退避
- **动态配置**: 支持运行时调整接口优先级、权重和负载均衡参数
- **状态监控**: 提供详细的接口状态信息，便于调试和监控

## 使用方法

### 基本使用

```typescript
import { getInfo } from "@bililive-tools/douyin-recorder";

// 使用负载均衡模式获取房间信息
const roomInfo = await getInfo("房间ID", {
  api: "balance", // 使用负载均衡
  cookie: "your-cookie",
});
```

### 负载均衡器管理

```typescript
import { loadBalancer } from "@bililive-tools/douyin-recorder";

// 查看当前状态
loadBalancer.printStatus();

// 获取健康的API列表
const healthyAPIs = loadBalancer.getHealthyAPIs();
console.log("健康的APIs:", healthyAPIs);

// 获取被禁用的API列表
const blockedAPIs = loadBalancer.getBlockedAPIs();
console.log("被禁用的APIs:", blockedAPIs);

// 检查特定API是否健康
const isWebHealthy = loadBalancer.isAPIHealthy("web");
console.log("Web API是否健康:", isWebHealthy);

// 获取推荐的API
const recommendedAPI = loadBalancer.getRecommendedAPI();
console.log("推荐使用的API:", recommendedAPI);
```

### 配置管理

```typescript
// 查看当前配置
const config = loadBalancer.getConfig();
console.log("当前配置:", config);

// 更新配置
loadBalancer.updateConfig({
  maxFailures: 2, // 最大失败次数（默认3次）
  blockDuration: 300000, // 禁用时长5分钟（默认5分钟）
  retryMultiplier: 1.5, // 重试倍增系数（默认2倍）
});

// 更新特定API的权重和优先级
loadBalancer.updateAPIConfig("mobile", {
  priority: 1, // 优先级（数字越小优先级越高）
  weight: 5, // 权重（数字越大权重越高）
});
```

### 重置和恢复

```typescript
// 重置所有API状态
loadBalancer.resetAll();

// 重置特定API状态
loadBalancer.resetAPI("web");
```

## API 接口优先级

默认的API接口优先级配置（数字越小优先级越高）：

1. **web** (优先级: 1, 权重: 3) - 主要接口，最稳定
2. **webHTML** (优先级: 2, 权重: 2) - HTML解析接口
3. **mobile** (优先级: 3, 权重: 2) - 移动端接口
4. **userHTML** (优先级: 4, 权重: 1) - 用户页面解析，备用

## 配置参数说明

| 参数                  | 默认值         | 说明                     |
| --------------------- | -------------- | ------------------------ |
| `maxFailures`         | 3              | 连续失败多少次后禁用接口 |
| `blockDuration`       | 300000 (5分钟) | 接口被禁用的时长（毫秒） |
| `retryMultiplier`     | 2              | 重试时间倍增系数         |
| `healthCheckInterval` | 30000 (30秒)   | 健康检查间隔（未使用）   |

## 状态信息

每个API接口的状态包含：

- **api**: 接口名称
- **priority**: 优先级
- **weight**: 权重
- **failureCount**: 失败次数
- **isBlocked**: 是否被禁用
- **lastFailureTime**: 最后失败时间
- **nextRetryTime**: 下次重试时间

## 使用场景

### 1. 高可用性录播

```typescript
// 在录播器中使用auto模式确保高可用性
const recorder = provider.createRecorder({
  channelId: "房间ID",
  api: "balance", // 自动负载均衡
  // ... 其他配置
});
```

### 2. 接口监控

```typescript
// 定期检查接口状态
setInterval(() => {
  const status = loadBalancer.getStatus();
  const blockedCount = status.filter((s) => s.isBlocked).length;

  if (blockedCount > 0) {
    console.warn(`警告: ${blockedCount} 个API接口被禁用`);
    loadBalancer.printStatus();
  }
}, 60000); // 每分钟检查一次
```

### 3. 动态调优

```typescript
// 根据实际使用情况调整配置
if (loadBalancer.getBlockedAPIs().length > 2) {
  // 如果禁用的接口太多，降低失败阈值
  loadBalancer.updateConfig({ maxFailures: 5 });
}
```

## 注意事项

1. **cookie 参数**: 使用 `balance` 模式时，所有API接口都会使用相同的cookie参数
2. **接口限制**: `userHTML` 接口在某些功能中会被自动替换为 `web` 接口
3. **性能考虑**: 负载均衡会增加少量开销，但能显著提高系统稳定性
4. **监控建议**: 建议在生产环境中定期监控接口状态，及时发现问题

## 故障排除

### 所有接口都被禁用

```typescript
// 检查状态
loadBalancer.printStatus();

// 重置所有接口
loadBalancer.resetAll();

// 或者调整配置
loadBalancer.updateConfig({
  maxFailures: 10, // 增加失败阈值
  blockDuration: 60000, // 减少禁用时长到1分钟
});
```

### 特定接口频繁失败

```typescript
// 降低问题接口的权重
loadBalancer.updateAPIConfig("problematic-api", { weight: 1 });

// 或者提高其他接口的权重
loadBalancer.updateAPIConfig("stable-api", { weight: 10 });
```
