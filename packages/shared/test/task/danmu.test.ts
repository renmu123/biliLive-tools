import { describe, it, expect, vi } from "vitest";
import fs from "fs-extra";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import * as video from "../../src/task/video.js";
import * as utils from "../../src/utils/index.js";
import { taskQueue } from "../../src/task/task.js";
import { DANMU_DEAFULT_CONFIG } from "../../src/presets/danmuPreset.js";
import {
  processDanmuOffset,
  generateMergedXmlContent,
  processXmlItems,
  mergeXml,
  convertXml2Ass,
} from "../../src/task/danmu.js";

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

  it.each([
    { name: "未传 metadata", metadata: undefined, styleTag: "RecorderXmlStyle" },
    { name: "metadata 为 null", metadata: null, styleTag: "RecorderXmlStyle" },
    { name: "metadata 为空对象", metadata: {}, styleTag: "RecorderXmlStyle" },
    {
      name: "普通录制文件",
      metadata: { user_name: "主播", room_id: "123" },
      styleTag: "RecorderXmlStyle",
    },
    {
      name: "metadata 包含录播姬版本",
      metadata: { BililiveRecorderVersion: "2.0.0", user_name: "主播", room_id: "123" },
      styleTag: "BililiveRecorderXmlStyle",
    },
  ])("$name 时应使用 $styleTag", ({ metadata, styleTag }) => {
    const result = generateMergedXmlContent([], [], [], [], metadata);
    const parsed = new XMLParser().parse(result);

    expect(parsed.i).toHaveProperty(styleTag);
    expect(parsed.i).not.toHaveProperty(
      styleTag === "RecorderXmlStyle" ? "BililiveRecorderXmlStyle" : "RecorderXmlStyle",
    );
  });

  it.each([
    { styleTag: "RecorderXmlStyle", metadata: { user_name: "主播<&>" } },
    {
      styleTag: "BililiveRecorderXmlStyle",
      metadata: { user_name: "主播<&>", BililiveRecorderVersion: "2.0.0" },
    },
  ])("$styleTag 应保留有效的样式、预览脚本和弹幕内容", ({ styleTag, metadata }) => {
    const danmu = {
      "@_p": "3661.125,1,25,16777215,0,0,123456,0",
      "@_user": '用户<&>"',
      "#text": '弹幕<&>"',
    };
    const result = generateMergedXmlContent([danmu], [], [], [], metadata);

    expect(XMLValidator.validate(result)).toBe(true);
    const parsed = new XMLParser({ ignoreAttributes: false, parseTagValue: false }).parse(result);
    const stylesheet = parsed.i[styleTag]["z:stylesheet"];
    expect(parsed["?xml-stylesheet"]).toMatchObject({
      "@_type": "text/xsl",
      "@_href": `#${stylesheet["@_id"]}`,
    });
    expect(stylesheet).toMatchObject({
      "@_version": "1.0",
      "@_id": "s",
      "@_xml:id": "s",
      "@_xmlns:z": "http://www.w3.org/1999/XSL/Transform",
      "z:output": { "@_method": "html" },
      "z:template": { "@_match": "/" },
    });
    for (const tag of ["d", "guard", "sc", "gift"]) {
      expect(result).toContain(`<z:for-each select="/i/${tag}">`);
    }
    expect(parsed.i.metadata).toEqual(metadata);
    expect(parsed.i.d).toEqual(danmu);

    // 执行预览脚本，验证时间格式化和用户 ID 的模板插值未被 XML 转义破坏。
    const cells = Array.from({ length: 5 }, () => ({ textContent: "", innerHTML: "" }));
    cells[4].textContent = danmu["@_p"];
    const preview = new Function("document", stylesheet["z:template"].html.script);
    preview({ querySelectorAll: () => [{}, { querySelectorAll: () => cells }] });

    expect(cells[1].textContent).toBe("01:01:01.125");
    expect(cells[2].innerHTML).toContain(">123456</a>");
  });
});

describe("mergeXml", () => {
  const recorderXml = `<i>
<BililiveRecorder version="2.0.0" />
<BililiveRecorderRecordInfo roomid="123" name="主播" title="直播标题" start_time="2024-08-20T09:48:07+08:00" />
<d p="1,1,25,16777215,0,0,123456,0" user="用户">测试弹幕</d>
</i>`;

  it.each([
    {
      name: "普通录制文件",
      xml: `<i>
<metadata>
<user_name>主播</user_name>
<room_id>123</room_id>
<room_title>直播标题</room_title>
<video_start_time>1724118487000</video_start_time>
<platform>bilibili</platform>
</metadata>
<d p="1,1,25,16777215,0,0,123456,0" user="用户">测试弹幕</d>
</i>`,
      saveMeta: true,
      styleTag: "RecorderXmlStyle",
    },
    {
      name: "录播姬文件",
      xml: recorderXml,
      saveMeta: true,
      styleTag: "BililiveRecorderXmlStyle",
    },
    {
      name: "未保留元数据的录播姬文件",
      xml: recorderXml,
      saveMeta: false,
      styleTag: "RecorderXmlStyle",
    },
  ])("$name 应正确处理 parseMeta 结果", async ({ xml, saveMeta, styleTag }) => {
    const directory = await fs.mkdtemp(join(tmpdir(), "bililive-merge-xml-"));
    const readVideoMeta = vi.spyOn(video, "readVideoMeta").mockResolvedValue({
      format: { duration: 10 },
    } as Awaited<ReturnType<typeof video.readVideoMeta>>);
    try {
      const danmakuPath = join(directory, "input.xml");
      const output = join(directory, "merged.xml");
      await fs.writeFile(danmakuPath, xml);

      await mergeXml([{ videoPath: join(directory, "input.mp4"), danmakuPath }], {
        output,
        saveMeta,
      });

      const parsed = new XMLParser({ ignoreAttributes: false, parseTagValue: false }).parse(
        await fs.readFile(output, "utf8"),
      );
      expect(parsed.i).toHaveProperty(styleTag);
      expect(parsed.i.d["#text"]).toBe("测试弹幕");
      if (saveMeta) {
        expect(parsed.i.metadata).toMatchObject({
          user_name: "主播",
          room_id: "123",
          room_title: "直播标题",
          video_start_time: "1724118487000",
        });
        if (styleTag === "BililiveRecorderXmlStyle") {
          expect(parsed.i.BililiveRecorderVersion).toBe("2.0.0");
        } else {
          expect(parsed.i.metadata.platform).toBe("bilibili");
        }
      } else {
        expect(parsed.i.metadata).toBe("");
      }
    } finally {
      readVideoMeta.mockRestore();
      await fs.remove(directory);
    }
  });
});

describe("genProcessedXml", () => {
  it.each([
    {
      name: "原始录播姬文件",
      metadataXml: `<BililiveRecorder version="2.0.0" />
<BililiveRecorderRecordInfo roomid="123" name="主播" title="直播标题" start_time="2024-08-20T09:48:07+08:00" />`,
    },
    {
      name: "已合并的录播姬文件",
      metadataXml: `<BililiveRecorderVersion>2.0.0</BililiveRecorderVersion>
<metadata>
<user_name>主播</user_name>
<room_id>123</room_id>
<room_title>直播标题</room_title>
<video_start_time>1724118487000</video_start_time>
</metadata>`,
    },
  ])("处理$name 时应保留录播姬字段和样式", async ({ metadataXml }) => {
    const directory = await fs.mkdtemp(join(tmpdir(), "bililive-processed-xml-"));
    const getTempPath = vi.spyOn(utils, "getTempPath").mockReturnValue(directory);
    const getBinPath = vi.spyOn(video, "getBinPath").mockReturnValue({
      ffmpegPath: "",
      ffprobePath: "",
      mesioPath: "",
      bililiveRecorderPath: "",
      audiowaveformPath: "",
      danmuFactoryPath: "",
    });
    // 只检查提交给转换任务的 XML，不启动外部转换程序。
    const addTask = vi.spyOn(taskQueue, "addTask").mockImplementation(() => {});
    try {
      const input = join(directory, "input.xml");
      await fs.writeFile(
        input,
        `<i>
${metadataXml}
<d p="1,1,25,16777215,0,0,123456,0" user="用户">保留弹幕</d>
<d p="2,1,25,16777215,0,0,123456,0" user="用户">过滤弹幕</d>
</i>`,
      );

      const task = await convertXml2Ass(
        { input, output: "processed" },
        {
          ...DANMU_DEAFULT_CONFIG,
          filterFunction: 'function filter(type, danmu) { return danmu["#text"] !== "过滤弹幕"; }',
        },
        { temp: true },
      );
      const xml = await fs.readFile(task.input, "utf8");
      expect(XMLValidator.validate(xml)).toBe(true);
      const parsed = new XMLParser({ ignoreAttributes: false, parseTagValue: false }).parse(xml);
      expect(parsed.i.metadata).toMatchObject({
        user_name: "主播",
        room_id: "123",
        room_title: "直播标题",
        video_start_time: "1724118487000",
      });
      expect(parsed.i.BililiveRecorderVersion).toBe("2.0.0");
      expect(parsed.i).toHaveProperty("BililiveRecorderXmlStyle");
      expect(parsed.i).not.toHaveProperty("RecorderXmlStyle");
      expect(parsed.i.d["#text"]).toBe("保留弹幕");
      expect(xml).not.toContain("过滤弹幕");
      expect(addTask).toHaveBeenCalledWith(task, true);
    } finally {
      addTask.mockRestore();
      getBinPath.mockRestore();
      getTempPath.mockRestore();
      await fs.remove(directory);
    }
  });
});

describe("processXmlItems", () => {
  it("应支持将 danmu 转换为 gift 并重新分桶", () => {
    const result = processXmlItems(
      [
        {
          sourceType: "danmu",
          item: {
            "@_p": "10.5,1,25,16777215,1745081775235,0,123456,123456,0",
            "@_user": "用户1",
            "#text": "弹幕1",
          },
        },
      ],
      `
      function transform(type, data) {
        if (type !== "danmu") return data;
        return {
          type: "gift",
          "@_ts": "10.5",
          "@_user": data["@_user"],
          "@_giftname": data["#text"],
          "@_giftcount": "1",
        };
      }
      `,
    );

    expect(result.danmu).toHaveLength(0);
    expect(result.gift).toHaveLength(1);
    expect(result.gift[0]["@_giftname"]).toBe("弹幕1");
    expect(result.gift[0]["@_user"]).toBe("用户1");
  });

  it("应在 filter 后再执行 transform", () => {
    const result = processXmlItems(
      [
        {
          sourceType: "danmu",
          item: {
            "@_p": "10.5,1,25,16777215,1745081775235,0,123456,123456,0",
            "@_user": "保留用户",
            "#text": "保留弹幕",
          },
        },
        {
          sourceType: "danmu",
          item: {
            "@_p": "11.5,1,25,16777215,1745081775235,0,123456,123456,0",
            "@_user": "过滤用户",
            "#text": "过滤弹幕",
          },
        },
      ],
      `
      function filter(type, data) {
        return data["@_user"] !== "过滤用户";
      }
      function transform(type, data) {
        return {
          type: "gift",
          "@_ts": "20.0",
          "@_user": data["@_user"],
          "@_giftname": data["#text"],
        };
      }
      `,
    );

    expect(result.gift).toHaveLength(1);
    expect(result.gift[0]["@_user"]).toBe("保留用户");
  });

  it("目标类型缺少必需字段时应丢弃该条数据", () => {
    const result = processXmlItems(
      [
        {
          sourceType: "danmu",
          item: {
            "@_p": "10.5,1,25,16777215,1745081775235,0,123456,123456,0",
            "@_user": "用户1",
            "#text": "弹幕1",
          },
        },
      ],
      `
      function transform(type, data) {
        return {
          type: "gift",
          "@_user": data["@_user"],
          "@_giftname": data["#text"],
        };
      }
      `,
    );

    expect(result.danmu).toHaveLength(0);
    expect(result.gift).toHaveLength(0);
    expect(result.sc).toHaveLength(0);
    expect(result.guard).toHaveLength(0);
  });
});
