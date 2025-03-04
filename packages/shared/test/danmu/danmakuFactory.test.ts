import { join } from "node:path";
import { expect, describe, it, beforeEach, afterEach } from "vitest";

import { DanmakuFactory, getFontSize } from "../../src/danmu/danmakuFactory";

describe.concurrent("genDanmuArgs", () => {
  let danmu: DanmakuFactory;

  beforeEach(() => {
    danmu = new DanmakuFactory("path/to/executable");
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
  it("弹幕参数：弹幕字体大小自适应", () => {
    const expectedArgs = ["--resolution 1920x1080", "--fontsize 40"];
    const config = {
      resolution: [1920, 1080],
      fontSizeResponsive: true,
      fontSizeResponsiveParams: [[1080, 40]],
      fontsize: 45,
    };

    // @ts-ignore
    const params = danmu.genDanmuArgs(config);
    expect(params).toEqual(expectedArgs);
  });

  // it("should convert XML to ASS", async () => {
  //   const input = join(__dirname, "index.test.ts");
  //   const output = "path/to/output.ass";
  //   const argsObj = {
  //     resolution: [1920, 1080],
  //     msgboxsize: [400, 200],
  //     msgboxpos: [100, 100],
  //     blockmode: ["R2L", "L2R"],
  //     statmode: ["TABLE", "HISTOGRAM"],
  //     fontname: "Arial",
  //     blacklist: "",
  //     density: 0,
  //     customDensity: 50,
  //   };

  //   const expectedCommand = `"path/to/executable" -i "${input}" -o "path/to/output.ass" --ignore-warnings --resolution 1920x1080 --msgboxsize 400x200 --msgboxpos 100x100 --blockmode R2L-L2R --statmode TABLE-HISTOGRAM --fontname "Arial" --density 0`;

  //   try {
  //     // @ts-ignore
  //     await danmu.convertXml2Ass(input, output, argsObj);
  //     expect(danmu.command).toEqual(expectedCommand);
  //   } catch (error) {
  //     expect(danmu.command).toEqual(expectedCommand);
  //   }
  // });
});

describe.concurrent("getFontSize", () => {
  it("should return the correct font size for a height within the range", () => {
    const heightMap: [number, number][] = [
      [1080, 40],
      [1660, 50],
    ];
    const currentHeight = 1440;
    const expectedSize = 47;
    const size = getFontSize(heightMap, currentHeight);
    expect(size).toBe(expectedSize);
  });

  it("should return the correct font size for a height below the minimum range", () => {
    const heightMap: [number, number][] = [
      [100, 10],
      [200, 20],
      [300, 30],
    ];
    const currentHeight = 50;
    const expectedSize = 9;
    const size = getFontSize(heightMap, currentHeight);
    expect(size).toBe(expectedSize);
  });

  it("should return the correct font size for a height above the maximum range", () => {
    const heightMap: [number, number][] = [
      [1080, 40],
      [1660, 50],
      [1920, 60],
    ];
    const currentHeight = 2440;
    const expectedSize = 76;
    const size = getFontSize(heightMap, currentHeight);
    expect(size).toBe(expectedSize);
  });

  it("should return the correct font size for a height exactly at a known point", () => {
    const heightMap: [number, number][] = [
      [100, 10],
      [200, 20],
      [300, 30],
    ];
    const currentHeight = 200;
    const expectedSize = 20;
    const size = getFontSize(heightMap, currentHeight);
    expect(size).toBe(expectedSize);
  });

  it("should handle a height map with only one point", () => {
    const heightMap: [number, number][] = [[100, 10]];
    const currentHeight = 150;
    const expectedSize = 12;
    const size = getFontSize(heightMap, currentHeight);
    expect(size).toBe(expectedSize);
  });

  it("should handle a height map with no points", () => {
    const heightMap: [number, number][] = [];
    const currentHeight = 150;

    expect(() => getFontSize(heightMap, currentHeight)).toThrow("heightMap is empty");
  });
});
