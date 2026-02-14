/**
 * StreamGet 使用示例
 */

import { StreamParser, BilibiliParser, DouyinParser } from "./src/index.js";

// 示例 1: 通用解析（自动检测平台）
async function example1() {
  console.log("\n=== 示例 1: 通用解析 ===\n");

  const parser = new StreamParser({
    // proxy: 'http://127.0.0.1:7890', // 如果需要代理，取消注释
    timeout: 15000,
  });

  // 检测平台
  const url = "https://live.bilibili.com/1";
  const platform = parser.detectPlatform(url);
  console.log(`检测到平台: ${platform}`);

  // 列出所有支持的平台
  const platforms = parser.listPlatforms();
  console.log(`支持的平台: ${platforms.join(", ")}`);

  try {
    // 完整解析
    const result = await parser.parse(url);

    console.log(`\n直播间信息:`);
    console.log(`  平台: ${result.liveInfo.platform}`);
    console.log(`  房间号: ${result.liveInfo.roomId}`);
    console.log(`  主播: ${result.liveInfo.owner}`);
    console.log(`  标题: ${result.liveInfo.title}`);
    console.log(`  直播中: ${result.liveInfo.living}`);

    if (result.liveInfo.living && result.sources.length > 0) {
      console.log(`\n可用线路: ${result.sources.length} 个`);
      const firstSource = result.sources[0];
      console.log(`  线路名: ${firstSource.name}`);
      console.log(`  可用画质: ${firstSource.streams.length} 个`);

      // 显示第一个流
      const firstStream = firstSource.streams[0];
      console.log(`\n第一个流信息:`);
      console.log(`  画质: ${firstStream.qualityDesc} (qn: ${firstStream.quality})`);
      console.log(`  格式: ${firstStream.format}`);
      console.log(`  URL: ${firstStream.url.substring(0, 80)}...`);
    }
  } catch (error) {
    console.error(`解析失败: ${(error as Error).message}`);
  }
}

// 示例 2: Bilibili 特定调用
async function example2() {
  console.log("\n=== 示例 2: Bilibili 特定调用 ===\n");

  const parser = new BilibiliParser({
    // cookie: 'your_cookie_here', // 如果需要高画质
    // proxy: 'http://127.0.0.1:7890', // 如果需要代理
  });

  const roomId = "1";

  try {
    // 获取直播信息
    console.log(`获取房间 ${roomId} 的信息...`);
    const liveInfo = await parser.getLiveInfo(roomId);

    console.log(`\n直播间信息:`);
    console.log(`  主播: ${liveInfo.owner}`);
    console.log(`  标题: ${liveInfo.title}`);
    console.log(`  直播中: ${liveInfo.living}`);
    console.log(`  UID: ${liveInfo.uid}`);

    if (liveInfo.living) {
      // 获取流地址
      console.log(`\n获取流地址...`);
      const sources = await parser.getStreams(roomId, {
        qn: 10000, // 请求原画
      });

      console.log(`\n找到 ${sources.length} 个线路`);

      sources.forEach((source, idx) => {
        console.log(`\n线路 ${idx + 1}: ${source.name}`);
        source.streams.slice(0, 3).forEach((stream) => {
          console.log(
            `  - ${stream.qualityDesc} (qn:${stream.quality}) ${stream.format} ${stream.codec}`,
          );
        });
      });
    }
  } catch (error) {
    console.error(`获取失败: ${(error as Error).message}`);
  }
}

// 示例 3: 错误处理
async function example3() {
  console.log("\n=== 示例 3: 错误处理 ===\n");

  const parser = new StreamParser();

  // 测试不支持的平台
  try {
    await parser.parse("https://example.com");
  } catch (error) {
    console.log(`捕获到错误: ${(error as Error).name}`);
    console.log(`错误信息: ${(error as Error).message}`);
  }

  // 测试无效房间
  try {
    const biliParser = new BilibiliParser();
    await biliParser.getLiveInfo("99999999999");
  } catch (error) {
    console.log(`\n捕获到错误: ${(error as Error).name}`);
    console.log(`错误信息: ${(error as Error).message}`);
  }
}

// 示例 4: 代理配置
async function example4() {
  console.log("\n=== 示例 4: 代理配置 ===\n");

  // HTTP 代理（简写形式）
  const parser1 = new BilibiliParser({
    proxy: "http://127.0.0.1:7890",
  });
  console.log("配置 HTTP 代理: http://127.0.0.1:7890");

  // SOCKS5 代理（完整形式）
  const parser2 = new BilibiliParser({
    proxy: {
      uri: "socks5://127.0.0.1:1080",
      token: "auth_token", // 如果需要认证
    },
  });
  console.log("配置 SOCKS5 代理: socks5://127.0.0.1:1080");

  // 方法级别的代理配置（覆盖构造函数配置）
  const parser3 = new BilibiliParser();
  // await parser3.getLiveInfo('1', {
  //   proxy: 'http://127.0.0.1:8888'
  // });
  console.log("可以在方法级别覆盖代理配置");
}

// 运行示例
async function main() {
  console.log("StreamGet 使用示例");
  console.log("=".repeat(50));

  // 注意：实际网络请求需要在有网络的环境下运行
  // 如果没有网络，可以只运行 example4 查看配置方式

  // await example1();
  // await example2();
  await example3();
  await example4();

  console.log("\n" + "=".repeat(50));
  console.log("示例运行完毕");
  console.log("\n提示：取消注释 example1() 和 example2() 来测试实际的网络请求");
}

// main().catch(console.error);
