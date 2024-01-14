import { expect, describe, it } from "vitest";

interface DescV2 {
  raw_text: string;
  type: 1 | 2; // 1 for regular text, 2 for content inside square brackets
  biz_id: string;
}
/**
 * 解析desc
 */
export function parseDesc(input: string): DescV2[] {
  const tokens: DescV2[] = [];

  const regex = /\[([^\]]*)\]<([^>]*)>/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(input)) !== null) {
    const precedingText = input.substring(lastIndex, match.index);
    if (precedingText) {
      tokens.push({ raw_text: precedingText, type: 1, biz_id: "" });
    }

    const innerText = match[1];
    const biz_id = match[2];
    tokens.push({ raw_text: innerText, type: 2, biz_id });

    lastIndex = regex.lastIndex;
  }

  const trailingText = input.substring(lastIndex);
  if (trailingText) {
    tokens.push({ raw_text: trailingText, type: 1, biz_id: "" });
  }

  return tokens;
}

describe("parseDesc", () => {
  it("should parse description with valid tokens", () => {
    const input = "Hello [World]<123>! This is a [test]<456>.";
    const expected = [
      { raw_text: "Hello ", type: 1, biz_id: "" },
      { raw_text: "World", type: 2, biz_id: "123" },
      { raw_text: "! This is a ", type: 1, biz_id: "" },
      { raw_text: "test", type: 2, biz_id: "456" },
      { raw_text: ".", type: 1, biz_id: "" },
    ];

    const result = parseDesc(input);

    expect(result).toEqual(expected);
  });
  it("普通测试", () => {
    const input = "大家好，我是[暮色312]<10995238>\n，你是[皮皮]<3333>十[]是<>";
    const expected = [
      { raw_text: "大家好，我是", type: 1, biz_id: "" },
      { raw_text: "暮色312", type: 2, biz_id: "10995238" },
      { raw_text: "\n，你是", type: 1, biz_id: "" },
      { raw_text: "皮皮", type: 2, biz_id: "3333" },
      { raw_text: "十[]是<>", type: 1, biz_id: "" },
    ];

    const result = parseDesc(input);

    expect(result).toEqual(expected);
  });

  it("should handle empty input", () => {
    const input = "";
    const expected = [];

    const result = parseDesc(input);

    expect(result).toEqual(expected);
  });

  // Add more test cases as needed
});
