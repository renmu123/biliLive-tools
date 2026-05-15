import { DouyuParser } from "../../src/douyu/parser.js";
import { describe, it, expect } from "vitest";

describe("斗鱼链接解析", () => {
  // 斗鱼链接解析测试
  it("标准直播链接", async () => {
    const parser = new DouyuParser();
    const roomId = await parser.extractRoomId("https://www.douyu.com/2140934");
    expect(roomId).toBe("2140934");
  });
  it("带beta参数的链接", async () => {
    const parser = new DouyuParser();
    const roomId = await parser.extractRoomId("https://www.douyu.com/beta/2140934");
    expect(roomId).toBe("2140934");
  });
  it("带查询参数的链接", async () => {
    const parser = new DouyuParser();
    const roomId = await parser.extractRoomId("https://www.douyu.com/topic/zd6?rid=2140934");
    expect(roomId).toBe("2140934");
  });
  it("短号链接", async () => {
    const parser = new DouyuParser();
    const roomId = await parser.extractRoomId("https://www.douyu.com/92000");
    expect(roomId).toBe("2947432");
  });
});
