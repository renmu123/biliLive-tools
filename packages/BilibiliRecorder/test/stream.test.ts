import { describe, it, expect, vi, beforeEach } from "vitest";
import { getStrictStream, getLiveStatus, getInfo, getStream } from "../src/stream";
import {
  getRoomInit,
  getRoomPlayInfo,
  getRoomBaseInfo,
  getStatusInfoByUIDs,
  LiveStatus,
} from "../src/bilibili_api";
import { utils } from "@bililive-tools/manager";

// Mock API 调用
vi.mock("../src/bilibili_api", () => ({
  getRoomInit: vi.fn(),
  getRoomPlayInfo: vi.fn(),
  getRoomBaseInfo: vi.fn(),
  getStatusInfoByUIDs: vi.fn(),
}));

describe("stream.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStrictStream", () => {
    it("应该成功获取指定格式的直播流", async () => {
      const mockResponse = {
        uid: 12345,
        room_id: 12345,
        short_id: 0,
        live_status: 1 as LiveStatus,
        live_time: 1704067200,
        playurl_info: {
          conf_json: "{}",
          playurl: {
            g_qn_desc: [],
            stream: [
              {
                protocol_name: "http_stream" as const,
                format: [
                  {
                    format_name: "flv",
                    codec: [
                      {
                        codec_name: "avc",
                        accept_qn: [10000],
                        current_qn: 10000,
                        url_info: [
                          {
                            host: "https://example.com",
                            extra: "?key=value",
                            stream_ttl: 300,
                          },
                        ],
                        base_url: "/stream",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      };

      vi.mocked(getRoomPlayInfo).mockResolvedValue(mockResponse);

      const url = await getStrictStream(12345, {
        qn: 10000,
        protocol_name: "http_stream",
        format_name: "flv",
        codec_name: "avc",
      });

      expect(url).toBe("https://example.com/stream?key=value");
      expect(getRoomPlayInfo).toHaveBeenCalledWith(12345, {
        qn: 10000,
        protocol_name: "http_stream",
        format_name: "flv",
        codec_name: "avc",
      });
    });

    it("当找不到支持的流时应该抛出错误", async () => {
      const mockResponse = {
        uid: 12345,
        room_id: 12345,
        short_id: 0,
        live_status: 1 as LiveStatus,
        live_time: 1704067200,
        playurl_info: {
          conf_json: "{}",
          playurl: {
            g_qn_desc: [],
            stream: [],
          },
        },
      };

      vi.mocked(getRoomPlayInfo).mockResolvedValue(mockResponse);

      await expect(
        getStrictStream(12345, {
          qn: 10000,
          protocol_name: "http_stream",
          format_name: "flv",
          codec_name: "avc",
        }),
      ).rejects.toThrow("没有找到支持的流");
    });
  });

  describe("getLiveStatus", () => {
    it("应该正确返回直播状态信息", async () => {
      const mockRoomBaseInfo = {
        12345: {
          live_status: 1 as LiveStatus,
          is_encrypted: false,
          live_time: "2024-01-01T00:00:00Z",
          uname: "test_user",
          title: "test_title",
          cover: "test_cover",
        },
      };

      vi.mocked(getRoomBaseInfo).mockResolvedValue(mockRoomBaseInfo);

      const status = await getLiveStatus("12345");

      expect(status).toEqual({
        living: true,
        liveId: utils.md5("12345-1704067200000"),
        owner: "test_user",
        title: "test_title",
      });
    });

    it("live_status 为 0 时应该返回 false", async () => {
      const mockRoomBaseInfo = {
        12345: {
          live_status: 0 as LiveStatus,
        },
      } as any;
      vi.mocked(getRoomBaseInfo).mockResolvedValue(mockRoomBaseInfo);

      const status = await getLiveStatus("12345");

      expect(status.living).toEqual(false);
    });

    it("live_status 为 2 时应该返回 false", async () => {
      const mockRoomBaseInfo = {
        12345: {
          live_status: 2 as LiveStatus,
        },
      } as any;
      vi.mocked(getRoomBaseInfo).mockResolvedValue(mockRoomBaseInfo);

      const status = await getLiveStatus("12345");

      expect(status.living).toEqual(false);
    });

    it("当直播间不存在时应该使用roomInit接口", async () => {
      const mockRoomInit = {
        room_id: 12345,
        short_id: 0,
        uid: 12345,
        live_status: 1 as LiveStatus,
        live_time: 1704067200,
        encrypted: false,
        is_sp: 0 as 0 | 1,
      };

      vi.mocked(getRoomBaseInfo).mockResolvedValue({});
      vi.mocked(getRoomInit).mockResolvedValue(mockRoomInit);

      const status = await getLiveStatus("12345");

      expect(status).toEqual({
        living: true,
        liveId: utils.md5("12345-1704067200000"),
        room_id: 12345,
        encrypted: false,
        is_sp: 0,
        uid: 12345,
        short_id: 0,
        live_time: 1704067200,
        live_status: 1,
        owner: "",
        title: "",
      });
    });
  });

  describe("getInfo", () => {
    it("应该正确返回直播间详细信息", async () => {
      const mockRoomInit = {
        room_id: 67890,
        short_id: 0,
        uid: 12345,
        live_status: 1 as LiveStatus,
        live_time: 1704067200,
        encrypted: false,
        is_sp: 0 as 0 | 1,
      };

      const mockStatusInfo = {
        12345: {
          live_time: 1704067200,
          uname: "test_user",
          title: "test_title",
          face: "avatar_url",
          cover_from_user: "cover_url",
          live_status: 1 as LiveStatus,
          online: 1000,
          room_id: 67890,
          short_id: 0,
        },
      };

      vi.mocked(getRoomInit).mockResolvedValue(mockRoomInit);
      vi.mocked(getStatusInfoByUIDs).mockResolvedValue(mockStatusInfo);

      const info = await getInfo("67890");

      expect(info).toEqual({
        uid: 12345,
        living: true,
        owner: "test_user",
        title: "test_title",
        avatar: "avatar_url",
        cover: "cover_url",
        roomId: 67890,
        startTime: new Date(1704067200000),
        liveId: utils.md5("67890-1704067200000"),
      });
    });
  });

  describe("getStream", () => {
    // it("应该正确返回直播流信息", async () => {
    //   const mockRoomInit = {
    //     room_id: 12345,
    //     short_id: 0,
    //     uid: 12345,
    //     live_status: 1 as LiveStatus,
    //     live_time: 1704067200,
    //     encrypted: false,
    //     is_sp: 0 as 0 | 1,
    //   };

    //   const mockLiveInfo = {
    //     current_qn: 10000,
    //     accept_qn: [10000],
    //     base_url: "/stream",
    //     sources: [
    //       {
    //         host: "https://example.com/",
    //         extra: "?key=value",
    //         name: "主线",
    //         stream_ttl: 300,
    //       },
    //     ],
    //     name: "原画",
    //   };

    //   vi.mocked(getRoomInit).mockResolvedValue(mockRoomInit);
    //   vi.mocked(getRoomPlayInfo).mockResolvedValue({
    //     uid: 12345,
    //     room_id: 12345,
    //     short_id: 0,
    //     live_status: 1 as LiveStatus,
    //     live_time: 1704067200,
    //     playurl_info: {
    //       conf_json: "{}",
    //       playurl: {
    //         g_qn_desc: [],
    //         stream: [
    //           {
    //             protocol_name: "http_stream" as const,
    //             format: [
    //               {
    //                 format_name: "flv",
    //                 codec: [
    //                   {
    //                     codec_name: "avc",
    //                     accept_qn: [10000],
    //                     current_qn: 10000,
    //                     url_info: [
    //                       {
    //                         host: "https://example.com/",
    //                         extra: "?key=value",
    //                         stream_ttl: 300,
    //                       },
    //                     ],
    //                     base_url: "/stream",
    //                   },
    //                 ],
    //               },
    //             ],
    //           },
    //         ],
    //       },
    //     },
    //   });

    //   const stream = await getStream({
    //     channelId: "12345",
    //     quality: 10000,
    //     formatName: "flv",
    //     codecName: "avc",
    //   });

    //   expect(stream.currentStream).toEqual({
    //     name: "原画",
    //     source: "主线",
    //     url: "https://example.com/stream?key=value",
    //   });
    // });

    it("当直播间未开播时应该抛出错误", async () => {
      const mockRoomInit = {
        room_id: 12345,
        short_id: 0,
        uid: 12345,
        live_status: 0 as LiveStatus,
        live_time: 1704067200,
        encrypted: false,
        is_sp: 0 as 0 | 1,
      };

      vi.mocked(getRoomInit).mockResolvedValue(mockRoomInit);

      await expect(
        getStream({
          channelId: "12345",
          quality: 10000,
          formatName: "flv",
          codecName: "avc",
        }),
      ).rejects.toThrow("It must be called getStream when living");
    });
  });
});
