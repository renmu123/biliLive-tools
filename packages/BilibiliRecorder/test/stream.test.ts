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
      // 普通直播：能拿到流，无 203，非加密 → 可录制
      vi.mocked(getRoomPlayInfo).mockResolvedValue({
        all_special_types: [],
        playurl_info: { playurl: { stream: [{}] } },
      } as any);

      const info = await getInfo("67890");
      expect(getRoomInit).toHaveBeenCalledWith(67890);
      expect(getStatusInfoByUIDs).toHaveBeenCalledWith([12345]);
      expect(info.recordStartTime).not.toBeUndefined();
      expect(info.liveStartTime).toEqual(new Date(1704067200000));
      expect(info).contains({
        uid: 12345,
        living: true,
        owner: "test_user",
        title: "test_title",
        avatar: "avatar_url",
        cover: "cover_url",
        roomId: 67890,
        liveId: utils.md5("67890-1704067200000"),
      });
      // 普通直播间：normal 类型，可录制，isCharge=false
      expect(info.isCharge).toBe(false);
      expect(info.liveType).toBe("normal");
      expect(info.canRecord).toBe(true);
    });

    const mockChargeStatusInfo = {
      12345: {
        live_time: 1704067200,
        uname: "charge_user",
        title: "charge_title",
        face: "avatar_url",
        cover_from_user: "cover_url",
        live_status: 1 as LiveStatus,
        online: 1000,
        room_id: 99999,
        short_id: 0,
      },
    };

    it("充电直播(is_sp=1 或 special_type=1)应判 paid 且不可录制", async () => {
      const mockRoomInit = {
        room_id: 99999,
        short_id: 0,
        uid: 12345,
        live_status: 1 as LiveStatus,
        live_time: 1704067200,
        encrypted: false,
        is_sp: 1 as 0 | 1,
        special_type: 1,
      };

      vi.mocked(getRoomInit).mockResolvedValue(mockRoomInit);
      vi.mocked(getStatusInfoByUIDs).mockResolvedValue(mockChargeStatusInfo as any);
      vi.mocked(getRoomPlayInfo).mockResolvedValue({
        all_special_types: [],
        playurl_info: { playurl: { stream: [{}] } },
      } as any);

      const info = await getInfo("99999");
      expect(info.isCharge).toBe(true);
      expect(info.liveType).toBe("paid");
      expect(info.canRecord).toBe(false);
      expect(info.living).toBe(true);
    });

    it("DRM 直播(all_special_types 含 203)应判 paid 且不可录制", async () => {
      const mockRoomInit = {
        room_id: 99999,
        short_id: 0,
        uid: 12345,
        live_status: 1 as LiveStatus,
        live_time: 1704067200,
        encrypted: false,
        is_sp: 0 as 0 | 1,
        special_type: 0,
      };

      vi.mocked(getRoomInit).mockResolvedValue(mockRoomInit);
      vi.mocked(getStatusInfoByUIDs).mockResolvedValue(mockChargeStatusInfo as any);
      vi.mocked(getRoomPlayInfo).mockResolvedValue({
        all_special_types: [50, 203],
        playurl_info: { playurl: { stream: [{}] } },
      } as any);

      const info = await getInfo("99999");
      expect(info.liveType).toBe("paid");
      expect(info.canRecord).toBe(false);
    });

    it("权限专属直播(取流接口正常返回但无可用流)应判 guard 且不可录制", async () => {
      const mockRoomInit = {
        room_id: 99999,
        short_id: 0,
        uid: 12345,
        live_status: 1 as LiveStatus,
        live_time: 1704067200,
        encrypted: false,
        is_sp: 0 as 0 | 1,
        special_type: 0,
      };

      vi.mocked(getRoomInit).mockResolvedValue(mockRoomInit);
      vi.mocked(getStatusInfoByUIDs).mockResolvedValue(mockChargeStatusInfo as any);
      // 取流接口正常返回(无异常)，但 stream 为空 → 权限受限
      vi.mocked(getRoomPlayInfo).mockResolvedValue({
        all_special_types: [],
        playurl_info: { playurl: { stream: [] } },
      } as any);

      const info = await getInfo("99999");
      expect(info.liveType).toBe("guard");
      expect(info.canRecord).toBe(false);
      expect(info.living).toBe(true);
    });

    it("取流接口异常(瞬时错误)应按普通直播放行，不误判 guard 而漏录", async () => {
      const mockRoomInit = {
        room_id: 99999,
        short_id: 0,
        uid: 12345,
        live_status: 1 as LiveStatus,
        live_time: 1704067200,
        encrypted: false,
        is_sp: 0 as 0 | 1,
        special_type: 0,
      };

      vi.mocked(getRoomInit).mockResolvedValue(mockRoomInit);
      vi.mocked(getStatusInfoByUIDs).mockResolvedValue(mockChargeStatusInfo as any);
      // 网络/瞬时错误：不应臆断为权限受限
      vi.mocked(getRoomPlayInfo).mockRejectedValue(new Error("network error"));

      const info = await getInfo("99999");
      expect(info.liveType).toBe("normal");
      expect(info.canRecord).toBe(true);
    });

    it("密码加密房(encrypted=true)应判 password 且不调取流接口", async () => {
      const mockRoomInit = {
        room_id: 99999,
        short_id: 0,
        uid: 12345,
        live_status: 1 as LiveStatus,
        live_time: 1704067200,
        encrypted: true,
        is_sp: 0 as 0 | 1,
        special_type: 0,
      };

      vi.mocked(getRoomInit).mockResolvedValue(mockRoomInit);
      vi.mocked(getStatusInfoByUIDs).mockResolvedValue(mockChargeStatusInfo as any);
      vi.mocked(getRoomPlayInfo).mockResolvedValue({} as any);

      const info = await getInfo("99999");
      expect(info.liveType).toBe("password");
      expect(info.canRecord).toBe(false);
      expect(info.living).toBe(true);
      // 加密房直接短路，不应调用取流接口
      expect(getRoomPlayInfo).not.toHaveBeenCalled();
    });
  });

  // describe("getStream", () => {
  //   it("应该正确返回直播流信息", async () => {
  //     const mockRoomInit = {
  //       room_id: 12345,
  //       short_id: 0,
  //       uid: 12345,
  //       live_status: 1 as LiveStatus,
  //       live_time: 1704067200,
  //       encrypted: false,
  //       is_sp: 0 as 0 | 1,
  //     };
  //     const mockLiveInfo = {
  //       current_qn: 10000,
  //       accept_qn: [10000],
  //       base_url: "/stream",
  //       sources: [
  //         {
  //           host: "https://example.com/",
  //           extra: "?key=value",
  //           name: "主线",
  //           stream_ttl: 300,
  //         },
  //       ],
  //       name: "原画",
  //     };
  //     vi.mocked(getRoomInit).mockResolvedValue(mockRoomInit);
  //     vi.mocked(getRoomPlayInfo).mockResolvedValue({
  //       uid: 12345,
  //       room_id: 12345,
  //       short_id: 0,
  //       live_status: 1 as LiveStatus,
  //       live_time: 1704067200,
  //       playurl_info: {
  //         conf_json: "{}",
  //         playurl: {
  //           g_qn_desc: [],
  //           stream: [
  //             {
  //               protocol_name: "http_stream" as const,
  //               format: [
  //                 {
  //                   format_name: "flv",
  //                   codec: [
  //                     {
  //                       codec_name: "avc",
  //                       accept_qn: [10000],
  //                       current_qn: 10000,
  //                       url_info: [
  //                         {
  //                           host: "https://example.com/",
  //                           extra: "?key=value",
  //                           stream_ttl: 300,
  //                         },
  //                       ],
  //                       base_url: "/stream",
  //                     },
  //                   ],
  //                 },
  //               ],
  //             },
  //           ],
  //         },
  //       },
  //     });
  //     const stream = await getStream({
  //       channelId: "12345",
  //       quality: 10000,
  //       formatName: "flv",
  //       codecName: "avc",
  //     });
  //     expect(stream.currentStream).toEqual({
  //       name: "原画",
  //       source: "主线",
  //       url: "https://example.com/stream?key=value",
  //     });
  //   });
  //   it("当直播间未开播时应该抛出错误", async () => {
  //     const mockRoomInit = {
  //       room_id: 12345,
  //       short_id: 0,
  //       uid: 12345,
  //       live_status: 0 as LiveStatus,
  //       live_time: 1704067200,
  //       encrypted: false,
  //       is_sp: 0 as 0 | 1,
  //     };
  //     vi.mocked(getRoomInit).mockResolvedValue(mockRoomInit);
  //     await expect(
  //       getStream({
  //         channelId: "12345",
  //         quality: 10000,
  //         formatName: "flv",
  //         codecName: "avc",
  //       }),
  //     ).rejects.toThrow("It must be called getStream when living");
  //   });
  // });
});
