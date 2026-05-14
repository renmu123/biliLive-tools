import { DouyuParser } from "../../src/douyu/parser.js";
import { describe, it, expect } from "vitest";

describe("斗鱼链接解析", () => {
  // 斗鱼链接解析测试
  it("标准直播链接：https://www.douyu.com/633019", async () => {
    const parser = new DouyuParser();
    const roomId = await parser.getStreams("633019", {});
    console.log("解析结果", JSON.stringify(roomId, null, 2));
    // expect(roomId).toBe("2140934");
  });
});
