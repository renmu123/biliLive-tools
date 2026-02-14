import { DouyuParser } from "../../src/douyu/parser.js";
import { describe, it, expect } from "vitest";

describe("斗鱼链接解析", () => {
  // 斗鱼链接解析测试
  it("标准直播链接：https://www.douyu.com/xxx", async () => {
    const parser = new DouyuParser();
    const roomId = await parser.extractRoomId("https://www.douyu.com/93589");
    expect(roomId).toBe("93589");
  });
});
