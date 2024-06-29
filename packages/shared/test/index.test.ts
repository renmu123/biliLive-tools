import { expect, describe, it, beforeEach, afterEach } from "vitest";
import { genFfmpegParams } from "../src/utils/index";
import { filterBlacklist } from "../src/task/danmu";
import { Danmu } from "../src/danmu/index";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const __dirname = dirname(fileURLToPath(import.meta.url));
describe.concurrent("屏蔽词过滤", () => {
  it("有屏蔽词", () => {
    const input = `<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet type="text/xsl" href="#s"?>
<i>
  <d p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</d>
  <d p="0.050,1,25,16777215,1705759424593,0,401378687,0" user="呵呵君在线">主播 封面的女孩子是谁你妹妹吗 能不能换</d>
</i>`;
    const blacklist = ["主播"];
    const output = filterBlacklist(input, blacklist);
    console.log(output);
    expect(output).toEqual(`<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet type="text/xsl" href="#s"?>
<i>
  <d p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</d>
</i>
`);
  });
  it("无屏蔽词", () => {
    const input = `<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet type="text/xsl" href="#s"?>
<i>
  <d p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</d>
  <d p="0.050,1,25,16777215,1705759424593,0,401378687,0" user="呵呵君在线">主播 封面的女孩子是谁你妹妹吗 能不能换</d>
</i>`;
    const blacklist = [];
    const output = filterBlacklist(input, blacklist);
    console.log(output);
    expect(output).toEqual(`<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet type="text/xsl" href="#s"?>
<i>
  <d p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</d>
  <d p="0.050,1,25,16777215,1705759424593,0,401378687,0" user="呵呵君在线">主播 封面的女孩子是谁你妹妹吗 能不能换</d>
</i>
`);
  });
  it("未中屏蔽词", () => {
    const input = `<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet type="text/xsl" href="#s"?>
<i>
  <d p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</d>
  <d p="0.050,1,25,16777215,1705759424593,0,401378687,0" user="呵呵君在线">主播 封面的女孩子是谁你妹妹吗 能不能换</d>
</i>`;
    const blacklist = ["主播1"];
    const output = filterBlacklist(input, blacklist);
    console.log(output);
    expect(output).toEqual(`<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet type="text/xsl" href="#s"?>
<i>
  <d p="0.050,1,25,16777215,1705759424480,0,649778941,0" user="邻桌同学">黎明杀机</d>
  <d p="0.050,1,25,16777215,1705759424593,0,401378687,0" user="呵呵君在线">主播 封面的女孩子是谁你妹妹吗 能不能换</d>
</i>
`);
  });
});

describe.concurrent("ffmpeg参数生成", () => {
  it("视频编码器：h264_nvenc", () => {
    const input = {
      encoder: "h264_nvenc",
      bitrateControl: "CQ",
      crf: 34,
      preset: "p4",
      audioCodec: "copy",
      bitrate: 8000,
      decode: true,
      extraOptions: "",
      bit10: false,
      resetResolution: false,
      resolutionWidth: 3840,
      resolutionHeight: 2160,
    };
    // @ts-ignore
    const output1 = genFfmpegParams(input);
    expect(output1).toEqual(["-c:v h264_nvenc", "-rc vbr", "-cq 34", "-preset p4", "-c:a copy"]);
  });
  it("额外参数", () => {
    const input = {
      encoder: "h264_nvenc",
      bitrateControl: "CQ",
      crf: 34,
      preset: "p4",
      audioCodec: "copy",
      bitrate: 8000,
      decode: true,
      extraOptions: "-ss 00:00:00",
      bit10: false,
      resetResolution: false,
      resolutionWidth: 3840,
      resolutionHeight: 2160,
    };
    // @ts-ignore
    const output1 = genFfmpegParams(input);
    expect(output1).toEqual([
      "-c:v h264_nvenc",
      "-rc vbr",
      "-cq 34",
      "-preset p4",
      "-c:a copy",
      "-ss",
      "00:00:00",
    ]);
  });
  it("视频和音频编码器都是copy", () => {
    const input = {
      encoder: "copy",
      bitrateControl: "CRF",
      crf: 28,
      preset: "p4",
      audioCodec: "copy",
      bitrate: 8000,
      decode: false,
      extraOptions: "",
      bit10: false,
      resetResolution: false,
      resolutionWidth: 3840,
      resolutionHeight: 2160,
    };
    // @ts-ignore
    const output1 = genFfmpegParams(input);
    expect(output1).toEqual(["-c:v copy", "-c:a copy"]);
  });
  it("音频编码器是flac", () => {
    const input = {
      encoder: "copy",
      bitrateControl: "CRF",
      crf: 28,
      preset: "p4",
      audioCodec: "flac",
      bitrate: 8000,
      decode: false,
      extraOptions: "",
      bit10: false,
      resetResolution: false,
      resolutionWidth: 3840,
      resolutionHeight: 2160,
    };
    // @ts-ignore
    const output1 = genFfmpegParams(input);
    expect(output1).toEqual(["-c:v copy", "-c:a flac"]);
  });
  it("视频编码器是libsvtav1且开通10bit", () => {
    const input = {
      encoder: "libsvtav1",
      bitrateControl: "CRF",
      crf: 28,
      preset: "p4",
      audioCodec: "flac",
      bitrate: 8000,
      decode: false,
      extraOptions: "",
      bit10: true,
      resetResolution: false,
      resolutionWidth: 3840,
      resolutionHeight: 2160,
    };
    // @ts-ignore
    const output1 = genFfmpegParams(input);
    expect(output1).toEqual([
      "-c:v libsvtav1",
      "-crf 28",
      "-preset p4",
      "-pix_fmt yuv420p10le",
      "-c:a flac",
    ]);
  });
  it("视频编码器是libsvtav1且是CRF模式", () => {
    const input = {
      encoder: "libsvtav1",
      bitrateControl: "CRF",
      crf: 28,
      preset: "p4",
      audioCodec: "flac",
      bitrate: 8000,
      decode: false,
      extraOptions: "",
      bit10: true,
      resetResolution: false,
      resolutionWidth: 3840,
      resolutionHeight: 2160,
    };
    // @ts-ignore
    const output1 = genFfmpegParams(input);
    expect(output1).toEqual([
      "-c:v libsvtav1",
      "-crf 28",
      "-preset p4",
      "-pix_fmt yuv420p10le",
      "-c:a flac",
    ]);
  });
  it("视频编码器是libsvtav1且是VBR模式", () => {
    const input = {
      encoder: "libsvtav1",
      bitrateControl: "VBR",
      crf: 28,
      preset: "p4",
      audioCodec: "flac",
      bitrate: 8000,
      decode: false,
      extraOptions: "",
      bit10: true,
      resetResolution: false,
      resolutionWidth: 3840,
      resolutionHeight: 2160,
    };
    // @ts-ignore
    const output1 = genFfmpegParams(input);
    expect(output1).toEqual([
      "-c:v libsvtav1",
      "-b:v 8000k",
      "-preset p4",
      "-pix_fmt yuv420p10le",
      "-c:a flac",
    ]);
  });
  it("视频编码器是h264_nvenc且是CQ模式", () => {
    const input = {
      encoder: "h264_nvenc",
      bitrateControl: "CQ",
      crf: 28,
      preset: "p4",
      audioCodec: "flac",
      bitrate: 8000,
      decode: false,
      extraOptions: "",
      bit10: true,
      resetResolution: false,
      resolutionWidth: 3840,
      resolutionHeight: 2160,
    };
    // @ts-ignore
    const output1 = genFfmpegParams(input);
    expect(output1).toEqual(["-c:v h264_nvenc", "-rc vbr", "-cq 28", "-preset p4", "-c:a flac"]);
  });
  it("视频编码器是h264_qsv且是ICQ模式", () => {
    const input = {
      encoder: "h264_qsv",
      bitrateControl: "ICQ",
      crf: 28,
      preset: "p4",
      audioCodec: "flac",
      bitrate: 8000,
      decode: false,
      extraOptions: "",
      bit10: true,
      resetResolution: false,
      resolutionWidth: 3840,
      resolutionHeight: 2160,
    };
    // @ts-ignore
    const output1 = genFfmpegParams(input);
    expect(output1).toEqual(["-c:v h264_qsv", "-global_quality 28", "-preset p4", "-c:a flac"]);
  });
  it("设置分辨率", () => {
    const input = {
      encoder: "h264_qsv",
      bitrateControl: "ICQ",
      crf: 28,
      preset: "p4",
      audioCodec: "flac",
      bitrate: 8000,
      decode: false,
      extraOptions: "",
      bit10: true,
      resetResolution: true,
      resolutionWidth: 3840,
      resolutionHeight: 2160,
    };
    // @ts-ignore
    const output1 = genFfmpegParams(input);
    expect(output1).toEqual([
      "-c:v h264_qsv",
      "-global_quality 28",
      "-preset p4",
      "-s 3840x2160",
      "-c:a flac",
    ]);
  });
});

describe.concurrent("弹幕参数", () => {
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
