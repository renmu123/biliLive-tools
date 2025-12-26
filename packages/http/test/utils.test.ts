import { describe, it, expect } from "vitest";
import { buildRoomLink } from "../src/services/webhook/utils.js";

describe("buildRoomLink", () => {
  it("should return bilibili live room link", () => {
    const result = buildRoomLink("bilibili", "123456");
    expect(result).toBe("https://live.bilibili.com/123456");
  });

  it("should return bilibili live room link for case insensitive platform", () => {
    const result = buildRoomLink("BILIBILI", "123456");
    expect(result).toBe("https://live.bilibili.com/123456");
  });

  it("should return huya live room link", () => {
    const result = buildRoomLink("huya", "123456");
    expect(result).toBe("https://www.huya.com/123456");
  });

  it("should return douyu live room link", () => {
    const result = buildRoomLink("douyu", "123456");
    expect(result).toBe("https://www.douyu.com/123456");
  });

  it("should return douyin live room link", () => {
    const result = buildRoomLink("douyin", "123456");
    expect(result).toBe("https://live.douyin.com/123456");
  });

  it("should return null for unsupported platform", () => {
    const result = buildRoomLink("unknown", "123456");
    expect(result).toBe(null);
  });

  it("should return null for empty platform", () => {
    const result = buildRoomLink("", "123456");
    expect(result).toBe(null);
  });

  it("should handle special characters in roomId", () => {
    const result = buildRoomLink("bilibili", "test_room-123");
    expect(result).toBe("https://live.bilibili.com/test_room-123");
  });
});
