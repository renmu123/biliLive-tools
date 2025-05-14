import { describe, it, expect } from "vitest";
import { processDanmuOffset, generateMergedXmlContent } from "../../src/task/danmu.js";

describe("processDanmuOffset", () => {
  // 测试普通弹幕(p属性)的时间偏移
  it("应正确处理普通弹幕的时间偏移", () => {
    const danmuItems = [
      {
        "@_p": "10.5,1,25,16777215,1745081775235,0,123456,123456,0",
        "@_user": "用户1",
        "#text": "测试弹幕1",
      },
      {
        "@_p": "20.8,4,25,16777215,1745081780123,0,234567,234567,0",
        "@_user": "用户2",
        "#text": "测试弹幕2",
      },
    ];
    const videoDuration = 30;
    const startOffset = 60;
    const isP = true;

    const result = processDanmuOffset(danmuItems, videoDuration, startOffset, isP);

    expect(result).toHaveLength(2);
    expect(result[0]["@_p"]).toMatch(/^70.500,/); // 10.5 + 60
    expect(result[1]["@_p"]).toMatch(/^80.800,/); // 20.8 + 60
  });

  // 测试其他类型弹幕(ts属性)的时间偏移
  it("应正确处理其他类型弹幕的时间偏移", () => {
    const items = [
      { "@_ts": "5.2", "@_user": "用户1" },
      { "@_ts": "15.7", "@_user": "用户2" },
    ];
    const videoDuration = 20;
    const startOffset = 30;

    const result = processDanmuOffset(items, videoDuration, startOffset);

    expect(result).toHaveLength(2);
    expect(result[0]["@_ts"]).toBe("35.200"); // 5.2 + 30
    expect(result[1]["@_ts"]).toBe("45.700"); // 15.7 + 30
  });

  // 测试过滤超出视频时长的弹幕
  it("应过滤掉超出视频时长的弹幕", () => {
    const danmuItems = [
      { "@_p": "10.5,1,25,16777215,1745081775235,0,123456,123456,0", "@_user": "用户1" },
      { "@_p": "25.8,4,25,16777215,1745081780123,0,234567,234567,0", "@_user": "用户2" },
      { "@_p": "35.2,1,25,16777215,1745081785456,0,345678,345678,0", "@_user": "用户3" }, // 超出时长
    ];
    const otherItems = [
      { "@_ts": "5.2", "@_user": "用户1" },
      { "@_ts": "15.7", "@_user": "用户2" },
      { "@_ts": "25.3", "@_user": "用户3" }, // 超出时长
    ];

    // 测试普通弹幕
    const resultDanmu = processDanmuOffset(danmuItems, 30, 0, true);
    expect(resultDanmu).toHaveLength(2);
    expect(resultDanmu.map((item) => item["@_user"])).toEqual(["用户1", "用户2"]);

    // 测试其他类型弹幕
    const resultOther = processDanmuOffset(otherItems, 20, 0);
    expect(resultOther).toHaveLength(2);
    expect(resultOther.map((item) => item["@_user"])).toEqual(["用户1", "用户2"]);
  });

  // 测试空数组输入
  it("应正确处理空数组输入", () => {
    const emptyArray = [];

    const resultDanmu = processDanmuOffset(emptyArray, 30, 10, true);
    const resultOther = processDanmuOffset(emptyArray, 30, 10);

    expect(resultDanmu).toHaveLength(0);
    expect(resultOther).toHaveLength(0);
  });

  // 测试正好在视频时长边界的弹幕
  it("应保留正好在视频时长边界的弹幕", () => {
    const danmuItems = [
      { "@_p": "30.0,1,25,16777215,1745081775235,0,123456,123456,0", "@_user": "用户1" },
    ];
    const otherItems = [{ "@_ts": "20.0", "@_user": "用户1" }];

    const resultDanmu = processDanmuOffset(danmuItems, 30, 5, true);
    const resultOther = processDanmuOffset(otherItems, 20, 10);

    expect(resultDanmu).toHaveLength(1);
    expect(resultDanmu[0]["@_p"]).toMatch(/^35.000,/); // 30.0 + 5

    expect(resultOther).toHaveLength(1);
    expect(resultOther[0]["@_ts"]).toBe("30.000"); // 20.0 + 10
  });

  // 测试p属性中的其他参数保持不变
  it("应保持p属性中的其他参数不变", () => {
    const original = {
      "@_p": "10.5,1,25,16777215,1745081775235,0,123456,123456,0",
      "@_user": "用户1",
    };
    const result = processDanmuOffset([original], 30, 5, true)[0];

    const originalParts = original["@_p"].split(",");
    const resultParts = result["@_p"].split(",");

    // 第一个参数是时间，应该被修改
    expect(resultParts[0]).toBe("15.500"); // 10.5 + 5

    // 其他参数应该保持不变
    for (let i = 1; i < originalParts.length; i++) {
      expect(resultParts[i]).toBe(originalParts[i]);
    }
  });
});

describe("generateMergedXmlContent", () => {
  it("应正确生成合并的XML内容", () => {
    const danmuku = [
      {
        "@_p": "10.5,1,25,16777215,1745081775235,0,123456,123456,0",
        "@_user": "用户1",
        "#text": "弹幕1",
      },
    ];
    const gift = [{ "@_ts": "5.2", "@_user": "用户2", "@_giftname": "礼物1" }];
    const sc = [{ "@_ts": "15.7", "@_user": "用户3", "#text": "SC1" }];
    const guard = [{ "@_ts": "20.3", "@_user": "用户4", "@_level": "1" }];

    const result = generateMergedXmlContent(danmuku, gift, sc, guard);

    // 验证基本结构和内容
    expect(result).toContain('<?xml version="1.0" encoding="utf-8"?>');
    expect(result).toContain("<i>");
    expect(result).toContain(
      '<d p="10.5,1,25,16777215,1745081775235,0,123456,123456,0" user="用户1">弹幕1</d>',
    );
    expect(result).toContain('<gift ts="5.2" user="用户2" giftname="礼物1">');
    expect(result).toContain('<sc ts="15.7" user="用户3">SC1</sc>');
    expect(result).toContain('<guard ts="20.3" user="用户4" level="1">');
    expect(result).toContain("</i>");
  });

  it("应处理空数组输入", () => {
    const result = generateMergedXmlContent([], [], [], []);

    expect(result).toContain('<?xml version="1.0" encoding="utf-8"?>');
    expect(result).toContain("<i>");
    expect(result).toContain("</i>");
  });
});
