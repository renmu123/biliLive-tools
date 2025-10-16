import { getInfo } from "../src/stream.js";
import { loadBalancer } from "../src/loadBalancer/loadBalancerManager.js";

/**
 * 测试负载均衡器功能
 */
async function testLoadBalancer() {
  console.log("=== 负载均衡器测试开始 ===");

  // 显示初始状态
  console.log("\n1. 初始状态:");
  loadBalancer.printStatus();

  // 测试有效的抖音直播间ID（需要替换为实际的直播间ID）
  const testRoomId = "123456789"; // 请替换为有效的直播间ID

  try {
    console.log(`\n2. 测试使用 balance 模式获取房间信息 (房间ID: ${testRoomId}):`);

    // 使用 balance 模式进行多次调用来测试负载均衡
    for (let i = 1; i <= 5; i++) {
      try {
        console.log(`\n尝试 ${i}:`);
        const info = await getInfo(testRoomId, { api: "balance" });
        console.log(`成功获取房间信息: ${info.title} by ${info.owner}`);

        // 显示当前状态
        const healthyAPIs = loadBalancer.getHealthyAPIs();
        const blockedAPIs = loadBalancer.getBlockedAPIs();
        console.log(`健康的 APIs: ${healthyAPIs.join(", ")}`);
        console.log(`被禁用的 APIs: ${blockedAPIs.join(", ")}`);
      } catch (error: any) {
        console.error(`调用失败:`, error.message);
      }

      // 等待一秒后继续下一次调用
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error("测试过程中发生错误:", error);
  }

  console.log("\n3. 最终状态:");
  loadBalancer.printStatus();

  console.log("\n4. 测试管理功能:");

  // 测试获取推荐API
  const recommendedAPI = loadBalancer.getRecommendedAPI();
  console.log(`推荐的 API: ${recommendedAPI}`);

  // 测试配置更新
  console.log("\n更新配置前:");
  console.log("当前配置:", loadBalancer.getConfig());

  loadBalancer.updateConfig({
    maxFailures: 2, // 减少最大失败次数
    blockDuration: 2 * 60 * 1000, // 减少禁用时间到2分钟
  });

  console.log("更新配置后:");
  console.log("新配置:", loadBalancer.getConfig());

  // 测试重置功能
  console.log("\n5. 测试重置功能:");
  console.log("重置前被禁用的 APIs:", loadBalancer.getBlockedAPIs());

  loadBalancer.resetAll();

  console.log("重置后被禁用的 APIs:", loadBalancer.getBlockedAPIs());
  console.log("重置后健康的 APIs:", loadBalancer.getHealthyAPIs());

  console.log("\n=== 负载均衡器测试完成 ===");
}

/**
 * 测试特定API的健康状态检查
 */
function testAPIHealthCheck() {
  console.log("\n=== API 健康状态检查测试 ===");

  const apis = ["web", "webHTML", "mobile", "userHTML"];

  apis.forEach((api) => {
    const isHealthy = loadBalancer.isAPIHealthy(api as any);
    console.log(`${api}: ${isHealthy ? "健康" : "不健康"}`);
  });
}

/**
 * 演示如何手动配置API权重和优先级
 */
function demonstrateAPIConfiguration() {
  console.log("\n=== API 配置演示 ===");

  console.log("原始配置:");
  loadBalancer.printStatus();

  // 调整API权重，让mobile接口优先级更高
  try {
    loadBalancer.updateAPIConfig("mobile", { priority: 1, weight: 5 });
    loadBalancer.updateAPIConfig("web", { priority: 2, weight: 3 });

    console.log("\n调整后的配置:");
    loadBalancer.printStatus();

    console.log(`推荐的 API: ${loadBalancer.getRecommendedAPI()}`);
  } catch (error: any) {
    console.error("配置更新失败:", error.message);
  }
}

// 如果直接运行此文件，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      testAPIHealthCheck();
      demonstrateAPIConfiguration();

      // 注意：下面的测试需要有效的直播间ID，可能会实际调用API
      // await testLoadBalancer();
    } catch (error) {
      console.error("测试失败:", error);
    }
  })();
}

export { testLoadBalancer, testAPIHealthCheck, demonstrateAPIConfiguration };
