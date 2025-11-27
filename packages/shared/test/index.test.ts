import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, describe, it } from "vitest";
import { getHardwareAcceleration, replaceFourByteUnicode, escaped } from "../src/utils/index";
import { parseXmlObj } from "../src/danmu/index";

export const __dirname = dirname(fileURLToPath(import.meta.url));

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

  describe("replaceFourByteUnicode", () => {
    it("should replace four-byte Unicode characters with default replacement", () => {
      const input = "Hello 👋 World 🌍";
      const output = replaceFourByteUnicode(input);
      expect(output).toEqual("Hello _ World _");
    });

    it("should replace three-byte Unicode characters", () => {
      const input = "Test ☹ emojis";
      const output = replaceFourByteUnicode(input, "X");
      expect(output).toEqual(input);
    });

    it("should handle strings without four-byte Unicode characters", () => {
      const input = "Regular ASCII text";
      const output = replaceFourByteUnicode(input);
      expect(output).toEqual("Regular ASCII text");
    });

    it("should handle empty string", () => {
      const input = "";
      const output = replaceFourByteUnicode(input);
      expect(output).toEqual("");
    });

    it("should handle multiple consecutive four-byte Unicode characters", () => {
      const input = "🎉🎊🥳";
      const output = replaceFourByteUnicode(input, "-");
      expect(output).toEqual("---");
    });

    it("should preserve three-byte Unicode characters", () => {
      const input = "测试中文字符";
      const output = replaceFourByteUnicode(input);
      expect(output).toEqual("测试中文字符");
    });

    it("should handle mixed content with both regular text and emojis", () => {
      const input = "User说: 这个很棒 👍 非常好 🎯!";
      const output = replaceFourByteUnicode(input, "[emoji]");
      expect(output).toEqual("User说: 这个很棒 [emoji] 非常好 [emoji]!");
    });
  });
});
