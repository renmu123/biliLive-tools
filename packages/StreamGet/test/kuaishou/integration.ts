/**
 * 快手提取器集成测试
 * 
 * 测试链路：真实 SSR HTML → parseInitialState → extractStreams
 * 使用 mock 数据模拟在播场景，使用真实快手页面测试离线场景
 */
import { parseInitialState, extractStreams } from "../../src/kuaishou/api.js";
import fs from "fs";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e: any) {
    failed++;
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// ============ Test 1: 真实快手离线页面 ============
console.log("\n=== Test 1: parseInitialState (真实快手页面, 未开播主播) ===");
(() => {
  const html = fs.readFileSync("/tmp/ks-live-NGGG2120.html", "utf-8");
  test("parseInitialState 能成功解析真实 HTML", () => {
    const data = parseInitialState(html);
    assert(data && typeof data === "object", "应返回对象");
  });

  test("解析后的数据中有 liveroom", () => {
    const data = parseInitialState(html);
    assert(data.liveroom !== undefined, "应有 liveroom");
  });

  test("extractStreams 对未开播主播返回空数组", () => {
    const data = parseInitialState(html);
    const sources = extractStreams(data.liveroom);
    assert(Array.isArray(sources), "应返回数组");
    assert(sources.length === 0, "未开播应返回空数组");
  });
})();

// ============ Test 2: Mock 已开播数据 (正常 path) ============
console.log("\n=== Test 2: Mock 已开播数据 (全链路流程) ===");
(() => {
  const mockData = JSON.parse(
    fs.readFileSync("./test/kuaishou/__mocks__/page-live.json", "utf-8")
  );
  const liveroom = mockData.liveroom;
  
  test("mock 直播数据 liveroom 存在且有 playList", () => {
    assert(liveroom?.playList?.length > 0, "应有 playList");
  });

  test("isLiving 为 true", () => {
    assert(liveroom.playList[0].isLiving === true, "主播应在播");
  });

  const sources = extractStreams(liveroom);

  test("extractStreams 返回非空数组", () => {
    assert(sources.length > 0, "应有流地址");
  });

  test("每条 source 有 name 和 streams 数组", () => {
    for (const s of sources) {
      assert(typeof s.name === "string" && s.name.length > 0, "source 应有 name");
      assert(Array.isArray(s.streams) && s.streams.length > 0, "source 应有 streams");
    }
  });

  test("每个 stream 有 url/quality/format/bitrate", () => {
    for (const s of sources) {
      for (const st of s.streams) {
        assert(typeof st.url === "string" && st.url.length > 0, "stream 应有 url");
        assert(typeof st.quality === "string", "stream 应有 quality");
        assert(typeof st.format === "string", "stream 应有 format");
        assert(typeof st.bitrate === "number", "stream 应有 bitrate");
      }
    }
  });

  // 验证 CDN 分组: 不同 URL hostname 分为不同 sources
  const cdnNames = new Set(sources.map((s: any) => s.name));
  test(`CDN 分组: ${cdnNames.size} 个 CDN`, () => {
    assert(cdnNames.size >= 1, "至少有一个 CDN");
  });
})();

// ============ Test 3: mock 离线数据 ============
console.log("\n=== Test 3: Mock 未开播数据 ===");
(() => {
  const mockData = JSON.parse(
    fs.readFileSync("./test/kuaishou/__mocks__/page-offline.json", "utf-8")
  );
  const liveroom = mockData.liveroom;
  
  test("离线页面 isLiving 为 false", () => {
    assert(liveroom.playList[0].isLiving === false, "主播应未开播");
  });

  test("extractStreams 返回空数组", () => {
    const sources = extractStreams(liveroom);
    assert(sources.length === 0, "未开播应返回空");
  });
})();

// ============ Test 4: mock 已开播但无流 ============
console.log("\n=== Test 4: Mock 已开播但无流数据 ===");
(() => {
  const mockData = JSON.parse(
    fs.readFileSync("./test/kuaishou/__mocks__/page-live-empty-reps.json", "utf-8")
  );
  const liveroom = mockData.liveroom;
  
  test("在线但无流时 isLiving 为 true", () => {
    assert(liveroom.playList[0].isLiving === true, "主播在播");
  });

  test("extractStreams 返回空数组 (无 representation)", () => {
    const sources = extractStreams(liveroom);
    assert(sources.length === 0, "无流应返回空");
  });
})();

// ============ 结果 ============
console.log(`\n=== 结果: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  throw new Error(`${failed} test(s) failed`);
}
