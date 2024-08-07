import { join } from "node:path";

import { expect, describe, it, beforeEach, afterEach } from "vitest";

import { parseXmlObj } from "../../src/danmu/index";
import { Danmu } from "../../src/danmu/index";

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
    };
    // const config = {
    //   resolution: [1920, 1080],
    //   scrolltime: 12,
    //   fixtime: 5,
    //   density: 0,
    //   fontname: "Microsoft YaHei",
    //   fontsize: 38,
    //   opacity: 255,
    //   outline: 0,
    //   shadow: 1,
    //   displayarea: 1,
    //   scrollarea: 1,
    //   bold: false,
    //   showusernames: false,
    //   showmsgbox: true,
    //   msgboxsize: [500, 1080],
    //   msgboxpos: [20, 0],
    //   msgboxfontsize: 38,
    //   msgboxduration: 10,
    //   giftminprice: 10,
    //   giftmergetolerance: 0,
    //   blockmode: [],
    //   statmode: [],
    //   resolutionResponsive: false,
    //   blacklist: "12",
    // };

    const expectedArgs = [
      "--resolution 1920x1080",
      "--msgboxsize 400x200",
      "--msgboxpos 100x100",
      "--blockmode R2L-L2R",
      "--statmode TABLE-HISTOGRAM",
      '--fontname "Arial"',
      "--showusernames true",
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
