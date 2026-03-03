import { describe, it, expect, vi, beforeEach } from "vitest";
import RecorderConfig from "../../src/recorder/config.js";
import { getCookie } from "../../src/task/bili.js";

// 模拟 getCookie 函数
vi.mock("../../src/task/bili.js", () => ({
  getCookie: vi.fn(),
}));

// 通用的期望配置字段（用于断言）
const COMMON_EXPECTED_CONFIG = {
  line: undefined,
  debugLevel: "none",
  disableProvideCommentsWhenRecording: true,
  saveGiftDanma: false,
  saveSCDanma: true,
  saveCover: false,
  saveRawDanma: false,
  segment: 90,
  uid: undefined,
  qualityRetry: 3,
  recorderType: "ffmpeg",
  videoFormat: "auto",
  auth: undefined,
  useM3U8Proxy: true,
  formatName: "auto",
  codecName: "h264",
  source: "auto",
  doubleScreen: undefined,
  formatPriorities: undefined,
  sourcePriorities: [],
  api: "auto",
  useServerTimestamp: true,
  customHost: undefined,
} as const;

// 添加/更新录制器时的基础配置字段
const BASE_RECORDER_CONFIG = {
  noGlobalFollowFields: [],
  streamPriorities: [],
  sourcePriorities: [],
  extra: {},
  quality: "highest" as const,
  line: "auto",
  disableProvideCommentsWhenRecording: true,
  saveGiftDanma: false,
  saveSCDanma: true,
  saveRawDanma: false,
  saveCover: false,
  segment: 90,
  videoFormat: "auto" as const,
  qualityRetry: 0,
  formatName: "auto" as const,
  useM3U8Proxy: false,
  codecName: "auto" as const,
  source: "auto",
  recorderType: "ffmpeg" as const,
  useServerTimestamp: true,
  handleTime: ["", ""] as [string | null, string | null],
} as const;

describe("RecorderConfig", () => {
  let recorderConfig: RecorderConfig;
  let mockAppConfig: any;

  beforeEach(() => {
    // 重置所有模拟
    vi.resetAllMocks();

    // 创建模拟的 AppConfig
    mockAppConfig = {
      get: vi.fn(),
      set: vi.fn(),
    };

    // 设置默认的全局配置
    mockAppConfig.get.mockImplementation((key: string) => {
      if (key === "recorder") {
        return {
          bilibili: {
            uid: "123456",
            useM3U8Proxy: true,
            formatName: "bilibili_format",
            quality: "highest",
            codecName: "h264",
            qualityRetry: 3,
          },
          douyu: {
            quality: "high",
            source: "auto",
          },
          huya: {
            quality: "high",
          },
          douyin: {
            quality: "high",
            doubleScreen: true,
          },
          quality: "default",
        };
      }
      if (key === "recorders") {
        return [
          {
            id: "test1",
            providerId: "Bilibili",
            channelId: "123",
            owner: "test_owner",
            noGlobalFollowFields: ["customField"],
            customField: "custom_value",
          },
          {
            id: "test2",
            providerId: "DouYu",
            channelId: "456",
            owner: "test_owner2",
          },
          {
            id: "test3",
            providerId: "HuYa",
            channelId: "789",
            owner: "test_owner3",
          },
          {
            id: "test4",
            providerId: "DouYin",
            channelId: "101",
            owner: "test_owner4",
          },
        ];
      }
      return null;
    });

    recorderConfig = new RecorderConfig(mockAppConfig);
  });

  describe("get", () => {
    it("应该返回 null 当找不到对应的录制器配置时", () => {
      const result = recorderConfig.get("non_existent_id");
      expect(result).toBeNull();
    });

    it("应该正确处理 Bilibili 录制器的配置", () => {
      // 模拟 getCookie 返回
      (getCookie as any).mockReturnValue({
        SESSDATA: "test_sessdata",
        bili_jct: "test_jct",
      });

      const result = recorderConfig.get("test1");

      expect(result).toEqual({
        ...COMMON_EXPECTED_CONFIG,
        id: "test1",
        providerId: "Bilibili",
        channelId: "123",
        owner: "test_owner",
        noGlobalFollowFields: ["customField"],
        customField: "custom_value",
        quality: "highest",
        uid: "123456",
        auth: "SESSDATA=test_sessdata; bili_jct=test_jct",
        formatName: "bilibili_format",
      });
    });

    it("应该正确处理 DouYu 录制器的配置", () => {
      const result = recorderConfig.get("test2");

      expect(result).toEqual({
        ...COMMON_EXPECTED_CONFIG,
        id: "test2",
        providerId: "DouYu",
        channelId: "456",
        owner: "test_owner2",
        quality: "high",
      });
    });

    describe("应该正确处理 HuYa 录制器的配置", () => {
      it("应该正确处理 HuYa 录制器的配置", () => {
        const result = recorderConfig.get("test3");

        expect(result).toEqual({
          ...COMMON_EXPECTED_CONFIG,
          id: "test3",
          providerId: "HuYa",
          channelId: "789",
          owner: "test_owner3",
          quality: "high",
          formatPriorities: ["flv", "hls"],
        });
      });
      it("正确处理HuYa source全局参数", () => {
        // 修改全局配置，添加测试配置
        mockAppConfig.get.mockImplementation((key: string) => {
          if (key === "recorder") {
            return {
              huya: {
                source: "AL",
              },
            };
          }
          if (key === "recorders") {
            return [
              {
                id: "test6",
                providerId: "HuYa",
                channelId: "123",
                noGlobalFollowFields: [],
                source: "auto",
              },
            ];
          }
          return null;
        });

        const result = recorderConfig.get("test6");
        expect(result?.sourcePriorities).toEqual(["AL"]);
      });

      it("正确处理HuYa source非全局参数", () => {
        // 修改全局配置，添加测试配置
        mockAppConfig.get.mockImplementation((key: string) => {
          if (key === "recorder") {
            return {
              huya: {
                source: "auto",
              },
            };
          }
          if (key === "recorders") {
            return [
              {
                id: "test6",
                providerId: "HuYa",
                channelId: "123",
                noGlobalFollowFields: ["source"],
                source: "TX",
              },
            ];
          }
          return null;
        });

        const result = recorderConfig.get("test6");
        expect(result?.sourcePriorities).toEqual(["TX"]);
      });
    });

    it("应该正确处理 DouYin 录制器的配置", () => {
      const result = recorderConfig.get("test4");

      expect(result).toEqual({
        ...COMMON_EXPECTED_CONFIG,
        id: "test4",
        providerId: "DouYin",
        channelId: "101",
        owner: "test_owner4",
        quality: "high",
        formatPriorities: ["flv", "hls"],
        doubleScreen: true,
      });
    });

    it("应该正确处理没有 uid 的情况", () => {
      // 修改全局配置，移除 uid
      mockAppConfig.get.mockImplementation((key: string) => {
        if (key === "recorder") {
          return {
            bilibili: {
              useM3U8Proxy: true,
              formatName: "bilibili_format",
              quality: "highest",
              codecName: "h264",
              qualityRetry: 3,
            },
          };
        }
        if (key === "recorders") {
          return [
            {
              id: "test1",
              providerId: "Bilibili",
              channelId: "123",
              owner: "test_owner",
            },
          ];
        }
        return null;
      });

      const result = recorderConfig.get("test1");
      expect(result?.auth).toBeUndefined();
    });

    it("应该正确处理多个 noGlobalFollowFields 配置项", () => {
      // 修改全局配置，添加测试配置
      mockAppConfig.get.mockImplementation((key: string) => {
        if (key === "recorder") {
          return {
            bilibili: {
              uid: undefined,
              useM3U8Proxy: true,
              formatName: "bilibili_format",
              quality: "highest",
              codecName: "h264",
              debugLevel: "none",
              qualityRetry: 3,
              saveGiftDanma: true,
              saveRawDanma: false,
              saveSCDanma: false,
              saveCover: true,
              api: "auto",
              useServerTimestamp: true,
            },
          };
        }
        if (key === "recorders") {
          return [
            {
              id: "test6",
              providerId: "Bilibili",
              channelId: "123",
              owner: "test_owner",
              quality: "highest",
              noGlobalFollowFields: ["saveGiftDanma", "saveSCDanma", "saveCover"],
              saveGiftDanma: false,
              saveSCDanma: true,
              saveCover: false,
              api: "auto",
              useServerTimestamp: true,
            },
          ];
        }
        return null;
      });

      const result = recorderConfig.get("test6");

      expect(result).toEqual({
        ...COMMON_EXPECTED_CONFIG,
        id: "test6",
        providerId: "Bilibili",
        channelId: "123",
        owner: "test_owner",
        noGlobalFollowFields: ["saveGiftDanma", "saveSCDanma", "saveCover"],
        quality: "highest",
        formatName: "bilibili_format",
      });
    });
  });

  describe("list", () => {
    it("应该返回所有有效的录制器配置", () => {
      // 模拟 getCookie 返回
      (getCookie as any).mockReturnValue({
        SESSDATA: "test_sessdata",
        bili_jct: "test_jct",
      });
      const result = recorderConfig.list();
      expect(result).toHaveLength(4);
      expect(result[0]?.id).toBe("test1");
      expect(result[1]?.id).toBe("test2");
    });
  });

  describe("add", () => {
    it("应该能够添加新的录制器配置", () => {
      const newRecorder = {
        ...BASE_RECORDER_CONFIG,
        id: "test3",
        providerId: "Bilibili" as const,
        channelId: "789",
        owner: "test_owner3",
      };

      recorderConfig.add(newRecorder);

      expect(mockAppConfig.set).toHaveBeenCalledWith(
        "recorders",
        expect.arrayContaining([expect.objectContaining({ id: "test3" })]),
      );
    });
  });

  describe("remove", () => {
    it("应该能够删除指定的录制器配置", () => {
      recorderConfig.remove("test1");

      expect(mockAppConfig.set).toHaveBeenCalledWith(
        "recorders",
        expect.not.arrayContaining([expect.objectContaining({ id: "test1" })]),
      );
    });
  });

  describe("update", () => {
    it("应该能够更新指定的录制器配置", () => {
      const updatedRecorder = {
        ...BASE_RECORDER_CONFIG,
        id: "test1",
        channelId: "new_channel_id",
        owner: "new_owner",
      };

      recorderConfig.update(updatedRecorder);

      expect(mockAppConfig.set).toHaveBeenCalledWith(
        "recorders",
        expect.arrayContaining([
          expect.objectContaining({
            id: "test1",
            channelId: "new_channel_id",
            owner: "new_owner",
          }),
        ]),
      );
    });
  });
});
