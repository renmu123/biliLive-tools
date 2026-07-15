import { describe, it, expect, vi, beforeEach } from "vitest";
import RecorderConfig from "../../src/recorder/config.js";
import { getCookie } from "../../src/task/bili.js";

import { provider as providerForDouYu } from "@bililive-tools/douyu-recorder";
import { provider as providerForHuYa } from "@bililive-tools/huya-recorder";
import { provider as providerForBiliBili } from "@bililive-tools/bilibili-recorder";
import { provider as providerForDouYin } from "@bililive-tools/douyin-recorder";
import { provider as providerForXHS } from "@bililive-tools/xhs-recorder";

// 模拟 getCookie 函数
vi.mock("../../src/task/bili.js", () => ({
  getCookie: vi.fn(),
}));

const defaultRecorderConfig = {
  providerId: "Bilibili" as const,
  channelId: "789",
  owner: "test_owner3",
  noGlobalFollowFields: [],
  streamPriorities: [],
  sourcePriorities: [],
  extra: {},
  quality: "highest" as const,
  line: "auto",
  disableProvideCommentsWhenRecording: true,
  saveGiftDanma: false,
  saveSCDanma: true,
  saveCover: false,
  segment: "90",
  videoFormat: "auto" as const,
  qualityRetry: 0,
  formatName: "auto" as const,
  useM3U8Proxy: false,
  codecName: "auto" as const,
  source: "auto",
  recorderType: "ffmpeg" as const,
  useServerTimestamp: true,
  handleTime: ["", ""] as [string | null, string | null],
  weight: 10,
  debugLevel: "none" as const,
  api: "auto" as const,
};

const allProviderIds = [
  providerForDouYu.id,
  providerForBiliBili.id,
  providerForDouYin.id,
  providerForHuYa.id,
  providerForXHS.id,
];

const providerIdsWithoutXHS = allProviderIds.filter(
  (providerId) => providerId !== providerForXHS.id,
);

const buildRecorders = (
  providerIds: string[],
  valueKey: string,
  value: unknown,
  noGlobalFollowFields: string[] = [],
) => {
  return providerIds.map((providerId) => ({
    id: providerId,
    providerId,
    channelId: "123",
    noGlobalFollowFields,
    [valueKey]: value,
  }));
};

const globalFollowCases = [
  {
    title: "转封装为MP4：convert2Mp4",
    key: "convert2Mp4",
    globalValue: true,
    localValue: false,
    providerIds: allProviderIds,
  },
  {
    title: "分段：segment",
    key: "segment",
    globalValue: "120",
    localValue: "60",
    providerIds: allProviderIds,
  },
  {
    title: "录制器：recorderType",
    key: "recorderType",
    globalValue: "streamlink",
    localValue: "ffmpeg",
    providerIds: allProviderIds,
  },
  {
    title: "视频格式：format",
    key: "videoFormat",
    globalValue: "mp4",
    localValue: "flv",
    providerIds: allProviderIds,
  },
  {
    title: "调试模式：debugLevel",
    key: "debugLevel",
    globalValue: "verbose",
    localValue: "none",
    providerIds: allProviderIds,
  },
  {
    title: "保存封面：saveCover",
    key: "saveCover",
    globalValue: true,
    localValue: false,
    providerIds: allProviderIds,
  },
  {
    title: "保存礼物：saveGiftDanma",
    key: "saveGiftDanma",
    globalValue: true,
    localValue: false,
    providerIds: allProviderIds,
  },
  {
    title: "高能弹幕：saveSCDanma",
    key: "saveSCDanma",
    globalValue: false,
    localValue: true,
    providerIds: allProviderIds,
  },
  {
    title: "服务端时间戳：useServerTimestamp",
    key: "useServerTimestamp",
    globalValue: false,
    localValue: true,
    providerIds: allProviderIds,
  },
  {
    title: "弹幕录制：disableProvideCommentsWhenRecording",
    key: "disableProvideCommentsWhenRecording",
    globalValue: false,
    localValue: true,
    providerIds: providerIdsWithoutXHS,
  },
] as const;

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
          qualityRetry: 3,
          bilibili: {
            uid: "123456",
            useM3U8Proxy: true,
            formatName: "bilibili_format",
            quality: "highest",
            codecName: "h264",
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

  describe("配置", () => {
    it("应该返回 null 当找不到对应的录制器配置时", () => {
      const result = recorderConfig.get("non_existent_id");
      expect(result).toBeNull();
    });

    describe("流编码：codecName", () => {
      const providerIds = ["DouYu", "Bilibili"];
      it("全局", () => {
        mockAppConfig.get.mockImplementation((key: string) => {
          if (key === "recorder") {
            return {
              douyu: {
                codecName: "avc",
              },
              bilibili: {
                codecName: "avc",
              },
            };
          }
          if (key === "recorders") {
            return providerIds.map((providerId) => ({
              id: providerId,
              providerId,
              channelId: "123",
              noGlobalFollowFields: [],
              codecName: "hevc",
            }));
          }
          return null;
        });

        for (const id of providerIds) {
          const result = recorderConfig.get(id);
          expect(result?.codecName).toBe("avc");
        }
      });
      it("非全局", () => {
        mockAppConfig.get.mockImplementation((key: string) => {
          if (key === "recorder") {
            return {
              douyu: {
                codecName: "avc",
              },
              bilibili: {
                codecName: "avc",
              },
            };
          }
          if (key === "recorders") {
            return providerIds.map((providerId) => ({
              id: providerId,
              providerId,
              channelId: "123",
              noGlobalFollowFields: ["codecName"],
              codecName: "hevc",
            }));
          }
          return null;
        });

        for (const id of providerIds) {
          const result = recorderConfig.get(id);
          expect(result?.codecName).toBe("hevc");
        }
      });
    });
    // 转封装为MP4,convert2Mp4
    describe("转封装为MP4：convert2Mp4", () => {
      it("全局", () => {
        mockAppConfig.get.mockImplementation((key: string) => {
          if (key === "recorder") {
            return {
              convert2Mp4: true,
            };
          }
          if (key === "recorders") {
            return allProviderIds.map((providerId) => ({
              id: providerId,
              providerId,
              channelId: "123",
              noGlobalFollowFields: [],
              convert2Mp4: false,
            }));
          }
          return null;
        });

        for (const id of allProviderIds) {
          const result = recorderConfig.get(id);
          expect(result?.convert2Mp4).toBe(true);
        }
      });
      it("非全局", () => {
        mockAppConfig.get.mockImplementation((key: string) => {
          if (key === "recorder") {
            return {
              convert2Mp4: true,
            };
          }
          if (key === "recorders") {
            return allProviderIds.map((providerId) => ({
              id: providerId,
              providerId,
              channelId: "123",
              noGlobalFollowFields: ["convert2Mp4"],
              convert2Mp4: false,
            }));
          }
          return null;
        });

        for (const id of allProviderIds) {
          const result = recorderConfig.get(id);
          expect(result?.convert2Mp4).toBe(false);
        }
      });
    });

    for (const testCase of globalFollowCases) {
      describe(testCase.title, () => {
        it("全局", () => {
          mockAppConfig.get.mockImplementation((key: string) => {
            if (key === "recorder") {
              return {
                [testCase.key]: testCase.globalValue,
              };
            }
            if (key === "recorders") {
              return buildRecorders(testCase.providerIds, testCase.key, testCase.localValue);
            }
            return null;
          });

          for (const id of testCase.providerIds) {
            const result = recorderConfig.get(id);
            expect(result?.[testCase.key]).toBe(testCase.globalValue);
          }
        });

        it("非全局", () => {
          mockAppConfig.get.mockImplementation((key: string) => {
            if (key === "recorder") {
              return {
                [testCase.key]: testCase.globalValue,
              };
            }
            if (key === "recorders") {
              return buildRecorders(testCase.providerIds, testCase.key, testCase.localValue, [
                testCase.key,
              ]);
            }
            return null;
          });

          for (const id of testCase.providerIds) {
            const result = recorderConfig.get(id);
            expect(result?.[testCase.key]).toBe(testCase.localValue);
          }
        });
      });
    }
  });

  describe("get", () => {
    it("应该返回 null 当找不到对应的录制器配置时", () => {
      const result = recorderConfig.get("non_existent_id");
      expect(result).toBeNull();
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
        ...defaultRecorderConfig,
        id: "test3",
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
        ...defaultRecorderConfig,
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
