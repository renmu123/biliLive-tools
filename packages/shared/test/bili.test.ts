import { expect, describe, it } from "vitest";
import { parseDesc } from "../src/task/bili";

describe.concurrent("parseDesc", () => {
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
