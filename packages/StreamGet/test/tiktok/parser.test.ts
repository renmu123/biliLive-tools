import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpClient } from "../../src/http.js";
import { TikTokParser } from "../../src/tiktok/parser.js";
import type { TikTokResponse } from "../../src/tiktok/types.js";

function makeStreamData(codec = "H264") {
  return {
    pull_data: {
      stream_data: JSON.stringify({
        data: {
          origin: {
            main: {
              flv: "https://example.com/live/origin.flv",
              hls: "https://example.com/live/origin.m3u8?token=abc",
              sdk_params: JSON.stringify({
                VCodec: codec,
                definition: "origin",
                resolution: "1920x1080",
                vbitrate: 6000000,
              }),
            },
          },
          hd: {
            main: {
              flv: "https://example.com/live/hd.flv",
              hls: "https://example.com/live/hd.m3u8",
              sdk_params: JSON.stringify({
                VCodec: codec,
                definition: "hd",
                resolution: "1280x720",
                vbitrate: 3000000,
              }),
            },
          },
        },
      }),
    },
  };
}

function makeLiveResponse(): TikTokResponse {
  return {
    data: {
      user: {
        nickname: "主播",
        uniqueId: "example",
        status: 2,
        avatarThumb: "https://example.com/avatar.jpg",
        avatarMedium: "https://example.com/avatar.jpg",
        avatarLarger: "https://example.com/avatar.jpg",
      },
      liveRoom: {
        title: "测试直播",
        startTime: 1710000000,
        coverUrl: "https://example.com/cover.jpg",
        streamData: makeStreamData(),
        hevcStreamData: makeStreamData("H265"),
      },
    },
  };
}

describe("TikTokParser", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("解析标准直播链接和用户 ID", async () => {
    const parser = new TikTokParser();

    await expect(parser.extractRoomId("https://www.tiktok.com/@example/live")).resolves.toBe(
      "example",
    );
    await expect(parser.extractRoomId("@example")).resolves.toBe("example");
  });

  it("从 web 接口解析直播信息和全部画质", async () => {
    const get = vi.spyOn(HttpClient.prototype, "get").mockResolvedValue(makeLiveResponse());
    const parser = new TikTokParser();

    const result = await parser.parse("example", {
      api: "web",
      cookie: "sessionid=test-cookie",
    });
    const url = new URL(get.mock.calls[0][0]);

    expect(url.pathname).toBe("/api-live/user/room");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      aid: "1988",
      app_language: "zh-Hans",
      app_name: "tiktok_web",
      browser_platform: "Win32",
      channel: "tiktok_web",
      device_id: "7666124801702397441",
      device_platform: "web_mobile",
      os: "android",
      priority_region: "JP",
      region: "JP",
      tz_name: "Asia/Hong_Kong",
      uniqueId: "example",
    });
    expect(result.liveInfo).toMatchObject({
      platform: "tiktok",
      roomId: "example",
      living: true,
      title: "测试直播",
      owner: "主播",
      avatar: "https://example.com/avatar.jpg",
      cover: "https://example.com/cover.jpg",
    });
    expect(result.sources).toHaveLength(1);
    expect(result.sources[0].streams).toHaveLength(8);
    expect(result.sources[0].streams[0]).toMatchObject({
      quality: "origin",
      qualityDesc: "origin",
      format: "flv",
      codec: "H264",
      bitrate: 6000000,
      resolution: "1920x1080",
      url: "https://example.com/live/origin.flv?codec=H264",
    });
    expect(result.sources[0].streams[1].url).toBe(
      "https://example.com/live/origin.m3u8?token=abc&codec=H264",
    );
    expect(get).toHaveBeenCalledOnce();
    expect(get.mock.calls[0][1]?.headers).toMatchObject({
      cookie: "sessionid=test-cookie",
    });
  });

  it("同时解析 AVC、HEVC 并支持格式筛选", async () => {
    vi.spyOn(HttpClient.prototype, "get").mockResolvedValue(makeLiveResponse());
    const parser = new TikTokParser();

    const streams = await parser.getStreams("example", {
      api: "web",
      format: ["hls"],
    });

    expect(streams[0].streams).toHaveLength(4);
    expect(streams[0].streams.every((stream) => stream.format === "hls")).toBe(true);
    expect(streams[0].streams.map((stream) => stream.codec)).toEqual([
      "H264",
      "H264",
      "H265",
      "H265",
    ]);
  });

  it("支持默认代理和单次调用覆盖代理", async () => {
    const get = vi.spyOn(HttpClient.prototype, "get").mockResolvedValue(makeLiveResponse());
    const parser = new TikTokParser({
      proxy: "http://127.0.0.1:7890",
      timeout: 10000,
    });

    await parser.getRoomInfo("example", { api: "web" });
    await parser.getRoomInfo("example", {
      api: "web",
      proxy: "http://127.0.0.1:8899",
      timeout: 20000,
    });

    expect(get.mock.calls[0][1]).toMatchObject({
      proxy: "http://127.0.0.1:7890",
      timeout: 10000,
    });
    expect(get.mock.calls[1][1]).toMatchObject({
      proxy: "http://127.0.0.1:8899",
      timeout: 20000,
    });
  });

  it("未开播时返回空流列表", async () => {
    const response = makeLiveResponse();
    response.data!.user!.status = 4;
    vi.spyOn(HttpClient.prototype, "get").mockResolvedValue(response);
    const parser = new TikTokParser();

    const result = await parser.parse("example", { api: "web" });

    expect(result.liveInfo.living).toBe(false);
    expect(result.sources).toEqual([]);
  });

  it("支持网页 SIGI_STATE 数据", async () => {
    const response: TikTokResponse = {
      LiveRoom: { liveRoomUserInfo: makeLiveResponse().data! },
    };
    vi.spyOn(HttpClient.prototype, "getText").mockResolvedValue(
      `<html><script type="application/json" id="SIGI_STATE">${JSON.stringify(response)}</script></html>`,
    );
    const parser = new TikTokParser();

    const info = await parser.getRoomInfo("example", { api: "webHTML" });

    expect(info.living).toBe(true);
    expect(info.title).toBe("测试直播");
  });

  it("随机模式在 web 接口和直播 HTML 解析之间选择", async () => {
    const get = vi.spyOn(HttpClient.prototype, "get").mockResolvedValue(makeLiveResponse());
    const getText = vi.spyOn(HttpClient.prototype, "getText").mockResolvedValue(
      `<script id="SIGI_STATE">${JSON.stringify({
        LiveRoom: { liveRoomUserInfo: makeLiveResponse().data! },
      })}</script>`,
    );
    const parser = new TikTokParser();

    vi.spyOn(Math, "random").mockReturnValueOnce(0.1).mockReturnValueOnce(0.9);
    await parser.getRoomInfo("example");
    await parser.getRoomInfo("example");

    expect(get).toHaveBeenCalledOnce();
    expect(getText).toHaveBeenCalledOnce();
  });
});
