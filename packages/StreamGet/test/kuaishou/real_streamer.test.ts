import { describe, test, expect } from "vitest";
import { KuaishouParser } from "../../src/kuaishou/parser.js";

describe("快手真实主播测试", () => {
  test("解析主播 KPL704668133 的快手页面", async () => {
    const parser = new KuaishouParser();
    const result = await parser.getStreams(
      "https://live.kuaishou.com/u/KPL704668133"
    );

    console.log("解析结果:", JSON.stringify(result, null, 2));

    // 无论是否在播，都应该返回合法结构
    expect(result).toHaveProperty("platform", "kuaishou");
    expect(result).toHaveProperty("roomId", "KPL704668133");
    expect(result).toHaveProperty("living");
    expect(result).toHaveProperty("streams");
    expect(Array.isArray(result.streams)).toBe(true);
  }, 15000);
});
