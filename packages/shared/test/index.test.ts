import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, describe, it, beforeEach, afterEach } from "vitest";
import { escaped } from "../src/utils/index";
import { Danmu } from "../src/danmu/index";
import { getHardwareAcceleration } from "../src/utils/index";
import { parseXmlObj } from "../src/danmu/index";

export const __dirname = dirname(fileURLToPath(import.meta.url));

describe.concurrent("genDanmuArgs", () => {
  let danmu: Danmu;

  beforeEach(() => {
    danmu = new Danmu("path/to/executable");
  });

  afterEach(() => {
    // Clean up any child processes or resources
    if (danmu.child) {
      danmu.child.kill();
    }
  });

  it("基础弹幕参数", () => {
    const config = {
      resolution: [1920, 1080],
      msgboxsize: [400, 200],
      msgboxpos: [100, 100],
      blockmode: ["R2L", "L2R"],
      statmode: ["TABLE", "HISTOGRAM"],
      fontname: "Arial",
      blacklist: "",
      showusernames: true,
      saveblocked: true,
    };

    const expectedArgs = [
      "--resolution 1920x1080",
      "--msgboxsize 400x200",
      "--msgboxpos 100x100",
      "--blockmode R2L-L2R",
      "--statmode TABLE-HISTOGRAM",
      '--fontname "Arial"',
      "--showusernames true",
      "--saveblocked true",
    ];

    // @ts-ignore
    const params = danmu.genDanmuArgs(config);
    // console.log(params);
    expect(params).toEqual(expectedArgs);
  });
  it("百分制透明度应正确转换为16进制", () => {
    const config = {
      resolution: [1920, 1080],
      msgboxsize: [400, 200],
      msgboxpos: [100, 100],
      blockmode: ["R2L", "L2R"],
      statmode: ["TABLE", "HISTOGRAM"],
      fontname: "Arial",
      blacklist: "",
      opacity100: 100,
    };

    const expectedArgs = [
      "--resolution 1920x1080",
      "--msgboxsize 400x200",
      "--msgboxpos 100x100",
      "--blockmode R2L-L2R",
      "--statmode TABLE-HISTOGRAM",
      '--fontname "Arial"',
      "--opacity 255",
    ];

    // @ts-ignore
    const params = danmu.genDanmuArgs(config);
    // console.log(params);
    expect(params).toEqual(expectedArgs);
  });
  it("不存在于默认配置中的字段不做处理", () => {
    const config = {
      resolution: [1920, 1080],
      msgboxsize: [400, 200],
      msgboxpos: [100, 100],
      blockmode: ["R2L", "L2R"],
      statmode: ["TABLE", "HISTOGRAM"],
      fontname: "Arial",
      blacklist: "",
      opacity100: 100,
      test: "test",
    };

    const expectedArgs = [
      "--resolution 1920x1080",
      "--msgboxsize 400x200",
      "--msgboxpos 100x100",
      "--blockmode R2L-L2R",
      "--statmode TABLE-HISTOGRAM",
      '--fontname "Arial"',
      "--opacity 255",
    ];

    // @ts-ignore
    const params = danmu.genDanmuArgs(config);
    // console.log(params);
    expect(params).toEqual(expectedArgs);
  });
  it("弹幕参数：弹幕密度无限", () => {
    const config = {
      resolution: [1920, 1080],
      msgboxsize: [400, 200],
      msgboxpos: [100, 100],
      blockmode: ["R2L", "L2R"],
      statmode: ["TABLE", "HISTOGRAM"],
      fontname: "Arial",
      blacklist: "",
      density: 0,
      customDensity: 50,
    };

    const expectedArgs = [
      "--resolution 1920x1080",
      "--msgboxsize 400x200",
      "--msgboxpos 100x100",
      "--blockmode R2L-L2R",
      "--statmode TABLE-HISTOGRAM",
      '--fontname "Arial"',
      "--density 0",
    ];

    // @ts-ignore
    const params = danmu.genDanmuArgs(config);
    // console.log(params);
    expect(params).toEqual(expectedArgs);
  });
  it("弹幕参数：弹幕密度按条数", () => {
    const config = {
      resolution: [1920, 1080],
      msgboxsize: [400, 200],
      msgboxpos: [100, 100],
      blockmode: ["R2L", "L2R"],
      statmode: ["TABLE", "HISTOGRAM"],
      fontname: "Arial",
      blacklist: "",
      density: -2,
      customDensity: 50,
    };

    const expectedArgs = [
      "--resolution 1920x1080",
      "--msgboxsize 400x200",
      "--msgboxpos 100x100",
      "--blockmode R2L-L2R",
      "--statmode TABLE-HISTOGRAM",
      '--fontname "Arial"',
      "--density 50",
    ];

    // @ts-ignore
    const params = danmu.genDanmuArgs(config);
    // console.log(params);
    expect(params).toEqual(expectedArgs);
  });

  it("should convert XML to ASS", async () => {
    const input = join(__dirname, "index.test.ts");
    const output = "path/to/output.ass";
    const argsObj = {
      resolution: [1920, 1080],
      msgboxsize: [400, 200],
      msgboxpos: [100, 100],
      blockmode: ["R2L", "L2R"],
      statmode: ["TABLE", "HISTOGRAM"],
      fontname: "Arial",
      blacklist: "",
      density: 0,
      customDensity: 50,
    };

    const expectedCommand = `"path/to/executable" -i "${input}" -o "path/to/output.ass" --ignore-warnings --resolution 1920x1080 --msgboxsize 400x200 --msgboxpos 100x100 --blockmode R2L-L2R --statmode TABLE-HISTOGRAM --fontname "Arial" --density 0`;

    try {
      // @ts-ignore
      await danmu.convertXml2Ass(input, output, argsObj);
      expect(danmu.command).toEqual(expectedCommand);
    } catch (error) {
      expect(danmu.command).toEqual(expectedCommand);
    }
  });
});
describe("escaped", () => {
  it("should escape special characters in the string", () => {
    const input = "C:\\path\\to\\file.txt";
    const output = escaped(input);
    expect(output).toEqual("C\\\\:/path/to/file.txt");
  });

  it("should escape colons in the string", () => {
    const input = "file:with:colons.txt";
    const output = escaped(input);
    expect(output).toEqual("file\\\\:with\\\\:colons.txt");
  });

  // Add more test cases if needed
});

describe.concurrent("getHardwareAcceleration", () => {
  it("should return 'nvenc' for NVIDIA encoder", () => {
    const encoder = "h264_nvenc";
    const acceleration = getHardwareAcceleration(encoder);
    expect(acceleration).toEqual("nvenc");
  });

  it("should return 'qsv' for Intel Quick Sync Video encoder", () => {
    const encoder = "h264_qsv";
    const acceleration = getHardwareAcceleration(encoder);
    expect(acceleration).toEqual("qsv");
  });

  it("should return 'amf' for AMD Advanced Media Framework encoder", () => {
    const encoder = "h264_amf";
    const acceleration = getHardwareAcceleration(encoder);
    expect(acceleration).toEqual("amf");
  });

  it("should return 'copy' for 'copy' encoder", () => {
    const encoder = "copy";
    const acceleration = getHardwareAcceleration(encoder);
    expect(acceleration).toEqual("copy");
  });

  it("should return 'cpu' for software encoders", () => {
    const encoder = "libx264";
    const acceleration = getHardwareAcceleration(encoder);
    expect(acceleration).toEqual("cpu");
  });

  it("should throw an error for unknown encoder", () => {
    const encoder = "unknown_encoder";
    expect(() => {
      // @ts-ignore
      getHardwareAcceleration(encoder);
    }).toThrowError("未知的编码器: unknown_encoder");
  });
});

// 由于采用原生包，导致无法测试
describe.concurrent("parseXmlObj", () => {
  it("should parse XML data and return the parsed object", async () => {
    const input = `<?xml version="1.0" encoding="utf-8"?>
    <i>
      <d p="0.050,1,25,16777215,1705759424593,0,401378687,0" user="呵呵君在线">主播 封面的女孩子是谁你妹妹吗 能不能换</d>
      <d p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</d>
      <sc p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</sc>
      <guard p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</guard>
      <gift p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</gift>
    </i>`;

    const expectedOutput = {
      danmuku: [
        {
          "@_p": "0.050,1,25,16777215,1705759424593,0,401378687,0",
          "@_user": "呵呵君在线",
          "#text": "主播 封面的女孩子是谁你妹妹吗 能不能换",
        },
        {
          "@_p": "0.050,1,25,16777215,1705759424480,0,649778941,0",
          "@_user": "邻桌同学",
          "#text": "黎明杀机",
        },
      ],
      sc: [
        {
          "@_p": "0.050,1,25,16777215,1705759424480,0,649778941,0",
          "@_user": "邻桌同学",
          "#text": "黎明杀机",
        },
      ],
      guard: [
        {
          "@_p": "0.050,1,25,16777215,1705759424480,0,649778941,0",
          "@_user": "邻桌同学",
          "#text": "黎明杀机",
        },
      ],
      gift: [
        {
          "@_p": "0.050,1,25,16777215,1705759424480,0,649778941,0",
          "@_user": "邻桌同学",
          "#text": "黎明杀机",
        },
      ],
    };

    const { danmuku, sc, guard, gift } = await parseXmlObj(input);
    expect(danmuku).toEqual(expectedOutput.danmuku);
    expect(sc).toEqual(expectedOutput.sc);
    expect(guard).toEqual(expectedOutput.guard);
    expect(gift).toEqual(expectedOutput.gift);
  });
  it("should parse XML data and return the parsed object and d is one", async () => {
    const input = `<?xml version="1.0" encoding="utf-8"?>
    <i>
      <d p="0.050,1,25,16777215,1705759424593,0,401378687,0" user="呵呵君在线">主播 封面的女孩子是谁你妹妹吗 能不能换</d>
    </i>`;

    const expectedOutput = {
      danmuku: [
        {
          "@_p": "0.050,1,25,16777215,1705759424593,0,401378687,0",
          "@_user": "呵呵君在线",
          "#text": "主播 封面的女孩子是谁你妹妹吗 能不能换",
        },
      ],
      sc: [],
      guard: [],
      gift: [],
    };

    const { danmuku } = await parseXmlObj(input);
    expect(danmuku).toEqual(expectedOutput.danmuku);
  });
  it("should parse XML data and return the parsed object and root ele is not i ", async () => {
    const input = `<?xml version="1.0" encoding="utf-8"?>
    <root>
      <d p="0.050,1,25,16777215,1705759424593,0,401378687,0" user="呵呵君在线">主播 封面的女孩子是谁你妹妹吗 能不能换</d>
      <d p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</d>
      <sc p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</sc>
      <guard p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</guard>
      <gift p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</gift>
    </root>`;

    const expectedOutput = {
      danmuku: [
        {
          "@_p": "0.050,1,25,16777215,1705759424593,0,401378687,0",
          "@_user": "呵呵君在线",
          "#text": "主播 封面的女孩子是谁你妹妹吗 能不能换",
        },
        {
          "@_p": "0.050,1,25,16777215,1705759424480,0,649778941,0",
          "@_user": "邻桌同学",
          "#text": "黎明杀机",
        },
      ],
      sc: [
        {
          "@_p": "0.050,1,25,16777215,1705759424480,0,649778941,0",
          "@_user": "邻桌同学",
          "#text": "黎明杀机",
        },
      ],
      guard: [
        {
          "@_p": "0.050,1,25,16777215,1705759424480,0,649778941,0",
          "@_user": "邻桌同学",
          "#text": "黎明杀机",
        },
      ],
      gift: [
        {
          "@_p": "0.050,1,25,16777215,1705759424480,0,649778941,0",
          "@_user": "邻桌同学",
          "#text": "黎明杀机",
        },
      ],
    };

    const { danmuku, sc, guard, gift } = await parseXmlObj(input);
    expect(danmuku).toEqual(expectedOutput.danmuku);
    expect(sc).toEqual(expectedOutput.sc);
    expect(guard).toEqual(expectedOutput.guard);
    expect(gift).toEqual(expectedOutput.gift);
  });

  it("should handle empty XML data and return an empty object", async () => {
    const input = "";

    const expectedOutput = {
      jObj: {},
      danmuku: [],
      sc: [],
      guard: [],
      gift: [],
    };

    const { danmuku } = await parseXmlObj(input);
    expect(danmuku).toEqual(expectedOutput.danmuku);
  });
});
