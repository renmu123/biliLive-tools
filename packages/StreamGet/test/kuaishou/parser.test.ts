import { describe, it, expect } from "vitest";
import { extractStreams, parseInitialState } from "../../src/kuaishou/api.js";
import { KuaishouParser } from "../../src/kuaishou/parser.js";

// ====================================================
// 这些测试不依赖网络，只验证 __INITIAL_STATE__ 解析逻辑
// ====================================================

function wrapInHtml(initialState: object): string {
  const json = JSON.stringify(initialState);
  return `<!DOCTYPE html><html><head></head><body>
    <div id="app"></div>
    <script>window.__INITIAL_STATE__=${json};(function(){var s;s=document.currentScript||document.scripts[document.scripts.length-1];s.parentNode.removeChild(s);}());</script>
    <script>window.__CAPTCHA_INFO__=[];(function(){var s;s=document.currentScript||document.scripts[document.scripts.length-1];s.parentNode.removeChild(s);}());</script>
  </body></html>`;
}

// 测试用的 mock 直播数据
const mockLiveState = {
  user: { name: "测试主播" },
  pcConfig: { pcConfig: { did: "web_test_did_1234" } },
  liveroom: {
    playList: [
      {
        liveStream: {
          id: "stream_123",
          poster: "https://example.com/poster.jpg",
          playUrls: {
            h264: {
              adaptationSet: {
                representation: [
                  {
                    url: "https://tx-origin.pull.yximgs.com/gifshow/stream_123_GameAvcSdL0.flv?txSecret=abc&txTime=123",
                    bitrate: 1000,
                    qualityType: "STANDARD",
                    width: 1280,
                    height: 720,
                  },
                  {
                    url: "https://tx-origin.pull.yximgs.com/gifshow/stream_123_GameAvcHdL0.flv?txSecret=def&txTime=456",
                    bitrate: 2000,
                    qualityType: "HIGH",
                    width: 1920,
                    height: 1080,
                  },
                  {
                    url: "https://ws-origin.pull.yximgs.com/gifshow/stream_123_GameAvcSdL0.flv?wsSecret=ghi&wsTime=789",
                    bitrate: 1000,
                    qualityType: "STANDARD",
                    width: 1280,
                    height: 720,
                  },
                ],
              },
            },
          },
        },
        author: { name: "测试主播", avatar: "https://example.com/avatar.jpg" },
        isLiving: true,
      },
    ],
  },
};

const mockOfflineState = {
  liveroom: {
    playList: [
      {
        liveStream: {},
        author: {},
        isLiving: false,
        errorType: { type: 22, title: "错误代码22" },
      },
    ],
  },
};

describe("parseInitialState - 从 HTML 提取 __INITIAL_STATE__", () => {
  it("正确提取正常数据", () => {
    const html = wrapInHtml(mockLiveState);
    const state = parseInitialState(html);
    expect(state).toBeDefined();
    expect(state.liveroom).toBeDefined();
    expect(state.liveroom.playList).toHaveLength(1);
  });

  it("HTML 中没有 __INITIAL_STATE__ 时抛异常", () => {
    const html = "<html><body>no data</body></html>";
    expect(() => parseInitialState(html)).toThrow("未找到 __INITIAL_STATE__");
  });

  it("JSON 格式错误时抛异常", () => {
    const html = `<script>window.__INITIAL_STATE__={broken json};(function(){})();</script>`;
    expect(() => parseInitialState(html)).toThrow("JSON 解析失败");
  });
});

describe("extractStreams - 从 liveroom 提取 StreamInfo[]", () => {
  it("主播在线时返回正确数量的 SourceInfo", () => {
    const sources = extractStreams(mockLiveState.liveroom);
    expect(sources).toHaveLength(2); // tx-origin + ws-origin

    // tx-origin 应有 2 条流
    const tx = sources.find((s) => s.name.includes("tx-origin"));
    expect(tx).toBeDefined();
    expect(tx!.streams).toHaveLength(2);

    // ws-origin 应有 1 条流
    const ws = sources.find((s) => s.name.includes("ws-origin"));
    expect(ws).toBeDefined();
    expect(ws!.streams).toHaveLength(1);
  });

  it("流信息中的 qualityDesc 正确映射", () => {
    const sources = extractStreams(mockLiveState.liveroom);
    const tx = sources.find((s) => s.name.includes("tx-origin"))!;

    const sd = tx.streams.find((s) => s.quality === "STANDARD");
    expect(sd!.qualityDesc).toBe("标清");
    expect(sd!.format).toBe("flv");
    expect(sd!.bitrate).toBe(1000);

    const hd = tx.streams.find((s) => s.quality === "HIGH");
    expect(hd!.qualityDesc).toBe("高清");
    expect(hd!.format).toBe("flv");
    expect(hd!.bitrate).toBe(2000);
  });

  it("主播离线时返回空数组", () => {
    const sources = extractStreams(mockOfflineState.liveroom);
    expect(sources).toEqual([]);
  });

  it("playList 为空数组时返回空数组", () => {
    const sources = extractStreams({ playList: [] });
    expect(sources).toEqual([]);
  });

  it("主播在线但 representation 为空数组时返回空数组", () => {
    const liveroom = {
      playList: [
        {
          isLiving: true,
          liveStream: {
            playUrls: {
              h264: { adaptationSet: { representation: [] } },
            },
          },
        },
      ],
    };
    const sources = extractStreams(liveroom);
    expect(sources).toEqual([]);
  });

  it("缺少 playUrls 但无 hls 时返回空数组", () => {
    const liveroom = {
      playList: [{ isLiving: true, liveStream: { id: "test" } }],
    };
    const result = extractStreams(liveroom);
    expect(result).toEqual([]);
  });

  it("缺少 playList 时抛异常", () => {
    expect(() => extractStreams({})).toThrow("数据格式异常");
  });

  it("representation 中 url 缺失的流应被跳过", () => {
    const liveroom = {
      playList: [
        {
          isLiving: true,
          liveStream: {
            playUrls: {
              h264: {
                adaptationSet: {
                  representation: [
                    { url: "https://cdn.example.com/valid.flv", bitrate: 1000, qualityType: "STANDARD" },
                    { bitrate: 2000, qualityType: "HIGH" }, // 没有 url
                  ],
                },
              },
            },
          },
        },
      ],
    };
    const sources = extractStreams(liveroom);
    const cdn = sources.find((s) => s.name.includes("cdn.example.com"));
    expect(cdn).toBeDefined();
    expect(cdn!.streams).toHaveLength(1); // 只有 valid 那条
  });
});

describe("KuaishouParser - matchURL / extractRoomId", () => {
  it("matchURL 匹配快手域名", () => {
    const p = new KuaishouParser();
    expect(p.matchURL("https://live.kuaishou.com/u/kpl2026")).toBe(true);
    expect(p.matchURL("https://live.kuaishou.com/u/测试主播")).toBe(true);
    expect(p.matchURL("https://kuaishou.com/u/test")).toBe(true);
  });

  it("matchURL 不匹配其他域名", () => {
    const p = new KuaishouParser();
    expect(p.matchURL("https://live.bilibili.com/123")).toBe(false);
    expect(p.matchURL("https://www.douyu.com/123")).toBe(false);
    expect(p.matchURL("https://example.com")).toBe(false);
  });

  it("extractRoomId 从 URL 中提取 userId", async () => {
    const p = new KuaishouParser();
    expect(await p.extractRoomId("https://live.kuaishou.com/u/kpl2026")).toBe("kpl2026");
  });

  it("extractRoomId 处理含中文的 userId", async () => {
    const p = new KuaishouParser();
    expect(await p.extractRoomId("https://live.kuaishou.com/u/测试主播")).toBe("测试主播");
  });

  it("extractRoomId 对非快手 URL 抛异常", async () => {
    const p = new KuaishouParser();
    await expect(p.extractRoomId("https://example.com")).rejects.toThrow("不是快手直播链接");
  });

  it("extractRoomId 对无 userId 的 URL 抛异常", async () => {
    const p = new KuaishouParser();
    await expect(p.extractRoomId("https://live.kuaishou.com/u/")).rejects.toThrow("无法提取 userId");
  });

  it("extractRoomId 支持 /user/ 格式", async () => {
    const p = new KuaishouParser();
    expect(await p.extractRoomId("https://live.kuaishou.com/user/kpl2027")).toBe("kpl2027");
  });
});
