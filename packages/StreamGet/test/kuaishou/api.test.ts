import { describe, it, expect } from "vitest";
import { extractStreams, parseInitialState } from "../../src/kuaishou/api.js";
import { ParseError } from "../../src/errors.js";

describe("parseInitialState", () => {
  it("应该从标准 HTML 中提取 __INITIAL_STATE__", () => {
    const html = `<html><script>window.__INITIAL_STATE__={"key":"value"};</script></html>`;
    const result = parseInitialState(html);
    expect(result).toEqual({ key: "value" });
  });

  it("应该处理复杂的嵌套 JSON", () => {
    const html = `<html><script>window.__INITIAL_STATE__={"liveroom":{"playList":[{"isLiving":true}]}};</script></html>`;
    const result = parseInitialState(html);
    expect(result.liveroom.playList[0].isLiving).toBe(true);
  });

  it("没有 __INITIAL_STATE__ 标记时应抛 ParseError", () => {
    const html = "<html><body>no initial state here</body></html>";
    expect(() => parseInitialState(html)).toThrow(ParseError);
    expect(() => parseInitialState(html)).toThrow(/未找到/);
  });

  it("__INITIAL_STATE__ 后不是大括号时应抛 ParseError", () => {
    const html = `window.__INITIAL_STATE__=    "not-an-object"`;
    expect(() => parseInitialState(html)).toThrow(ParseError);
    expect(() => parseInitialState(html)).toThrow(/格式异常/);
  });

  it("JSON 未正确闭合时应抛 ParseError", () => {
    const html = `window.__INITIAL_STATE__={"key":"value`;
    expect(() => parseInitialState(html)).toThrow(ParseError);
    expect(() => parseInitialState(html)).toThrow(/未正确闭合/);
  });

  it("JSON 语法错误时应抛 ParseError", () => {
    const html = `window.__INITIAL_STATE__={"key": invalid,}`;
    expect(() => parseInitialState(html)).toThrow(ParseError);
    expect(() => parseInitialState(html)).toThrow(/解析失败/);
  });

  it("空 HTML 字符串时应抛 ParseError", () => {
    expect(() => parseInitialState("")).toThrow(ParseError);
  });

  it("应正确处理 $ 等特殊字符", () => {
    const jsonStr = JSON.stringify({ $encode: "abc123!!", sign: "xyz" });
    const html = `window.__INITIAL_STATE__=${jsonStr};</script>`;
    const result = parseInitialState(html);
    expect(result.$encode).toBe("abc123!!");
  });

  it("应正确处理含有嵌套大括号的 JSON", () => {
    const html = `window.__INITIAL_STATE__={"a":{"b":{"c":["x","y"]}}};`;
    const result = parseInitialState(html);
    expect(result.a.b.c).toEqual(["x", "y"]);
  });

  it("应正确处理大数据量的页面 HTML（有注释和script前后的空格）", () => {
    // 模拟 SSR 页面的典型结构
    const jsonData = JSON.stringify({
      liveroom: {
        playList: [
          {
            isLiving: true,
            liveStream: {
              playUrls: {
                h264: {
                  adaptationSet: {
                    representation: [
                      { url: "rtmp://test.flv", qualityType: "HIGH" },
                    ],
                  },
                },
              },
            },
          },
        ],
      },
    });
    const html = [
      '<!DOCTYPE html>',
      '<html lang="zh-CN">',
      '<head><meta charset="utf-8"></head>',
      '<body>',
      '<div id="app"></div>',
      `<script>window.__INITIAL_STATE__=${jsonData};</script>`,
      '<script src="app.js"></script>',
      '</body>',
      '</html>',
    ].join("\n");
    const result = parseInitialState(html);
    expect(result.liveroom.playList[0].isLiving).toBe(true);
    expect(
      result.liveroom.playList[0].liveStream.playUrls.h264.adaptationSet
        .representation[0].qualityType,
    ).toBe("HIGH");
  });
});

describe("extractStreams", () => {
  it("liveroom 为 null 时应抛 ParseError", () => {
    expect(() => extractStreams(null)).toThrow(ParseError);
    expect(() => extractStreams(null)).toThrow(/playList/);
  });

  it("playList 为空数组时应返回空数组", () => {
    const result = extractStreams({ playList: [] });
    expect(result).toEqual([]);
  });

  it("playList[0].isLiving 为 false 时应返回空数组", () => {
    const result = extractStreams({
      playList: [{ isLiving: false }],
    });
    expect(result).toEqual([]);
  });

  it("缺少 liveStream.playUrls 时不应抛异常（降级到 hls 或无流）", () => {
    const liveroom = {
      playList: [{ isLiving: true, liveStream: {} }],
    };
    const result = extractStreams(liveroom);
    expect(Array.isArray(result)).toBe(true);
  });

  it("既无 h264 也无 h265 但无 hls 时应返回空数组", () => {
    const liveroom = {
      playList: [
        {
          isLiving: true,
          liveStream: { playUrls: { other: {} } },
        },
      ],
    };
    const result = extractStreams(liveroom);
    expect(result).toEqual([]);
  });

  it("representation 为空数组时应返回空数组", () => {
    const liveroom = {
      playList: [
        {
          isLiving: true,
          liveStream: {
            playUrls: {
              h264: {
                adaptationSet: { representation: [] },
              },
            },
          },
        },
      ],
    };
    const result = extractStreams(liveroom);
    expect(result).toEqual([]);
  });

  it("url 缺失的 representation 应被跳过", () => {
    const liveroom = {
      playList: [
        {
          isLiving: true,
          liveStream: {
            playUrls: {
              h264: {
                adaptationSet: {
                  representation: [
                    { url: "rtmp://cdn1/stream", qualityType: "HIGH", bitrate: 4000000 },
                    { qualityType: "STANDARD", bitrate: 2000000 }, // 无 url
                    { url: null, qualityType: "STANDARD", bitrate: 1500000 }, // url 为 null
                  ],
                },
              },
            },
          },
        },
      ],
    };
    const result = extractStreams(liveroom);
    expect(result.length).toBeGreaterThanOrEqual(1);
    // 只有第一个 representation 有效
    expect(result[0].streams.length).toBe(1);
  });

  it("应按照 CDN 域名分组", () => {
    const liveroom = {
      playList: [
        {
          isLiving: true,
          liveStream: {
            playUrls: {
              h264: {
                adaptationSet: {
                  representation: [
                    {
                      url: "rtmp://cdn1.kuaishou.com/live/stream1",
                      qualityType: "HIGH",
                      bitrate: 4000000,
                      width: 1920,
                      height: 1080,
                    },
                    {
                      url: "rtmp://cdn1.kuaishou.com/live/stream2",
                      qualityType: "STANDARD",
                      bitrate: 2000000,
                      width: 1280,
                      height: 720,
                    },
                    {
                      url: "rtmp://cdn2.kuaishou.com/live/stream3",
                      qualityType: "HIGH",
                      bitrate: 3500000,
                      width: 1920,
                      height: 1080,
                    },
                  ],
                },
              },
            },
          },
        },
      ],
    };
    const result = extractStreams(liveroom);
    expect(result.length).toBe(2);
    expect(result[0].streams.length + result[1].streams.length).toBe(3);
  });

  it("实时 mock 数据提取后应有正确的质量描述", () => {
    const liveroom = {
      playList: [
        {
          isLiving: true,
          liveStream: {
            playUrls: {
              h264: {
                adaptationSet: {
                  representation: [
                    { url: "rtmp://cdn/stream", qualityType: "HIGH", bitrate: 4000000 },
                    { url: "rtmp://cdn/stream", qualityType: "STANDARD", bitrate: 2000000 },
                  ],
                },
              },
            },
          },
        },
      ],
    };
    const result = extractStreams(liveroom);
    expect(result[0].streams[0].qualityDesc).toBe("超清"); // HIGH → 超清
    expect(result[0].streams[1].qualityDesc).toBe("高清"); // STANDARD → 高清
    expect(result[0].streams[0].format).toBe("flv"); // 固定 flv
  });

  it("应提取 hlsPlayUrl 作为 HLS 兜底流", () => {
    const liveroom = {
      playList: [
        {
          isLiving: true,
          liveStream: {
            playUrls: {
              h264: {
                adaptationSet: {
                  representation: [
                    { url: "https://cdn1.pull.yximgs.com/stream.flv", qualityType: "HIGH", bitrate: 4000000 },
                  ],
                },
              },
            },
            hlsPlayUrl: "https://cdn1.hlspull.yximgs.com/stream.m3u8?auth=abc",
          },
        },
      ],
    };
    const result = extractStreams(liveroom);
    // FLV 和 HLS 使用不同 CDN, 所以 2 个 source
    expect(result.length).toBe(2);
    const flvSource = result.find(s => s.name === "cdn1.pull.yximgs.com");
    expect(flvSource).toBeDefined();
    expect(flvSource!.streams[0].format).toBe("flv");
    const hlsSource = result.find(s => s.name === "cdn1.hlspull.yximgs.com");
    expect(hlsSource).toBeDefined();
    expect(hlsSource!.streams[0].format).toBe("hls");
    expect(hlsSource!.streams[0].quality).toBe("HLS");
  });

  it("仅有 hlsPlayUrl 无 playUrls 时也能返回流", () => {
    const liveroom = {
      playList: [
        {
          isLiving: true,
          liveStream: {
            hlsPlayUrl: "https://cdn1.hlspull.yximgs.com/stream.m3u8?auth=abc",
          },
        },
      ],
    };
    const result = extractStreams(liveroom);
    expect(result.length).toBe(1);
    expect(result[0].streams.length).toBe(1);
    expect(result[0].streams[0].format).toBe("hls");
  });

  it("hlsPlayUrl 在不同 CDN 时作为独立 source", () => {
    const liveroom = {
      playList: [
        {
          isLiving: true,
          liveStream: {
            playUrls: {
              h264: {
                adaptationSet: {
                  representation: [
                    { url: "https://cdn-a.kuaishou.com/stream.flv", qualityType: "HIGH", bitrate: 4000000 },
                  ],
                },
              },
            },
            hlsPlayUrl: "https://cdn-b.hlspull.yximgs.com/stream.m3u8?auth=abc",
          },
        },
      ],
    };
    const result = extractStreams(liveroom);
    expect(result.length).toBe(2);
    const hlsSource = result.find(s => s.name === "cdn-b.hlspull.yximgs.com");
    expect(hlsSource).toBeDefined();
    expect(hlsSource!.streams[0].format).toBe("hls");
  });
});
