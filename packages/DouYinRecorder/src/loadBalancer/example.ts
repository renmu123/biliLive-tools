/**
 * 抖音录播器负载均衡使用示例
 */
import { getInfo } from "../stream.js";
import { loadBalancer } from "./loadBalancerManager.js";

async function basicExample() {
  console.log("=== 基本使用示例 ===");

  try {
    // 使用负载均衡模式获取房间信息
    const roomInfo = await getInfo("测试房间ID", {
      api: "balance", // 关键：使用balance模式启用负载均衡
      cookie: "your-cookie-here",
    });

    console.log("获取到房间信息:", {
      title: roomInfo.title,
      owner: roomInfo.owner,
      living: roomInfo.living,
    });
  } catch (error) {
    console.error("获取房间信息失败:", error.message);
  }
}

async function managementExample() {
  console.log("\n=== 管理功能示例 ===");

  // 1. 查看当前状态
  console.log("1. 当前负载均衡器状态:");
  loadBalancer.printStatus();

  // 2. 检查API健康状态
  console.log("\n2. API健康状态检查:");
  const apis = ["web", "webHTML", "mobile", "userHTML"];
  apis.forEach((api) => {
    const isHealthy = loadBalancer.isAPIHealthy(api as any);
    console.log(`${api}: ${isHealthy ? "✅ 健康" : "❌ 不健康"}`);
  });

  // 3. 获取推荐API
  const recommendedAPI = loadBalancer.getRecommendedAPI();
  console.log(`\n3. 推荐使用的API: ${recommendedAPI}`);

  // 4. 配置调整示例
  console.log("\n4. 配置调整示例:");
  console.log("原始配置:", loadBalancer.getConfig());

  // 调整配置：更保守的失败策略
  loadBalancer.updateConfig({
    maxFailures: 2, // 减少到2次失败就禁用
    blockDuration: 120000, // 禁用2分钟
  });

  console.log("调整后配置:", loadBalancer.getConfig());

  // 5. API权重调整示例
  console.log("\n5. API权重调整示例:");
  console.log("调整前状态:");
  console.table(loadBalancer.getStatus());

  // 提高mobile接口的优先级和权重
  loadBalancer.updateAPIConfig("mobile", {
    priority: 1, // 最高优先级
    weight: 5, // 最高权重
  });

  console.log("调整mobile接口权重后:");
  console.table(loadBalancer.getStatus());
}

async function errorHandlingExample() {
  console.log("\n=== 错误处理示例 ===");

  // 模拟检查被禁用的API
  const blockedAPIs = loadBalancer.getBlockedAPIs();
  if (blockedAPIs.length > 0) {
    console.log(`发现 ${blockedAPIs.length} 个被禁用的API:`, blockedAPIs);

    // 可以选择重置这些API
    console.log("重置被禁用的API...");
    blockedAPIs.forEach((api) => {
      loadBalancer.resetAPI(api);
    });

    console.log("重置完成，当前健康的API:", loadBalancer.getHealthyAPIs());
  } else {
    console.log("所有API都处于健康状态 ✅");
  }
}

async function monitoringExample() {
  console.log("\n=== 监控示例 ===");

  // 模拟监控函数
  function checkSystemHealth() {
    const status = loadBalancer.getStatus();
    const healthyCount = status.filter((s) => !s.isBlocked).length;
    const totalCount = status.length;

    console.log(`系统健康状态: ${healthyCount}/${totalCount} 个API可用`);

    if (healthyCount < totalCount / 2) {
      console.warn("⚠️  警告：超过一半的API不可用！");
      loadBalancer.printStatus();

      // 可以触发告警或自动恢复逻辑
      console.log("执行自动恢复...");
      loadBalancer.resetAll();
    }

    // 显示详细状态
    status.forEach((s) => {
      if (s.isBlocked) {
        const retryTime = new Date(s.nextRetryTime).toLocaleString();
        console.log(`❌ ${s.api}: 被禁用，下次重试时间: ${retryTime}`);
      } else if (s.failureCount > 0) {
        console.log(`⚠️  ${s.api}: 失败 ${s.failureCount} 次，仍可用`);
      } else {
        console.log(`✅ ${s.api}: 健康`);
      }
    });
  }

  // 执行健康检查
  checkSystemHealth();

  // 在实际应用中，可以设置定时器
  // setInterval(checkSystemHealth, 60000); // 每分钟检查一次
}

// 主函数
async function runExamples() {
  try {
    await basicExample();
    await managementExample();
    await errorHandlingExample();
    await monitoringExample();

    console.log("\n=== 示例执行完成 ===");
    console.log("\n最终状态:");
    loadBalancer.printStatus();
  } catch (error) {
    console.error("示例执行失败:", error);
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples();
}

export { runExamples };
