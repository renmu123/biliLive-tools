import { describe, it, expect } from "vitest";
import { StreamParser, BilibiliParser, UnsupportedPlatformError } from "../src/index.js";

describe("StreamParser", () => {
  it("should detect bilibili platform", () => {
    const parser = new StreamParser();
    const platform = parser.detectPlatform("https://live.bilibili.com/123");
    expect(platform).toBe("bilibili");
  });

  it("should detect douyin platform", () => {
    const parser = new StreamParser();
    const platform = parser.detectPlatform("https://live.douyin.com/456");
    expect(platform).toBe("douyin");
  });

  it("should detect douyu platform", () => {
    const parser = new StreamParser();
    const platform = parser.detectPlatform("https://www.douyu.com/789");
    expect(platform).toBe("douyu");
  });

  it("should detect huya platform", () => {
    const parser = new StreamParser();
    const platform = parser.detectPlatform("https://www.huya.com/abc");
    expect(platform).toBe("huya");
  });

  it("should return null for unsupported platform", () => {
    const parser = new StreamParser();
    const platform = parser.detectPlatform("https://example.com");
    expect(platform).toBeNull();
  });

  it("should list all platforms", () => {
    const parser = new StreamParser();
    const platforms = parser.listPlatforms();
    expect(platforms).toContain("bilibili");
    expect(platforms).toContain("douyin");
    expect(platforms).toContain("douyu");
    expect(platforms).toContain("huya");
  });

  it("should throw error for unsupported platform when parsing", async () => {
    const parser = new StreamParser();
    await expect(parser.parse("https://example.com")).rejects.toThrow(UnsupportedPlatformError);
  });
});

// 集成测试（需要网络，可以在 CI 中跳过）
describe.skip("Integration Tests", () => {
  it("should parse bilibili live room", async () => {
    const parser = new BilibiliParser();
    // 使用一个公开的直播间进行测试
    const result = await parser.parse("https://live.bilibili.com/1");

    expect(result.liveInfo).toBeDefined();
    expect(result.liveInfo.platform).toBe("bilibili");
    expect(result.liveInfo.roomId).toBe("1");
    expect(typeof result.liveInfo.living).toBe("boolean");
    expect(result.liveInfo.title).toBeTruthy();
    expect(result.liveInfo.owner).toBeTruthy();

    if (result.liveInfo.living) {
      expect(result.sources).toBeDefined();
      expect(result.sources.length).toBeGreaterThan(0);
      expect(result.sources[0].streams).toBeDefined();
      expect(result.sources[0].streams.length).toBeGreaterThan(0);

      const firstStream = result.sources[0].streams[0];
      expect(firstStream.url).toMatch(/^https?:\/\//);
      expect(typeof firstStream.quality).toBe("number");
      expect(firstStream.qualityDesc).toBeTruthy();
    }
  }, 30000);
});
