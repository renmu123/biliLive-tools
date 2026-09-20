import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRoomInfoMock } = vi.hoisted(() => ({
  getRoomInfoMock: vi.fn(),
}));

vi.mock("../src/douyin_api", () => ({
  getRoomInfo: getRoomInfoMock,
  selectRandomAPI: vi.fn(() => "web"),
}));

import { getFormatPriorities, getStream } from "../src/stream";

const getStreamOptions = {
  channelId: "123",
  quality: "origin" as const,
  streamPriorities: [],
  sourcePriorities: [],
  formatPriorities: ["flv", "hls"] as Array<"flv" | "hls">,
};

const mockRoomInfo = (stream: { flv?: string; hls?: string }) => {
  getRoomInfoMock.mockResolvedValue({
    living: true,
    roomId: "123",
    owner: "owner",
    title: "title",
    streams: [],
    sources: [
      {
        name: "自动",
        streamMap: {},
        streams: [{ quality: "origin", name: "原画", ...stream }],
      },
    ],
    avatar: "",
    cover: "",
    liveId: "live-1",
    uid: "uid-1",
    api: "web",
  });
};

beforeEach(() => {
  getRoomInfoMock.mockReset();
});

describe("getFormatPriorities", () => {
  it("默认 FLV 优先时切换为 HLS 优先并保留回退", () => {
    expect(getFormatPriorities(["flv", "hls"], true)).toEqual(["hls", "flv"]);
  });

  it("HLS 优先时切换为 FLV 优先并保留回退", () => {
    expect(getFormatPriorities(["hls", "flv"], true)).toEqual(["flv", "hls"]);
  });

  it("没有切流提示时保持原优先级", () => {
    expect(getFormatPriorities(["flv", "hls"])).toEqual(["flv", "hls"]);
  });

  it.each(["flv", "hls"] as const)("单格式配置 %s 不会被覆盖", (format) => {
    expect(getFormatPriorities([format], true)).toEqual([format]);
  });

  it("切流提示会让包含两种格式的流选择 HLS", async () => {
    mockRoomInfo({
      flv: "https://example.com/live.flv",
      hls: "https://example.com/live.m3u8",
    });

    const result = await getStream({
      ...getStreamOptions,
      preferAlternativeStream: true,
    });

    expect(result.currentStream.url).toBe("https://example.com/live.m3u8");
  });

  it("备用格式不可用时回退原格式", async () => {
    mockRoomInfo({ flv: "https://example.com/live.flv" });

    const result = await getStream({
      ...getStreamOptions,
      preferAlternativeStream: true,
    });

    expect(result.currentStream.url).toBe("https://example.com/live.flv");
  });
});
