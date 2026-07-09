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

describe("斗鱼房间数据解析", () => {
  it("不开播的直播间", async () => {
    const parser = new DouyuParser();
    const data = await parser.getRoomInfo("265438");
    expect(data.living).toBe(false);
  });
  // it("开播的直播间", async () => {
  //   const parser = new DouyuParser();
  //   const data = await parser.getRoomInfo("2140934");
  //   console.log("房间信息", JSON.stringify(data, null, 2));
  //   expect(data.living).toBe(true);
  // });
  it("轮播时living状态必须为false", async () => {
    const parser = new DouyuParser();
    const data = await parser.getRoomInfo("8977896");
    expect(data.living).toBe(false);
  });
  it("不存在的房间号", async () => {
    const parser = new DouyuParser();
    try {
      await parser.getRoomInfo("21409341111");
      throw new Error("Expected getRoomInfo to throw an error");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("该房间目前没有开放");
    }
  });
  it("房间已被关闭", async () => {
    const parser = new DouyuParser();
    try {
      await parser.getRoomInfo("229346");
      throw new Error("Expected getRoomInfo to throw an error");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("您观看的房间已被关闭");
    }
  });
});
