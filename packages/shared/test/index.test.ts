import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, describe, it, beforeEach, afterEach } from "vitest";
import { filterBlacklist } from "../src/task/danmu";
import { escaped } from "../src/utils/index";
import { Danmu } from "../src/danmu/index";
import { getHardwareAcceleration } from "../src/utils/index";

export const __dirname = dirname(fileURLToPath(import.meta.url));
describe.concurrent("filterBlacklist", () => {
  it("有屏蔽词", () => {
    const input = `<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet type="text/xsl" href="#s"?>
<i>
  <d p="0.050,1,25,16777215,1705759424593,0,401378687,0" user="呵呵君在线">主播 封面的女孩子是谁你妹妹吗 能不能换</d>
  <d p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</d>
</i>`;
    const blacklist = ["主播", "主播2", "封面"];
    const output = filterBlacklist(input, blacklist);
    expect(output).toEqual(`<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet type="text/xsl" href="#s"?>
<i>
  <d p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</d>
</i>`);
  });
  it("有屏蔽词2", () => {
    const input = `<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet type="text/xsl" href="#s"?>
<root>
  <d p="0.050,1,25,16777215,1705759424593,0,401378687,0" user="呵呵君在线">主播 封面的女孩子是谁你妹妹吗 能不能换</d>
  <d p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</d>
</root>`;
    const blacklist = ["主播"];
    const output = filterBlacklist(input, blacklist);
    expect(output).toEqual(`<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet type="text/xsl" href="#s"?>
<root>
  <d p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</d>
</root>`);
  });
  it("无屏蔽词", () => {
    const input = `<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet type="text/xsl" href="#s"?>
<i a="test">
  <d p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</d>
  <gift p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</gift>
  <d p="0.050,1,25,16777215,1705759424593,0,401378687,0" user="呵呵君在线">主播 封面的女孩子是谁你妹妹吗 能不能换</d>
</i>`;
    const blacklist = [];
    const output = filterBlacklist(input, blacklist);
    expect(output).toEqual(`<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet type="text/xsl" href="#s"?>
<i a="test">
  <d p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</d>
  <gift p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</gift>
  <d p="0.050,1,25,16777215,1705759424593,0,401378687,0" user="呵呵君在线">主播 封面的女孩子是谁你妹妹吗 能不能换</d>
</i>`);
  });
  it("未中屏蔽词", () => {
    const input = `<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet type="text/xsl" href="#s"?>
<i>
  <d p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</d>
  <gift p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</gift>
  <d p="0.050,1,25,16777215,1705759424593,0,401378687,0" user="呵呵君在线">主播 封面的女孩子是谁你妹妹吗 能不能换</d>
</i>`;
    const blacklist = ["主播1"];
    const output = filterBlacklist(input, blacklist);
    expect(output).toEqual(`<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet type="text/xsl" href="#s"?>
<i>
  <d p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</d>
  <gift p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</gift>
  <d p="0.050,1,25,16777215,1705759424593,0,401378687,0" user="呵呵君在线">主播 封面的女孩子是谁你妹妹吗 能不能换</d>
</i>`);
  });
});

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
      blacklist: [],
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
      blacklist: [],
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
      blacklist: [],
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
      "--opacity 255.00",
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
      blacklist: [],
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
      blacklist: [],
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
      blacklist: [],
      density: 0,
      customDensity: 50,
    };

    const expectedCommand = `path/to/executable -i "${input}" -o "path/to/output.ass" --ignore-warnings --resolution 1920x1080 --msgboxsize 400x200 --msgboxpos 100x100 --blockmode R2L-L2R --statmode TABLE-HISTOGRAM --fontname "Arial" --density 0`;

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
