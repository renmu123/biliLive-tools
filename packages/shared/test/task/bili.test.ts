import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/task/video.js", () => ({
  getBinPath: vi.fn(),
  pasrseMetadata: vi.fn(),
}));

import { preFormatOptions } from "../../src/task/bili.js";
import { pasrseMetadata } from "../../src/task/video.js";

import type { BiliupConfig } from "@biliLive-tools/types";

const createConfig = (overrides: Partial<BiliupConfig> = {}): BiliupConfig => ({
  title: "{{title}}",
  partTitleTemplate: "P{{index}}-{{title}}-{{filename}}",
  desc: "{{user}}-{{roomId}}-{{filename}}",
  dolby: 0,
  hires: 0,
  copyright: 2,
  tag: ["test"],
  tid: 171,
  ...overrides,
});

describe("preFormatOptions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("存在 meta 时不再调用 pasrseMetadata", async () => {
    const result = await preFormatOptions(createConfig(), [
      {
        path: "C:/videos/part-1.mp4",
        meta: {
          title: "直播标题",
          username: "主播A",
          roomId: "1000",
          startTimestamp: 1710000000,
          platform: "bilibili",
        },
      },
      {
        path: "C:/videos/part-2.mp4",
        meta: {
          title: "直播标题2",
          username: "主播B",
          roomId: "2000",
          startTimestamp: 1710003600,
          platform: "douyu",
        },
      },
    ]);

    expect(pasrseMetadata).not.toHaveBeenCalled();
    expect(result.options.title).toBe("直播标题");
    expect(result.options.desc).toBe("主播A-1000-part-1.mp4");
    expect(result.options.source).toBe("https://live.bilibili.com/1000");
    expect(result.videos).toEqual([
      { path: "C:/videos/part-1.mp4", title: "P1-直播标题-part-1.mp4" },
      { path: "C:/videos/part-2.mp4", title: "P2-直播标题2-part-2.mp4" },
    ]);
  });

  it("缺少 meta 时仍会调用 pasrseMetadata", async () => {
    vi.mocked(pasrseMetadata).mockResolvedValue({
      title: "解析标题",
      username: "解析主播",
      roomId: "3000",
      startTimestamp: 1710007200,
      platform: "douyin",
    });

    const result = await preFormatOptions(createConfig(), ["C:/videos/only-part.mp4"]);

    expect(pasrseMetadata).toHaveBeenCalledWith({
      videoFilePath: "C:/videos/only-part.mp4",
    });
    expect(result.options.title).toBe("解析标题");
    expect(result.options.desc).toBe("解析主播-3000-only-part.mp4");
    expect(result.options.source).toBe("https://live.douyin.com/3000");
    expect(result.videos).toEqual([
      { path: "C:/videos/only-part.mp4", title: "P1-解析标题-only-part.mp4" },
    ]);
  });

  it("只有缺少 meta 的文件才会继续解析", async () => {
    vi.mocked(pasrseMetadata).mockResolvedValueOnce({
      title: "第二段标题",
      username: "主播C",
      roomId: "4000",
      startTimestamp: 1710010800,
      platform: "huya",
    });

    const result = await preFormatOptions(createConfig({ title: "固定标题" }), [
      {
        path: "C:/videos/part-1.mp4",
        meta: {
          title: "第一段标题",
          username: "主播A",
          roomId: "1000",
          startTimestamp: 1710000000,
          platform: "bilibili",
        },
      },
      {
        path: "C:/videos/part-2.mp4",
      },
    ]);

    expect(pasrseMetadata).toHaveBeenCalledWith({
      videoFilePath: "C:/videos/part-2.mp4",
    });
    expect(result.options.title).toBe("固定标题");
    expect(result.videos).toEqual([
      { path: "C:/videos/part-1.mp4", title: "P1-第一段标题-part-1.mp4" },
      { path: "C:/videos/part-2.mp4", title: "P2-第二段标题-part-2.mp4" },
    ]);
  });
});
