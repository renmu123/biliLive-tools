import { describe, expect, it } from "vitest";

import { resolveOpenAICompatibleBaseURL } from "../../src/ai/llm/index.js";

describe("OpenAI-compatible LLM config", () => {
  it("resolves provider-specific base URLs", () => {
    expect(resolveOpenAICompatibleBaseURL({ provider: "aliyun" })).toBe(
      "https://dashscope.aliyuncs.com/compatible-mode/v1",
    );
    expect(resolveOpenAICompatibleBaseURL({ provider: "openai" })).toBeUndefined();
    expect(
      resolveOpenAICompatibleBaseURL({
        provider: "openai-compatible",
        baseURL: "https://example.com/v1",
      }),
    ).toBe("https://example.com/v1");
  });
});
