import Parser from "../../src/bilibili/parser.js";
import { describe, it, expect } from "vitest";

describe("B站链接解析", () => {
  it("标准直播链接：https://live.bilibili.com/xxx", async () => {
    const parser = new Parser();
    const roomId = await parser.extractRoomId("https://live.bilibili.com/47867");
    expect(roomId).toBe("47867");
  });
  it("短号直播链接：https://live.bilibili.com/14", async () => {
    const parser = new Parser();
    const roomId = await parser.extractRoomId("https://live.bilibili.com/14");
    expect(roomId).toBe("46937");
  });
});
