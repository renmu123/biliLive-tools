import { afterEach, describe, expect, it, vi } from "vitest";
import { TikTokParser } from "@bililive-tools/stream-get";

import { provider } from "../src/index.js";
import { getInfo, getStream } from "../src/stream.js";

const sources = [
  {
    name: "默认线路",
    streams: [
      {
        url: "https://example.com/origin.flv",
        quality: "origin",
        qualityDesc: "原画",
        format: "flv",
        bitrate: 6_000_000,
        codec: "H264",
      },
      {
        url: "https://example.com/origin.m3u8",
        quality: "origin",
        qualityDesc: "原画",
        format: "hls",
        bitrate: 6_000_000,
        codec: "H264",
      },
      {
        url: "https://example.com/hd.flv",
        quality: "hd",
        qualityDesc: "高清",
        format: "flv",
        bitrate: 3_000_000,
        codec: "H264",
      },
      {
        url: "https://example.com/ld.flv",
        quality: "ld",
        qualityDesc: "流畅",
        format: "flv",
        bitrate: 800_000,
        codec: "H264",
      },
      {
        url: "https://example.com/audio.flv",
        quality: "ao",
        qualityDesc: "音频流",
        format: "flv",
        bitrate: 0,
        codec: "H264",
      },
    ],
  },
];

describe("TikTokRecorder stream", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("解析频道信息时将代理传给 TikTokParser", async () => {
    const getRoomInfo = vi.spyOn(TikTokParser.prototype, "getRoomInfo").mockResolvedValue({
      platform: "tiktok",
      roomId: "example",
      living: true,
      title: "测试直播",
      owner: "主播",
      avatar: "https://example.com/avatar.jpg",
      cover: "",
    });

    const result = await provider.resolveChannelInfoFromURL(
      "https://www.tiktok.com/@example/live",
      {
        proxy: "http://127.0.0.1:7890",
      },
    );

    expect(result).toMatchObject({
      id: "example",
      title: "测试直播",
      owner: "主播",
    });
    expect(Reflect.get(getRoomInfo.mock.instances[0], "options")).toEqual({
      proxy: "http://127.0.0.1:7890",
    });
  });

  it("获取直播信息并生成稳定的场次 ID", async () => {
    const startTime = new Date("2026-07-25T12:00:00.000Z");
    const getRoomInfo = vi.spyOn(TikTokParser.prototype, "getRoomInfo").mockResolvedValue({
      platform: "tiktok",
      roomId: "example",
      living: true,
      title: "测试直播",
      owner: "主播",
      avatar: "https://example.com/avatar.jpg",
      cover: "https://example.com/cover.jpg",
      liveStartTime: startTime,
      area: "",
      raw: {
        data: {
          user: {
            roomId: "7672766824583105301",
          },
        },
      },
    });

    const first = await getInfo("example", {
      api: "app",
      auth: "session=test",
      proxy: "http://127.0.0.1:7890",
    });
    const second = await getInfo("example", { api: "app" });

    expect(first).toMatchObject({
      living: true,
      title: "测试直播",
      owner: "主播",
      liveStartTime: startTime,
      webcastRoomId: "7672766824583105301",
    });
    expect(first.liveId).toBe(second.liveId);
    expect(getRoomInfo).toHaveBeenCalledWith("example", { api: "app", raw: true });
  });

  it("按 TikTok 原生画质和格式优先级选择直播流", async () => {
    const getStreams = vi.spyOn(TikTokParser.prototype, "getStreams").mockResolvedValue(sources);

    const origin = await getStream({
      channelId: "example",
      quality: "origin",
      api: "auto",
      codecName: "auto",
      formatPriorities: ["flv", "hls"],
    });
    const ld = await getStream({
      channelId: "example",
      quality: "ld",
      api: "auto",
      codecName: "auto",
      formatPriorities: ["hls", "flv"],
    });
    const audio = await getStream({
      channelId: "example",
      quality: "ao",
      api: "auto",
      codecName: "auto",
      formatPriorities: ["flv"],
    });

    expect(origin.currentStream.url).toBe("https://example.com/origin.flv");
    expect(ld.currentStream.url).toBe("https://example.com/ld.flv");
    expect(audio.currentStream.url).toBe("https://example.com/audio.flv");
    expect(origin.streams).toEqual([
      { desc: "原画" },
      { desc: "高清" },
      { desc: "流畅" },
      { desc: "音频流" },
    ]);
    expect(getStreams).toHaveBeenCalledWith(
      "example",
      expect.objectContaining({ format: ["hls", "flv"] }),
    );
  });

  it("严格画质不存在时拒绝回退", async () => {
    vi.spyOn(TikTokParser.prototype, "getStreams").mockResolvedValue(sources);

    await expect(
      getStream({
        channelId: "example",
        quality: "unknown",
        codecName: "auto",
        strictQuality: true,
      }),
    ).rejects.toThrow("strictQuality");
  });

  it("强制 HEVC 时校验实际返回的编码", async () => {
    const getStreams = vi.spyOn(TikTokParser.prototype, "getStreams").mockResolvedValue(sources);

    await expect(
      getStream({
        channelId: "example",
        quality: "origin",
        codecName: "hevc_only",
      }),
    ).rejects.toThrow("HEVC");
    expect(getStreams).toHaveBeenCalledWith(
      "example",
      expect.not.objectContaining({ hevc: expect.anything() }),
    );
  });

  it("同时存在 AVC 和 HEVC 时按编码配置选择", async () => {
    vi.spyOn(TikTokParser.prototype, "getStreams").mockResolvedValue([
      {
        name: "默认线路",
        streams: [
          ...sources[0].streams.slice(0, 2),
          {
            ...sources[0].streams[0],
            url: "https://example.com/origin-hevc.flv",
            codec: "H265",
          },
        ],
      },
    ]);

    const preferred = await getStream({
      channelId: "example",
      quality: "origin",
      codecName: "hevc",
      formatPriorities: ["flv", "hls"],
    });
    const forced = await getStream({
      channelId: "example",
      quality: "origin",
      codecName: "avc_only",
      formatPriorities: ["flv", "hls"],
    });

    expect(preferred.currentStream.url).toBe("https://example.com/origin-hevc.flv");
    expect(forced.currentStream.url).toBe("https://example.com/origin.flv");
  });
});
