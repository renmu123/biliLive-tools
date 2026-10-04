import { describe, it, expect, vi, beforeEach } from "vitest";
import RecorderConfig from "../../src/recorder/config.js";
import { getCookie } from "../../src/task/bili.js";
import { readDouyuUser } from "../../src/recorder/douyu.js";

import { provider as providerForDouYu } from "@bililive-tools/douyu-recorder";
import { provider as providerForHuYa } from "@bililive-tools/huya-recorder";
import { provider as providerForBiliBili } from "@bililive-tools/bilibili-recorder";
import { provider as providerForDouYin } from "@bililive-tools/douyin-recorder";
import { provider as providerForXHS } from "@bililive-tools/xhs-recorder";
import { provider as providerForTikTok } from "@bililive-tools/tiktok-recorder";

// 模拟 getCookie 函数
vi.mock("../../src/task/bili.js", () => ({
  getCookie: vi.fn(),
}));
vi.mock("../../src/recorder/douyu.js", () => ({
  readDouyuUser: vi.fn(),
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
  providerForTikTok.id,
];

const providerIdsWithDanma = allProviderIds.filter(
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
    providerIds: providerIdsWithDanma,
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
    describe("斗鱼账号", () => {
      it("支持按全局或单独配置的 UID 读取账号 Cookie", () => {
        vi.mocked(readDouyuUser).mockImplementation((uid) => ({
          uid,
          name: String(uid),
          createdAt: 1000,
          updatedAt: 1000,
          loginCookies: {
            passport: `passport-${uid}`,
            main: `cookie-${uid}`,
          },
        }));
        mockAppConfig.get.mockImplementation((key: string) => {
          if (key === "recorder") {
            return {
              douyu: {
                uid: 100,
              },
            };
          }
          if (key === "recorders") {
            return [
              {
                id: "global",
                providerId: "DouYu",
                channelId: "123",
                noGlobalFollowFields: [],
                uid: 200,
              },
              {
                id: "local",
                providerId: "DouYu",
                channelId: "456",
                noGlobalFollowFields: ["uid"],
                uid: 200,
              },
            ];
          }
          return null;
        });

        expect(recorderConfig.get("global")?.auth).toBe("cookie-100");
        expect(recorderConfig.get("local")?.auth).toBe("cookie-200");
      });
    });
    describe("TikTok 代理：proxy", () => {
      it("支持跟随全局配置和单独覆盖", () => {
        mockAppConfig.get.mockImplementation((key: string) => {
          if (key === "recorder") {
            return {
              tiktok: {
                proxy: "http://127.0.0.1:7890",
              },
            };
          }
          if (key === "recorders") {
            return [
              {
                id: "global",
                providerId: "TikTok",
                channelId: "global",
                noGlobalFollowFields: [],
                proxy: "http://127.0.0.1:8899",
              },
              {
                id: "local",
                providerId: "TikTok",
                channelId: "local",
                noGlobalFollowFields: ["proxy"],
                proxy: "http://127.0.0.1:8899",
              },
            ];
          }
          return null;
        });

        expect(recorderConfig.get("global")?.proxy).toBe("http://127.0.0.1:7890");
        expect(recorderConfig.get("local")?.proxy).toBe("http://127.0.0.1:8899");
      });
    });
    describe("B站标题变更时分段：segmentOnTitleChange", () => {
      it("支持跟随全局配置和单独覆盖", () => {
        mockAppConfig.get.mockImplementation((key: string) => {
          if (key === "recorder") {
            return {
              bilibili: {
                segmentOnTitleChange: true,
              },
            };
          }
          if (key === "recorders") {
            return [
              {
                id: "global",
                providerId: "Bilibili",
                channelId: "global",
                noGlobalFollowFields: [],
                segmentOnTitleChange: false,
              },
              {
                id: "local",
                providerId: "Bilibili",
                channelId: "local",
                noGlobalFollowFields: ["segmentOnTitleChange"],
                segmentOnTitleChange: false,
              },
            ];
          }
          return null;
        });

        expect(recorderConfig.get("global")?.segmentOnTitleChange).toBe(true);
        expect(recorderConfig.get("local")?.segmentOnTitleChange).toBe(false);
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

    it("支持传入授权缓存，并按平台区分相同 UID", () => {
      mockAppConfig.get.mockImplementation((key: string) => {
        if (key === "recorder") {
          return { bilibili: { uid: 100 }, douyu: { uid: 100 } };
        }
        if (key === "recorders") {
          return [
            { id: "bili", providerId: "Bilibili", channelId: "1" },
            { id: "douyu", providerId: "DouYu", channelId: "2" },
          ];
        }
        return null;
      });
      const authCache = new Map([
        ["Bilibili:100", "bili-cookie"],
        ["DouYu:100", "douyu-cookie"],
      ]);

      expect(recorderConfig.get("bili", { authCache })?.auth).toBe("bili-cookie");
      expect(recorderConfig.get("douyu", { authCache })?.auth).toBe("douyu-cookie");
      expect(getCookie).not.toHaveBeenCalled();
      expect(readDouyuUser).not.toHaveBeenCalled();
    });

    it("未传入 opts 时仍读取账号授权", () => {
      vi.mocked(getCookie).mockReturnValue({ SESSDATA: "test_sessdata" });

      expect(recorderConfig.get("test1")?.auth).toBe("SESSDATA=test_sessdata");
      expect(getCookie).toHaveBeenCalledWith(123456);
    });
  });

  describe("list", () => {
    const setupAccounts = () => {
      mockAppConfig.get.mockImplementation((key: string) => {
        if (key === "recorder") {
          return { bilibili: { uid: 100 }, douyu: { uid: 100 } };
        }
        if (key === "recorders") {
          return [
            ...Array.from({ length: 500 }, (_, i) => ({
              id: `bili-${i}`,
              providerId: "Bilibili",
              channelId: String(i),
            })),
            { id: "douyu", providerId: "DouYu", channelId: "1" },
            {
              id: "local",
              providerId: "Bilibili",
              channelId: "501",
              uid: 200,
              noGlobalFollowFields: ["uid"],
            },
          ];
        }
        if (key === "bilibiliUser") return { 100: "encrypted", 200: "encrypted", 300: "encrypted" };
        if (key === "douyuUser") return { 100: "encrypted" };
        return null;
      });
      vi.mocked(getCookie).mockImplementation((uid) => ({ SESSDATA: `bili-${uid}` }));
      vi.mocked(readDouyuUser).mockImplementation((uid) => ({
        uid,
        name: String(uid),
        createdAt: 1000,
        updatedAt: 1000,
        loginCookies: { passport: "", main: `douyu-${uid}` },
      }));
    };

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

    it("预先读取所有账号，每个账号只解密一次，并复用房间配置缓存", () => {
      setupAccounts();

      const result = recorderConfig.list();

      expect(result).toHaveLength(502);
      expect(result.slice(0, 500).every((item) => item.auth === "SESSDATA=bili-100")).toBe(true);
      expect(result[500]?.auth).toBe("douyu-100");
      expect(result[501]?.auth).toBe("SESSDATA=bili-200");
      expect(getCookie).toHaveBeenCalledTimes(3);
      expect(getCookie).toHaveBeenCalledWith(300);
      expect(readDouyuUser).toHaveBeenCalledTimes(1);
      expect(mockAppConfig.get.mock.calls.filter(([, withCache]) => !withCache)).toEqual([
        ["recorders"],
      ]);
    });

    it("账号解密失败不会中断列表，也不会为每个房间重复尝试", () => {
      setupAccounts();
      vi.mocked(getCookie).mockImplementation((uid) => {
        if (uid === 100) throw new Error("invalid account");
        return { SESSDATA: `bili-${uid}` };
      });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      try {
        const result = recorderConfig.list();

        expect(result).toHaveLength(502);
        expect(result.slice(0, 500).every((item) => item.auth === undefined)).toBe(true);
        expect(result[500]?.auth).toBe("douyu-100");
        expect(result[501]?.auth).toBe("SESSDATA=bili-200");
        expect(getCookie).toHaveBeenCalledTimes(3);
        expect(errorSpy).toHaveBeenCalledTimes(1);
      } finally {
        errorSpy.mockRestore();
      }
    });

    it("不存在的账号在同一次列表读取中只查询一次", () => {
      setupAccounts();
      const originalGet = mockAppConfig.get.getMockImplementation();
      mockAppConfig.get.mockImplementation((key: string) =>
        key === "bilibiliUser" ? {} : originalGet(key),
      );
      vi.mocked(getCookie).mockReturnValue({ SESSDATA: "fallback" });

      const result = recorderConfig.list();

      expect(result[0]?.auth).toBe("SESSDATA=fallback");
      expect(getCookie).toHaveBeenCalledTimes(2);
    });

    it("每次 list 都重新读取账号，避免沿用旧 Cookie", () => {
      setupAccounts();
      expect(recorderConfig.list()[0]?.auth).toBe("SESSDATA=bili-100");
      vi.mocked(getCookie).mockReturnValue({ SESSDATA: "updated" });

      expect(recorderConfig.list()[0]?.auth).toBe("SESSDATA=updated");
      expect(getCookie).toHaveBeenCalledTimes(6);
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
