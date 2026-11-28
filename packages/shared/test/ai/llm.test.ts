import http from "node:http";
import { once } from "node:events";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { QwenLLM } from "../../src/ai/llm/qwen.js";

import type { AddressInfo } from "node:net";

const content = '{"name":"歌曲","lyrics":"歌词"}';
const requests: Record<string, any>[] = [];
const server = http.createServer(async (request, response) => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = JSON.parse(Buffer.concat(chunks).toString());
  requests.push(body);

  if (body.stream) {
    response.writeHead(200, { "Content-Type": "text/event-stream" });
    response.end(
      `data: ${JSON.stringify({
        choices: [{ index: 0, delta: { content }, finish_reason: "stop" }],
      })}\n\ndata: [DONE]\n\n`,
    );
  } else {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        choices: [{ message: { role: "assistant", content }, finish_reason: "stop" }],
      }),
    );
  }
});

let baseURL: string;
beforeAll(async () => {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseURL = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`;
});

beforeEach(() => {
  requests.length = 0;
});

afterAll(async () => {
  const closed = once(server, "close");
  server.close();
  server.closeAllConnections();
  await closed;
});

function createLLM(model: string) {
  return new QwenLLM({ apiKey: "test-key", baseURL, model });
}

describe("LLM 搜索请求兼容性", () => {
  it("DeepSeek 开启搜索时声明服务端工具，移除不兼容的参数", async () => {
    const result = await createLLM("DeepSeek-Flash").sendMessage("识别歌曲", "输出 JSON", {
      enableSearch: true,
      enableThinking: false,
      responseFormat: { type: "json_object" },
      searchOptions: { forcedSearch: true, search_strategy: "max" },
    });

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      messages: [
        { role: "system", content: "输出 JSON" },
        { role: "user", content: "识别歌曲" },
      ],
      tools: [{ type: "deepseek_web_search" }],
      thinking: { type: "disabled" },
      stream: false,
    });
    for (const key of [
      "enable_search",
      "search_options",
      "enable_thinking",
      "response_format",
      "tool_choice",
      "reasoning_effort",
    ]) {
      expect(requests[0]).not.toHaveProperty(key);
    }
    expect(result.content).toBe(content);
  });

  it.each([false, undefined])("DeepSeek 搜索开关为 %s 时保留 JSON 模式", async (enableSearch) => {
    await createLLM("deepseek-flash").sendMessage("识别歌曲", undefined, {
      enableSearch,
      responseFormat: { type: "json_object" },
      searchOptions: { forcedSearch: true },
    });

    expect(requests[0]).toHaveProperty("response_format", { type: "json_object" });
    for (const key of ["tools", "thinking", "enable_search", "search_options"]) {
      expect(requests[0]).not.toHaveProperty(key);
    }
  });

  it("DeepSeek 思考模式使用对应的参数", async () => {
    await createLLM("deepseek-flash").sendMessage("识别歌曲", undefined, {
      enableSearch: true,
      enableThinking: true,
    });

    expect(requests[0]).toHaveProperty("thinking", { type: "enabled" });
    expect(requests[0]).toHaveProperty("reasoning_effort", "low");
    expect(requests[0]).toHaveProperty("tools", [{ type: "deepseek_web_search" }]);
  });

  it("DeepSeek 歌词优化可同时使用低强度思考和 JSON 模式", async () => {
    await createLLM("deepseek-flash").sendMessage("优化歌词", undefined, {
      enableSearch: false,
      enableThinking: true,
      responseFormat: { type: "json_object" },
    });

    expect(requests[0]).toMatchObject({
      thinking: { type: "enabled" },
      reasoning_effort: "low",
      response_format: { type: "json_object" },
    });
    expect(requests[0]).not.toHaveProperty("tools");
  });

  it.each(["low", "high", "max"] as const)(
    "DeepSeek 可指定思考强度 %s",
    async (reasoningEffort) => {
      await createLLM("deepseek-flash").sendMessage("优化歌词", undefined, {
        enableThinking: true,
        reasoningEffort,
      });

      expect(requests[0]).toHaveProperty("reasoning_effort", reasoningEffort);
    },
  );

  it("DeepSeek 关闭思考时不发送思考强度", async () => {
    await createLLM("deepseek-flash").sendMessage("识别歌曲", undefined, {
      enableThinking: false,
      reasoningEffort: "high",
    });

    expect(requests[0]).toHaveProperty("thinking", { type: "disabled" });
    expect(requests[0]).not.toHaveProperty("reasoning_effort");
  });

  it("DeepSeek 搜索支持流式正文", async () => {
    const stream = await createLLM("deepseek-flash").sendMessage("识别歌曲", undefined, {
      enableSearch: true,
      responseFormat: { type: "json_object" },
      stream: true,
    });
    let text = "";
    for await (const chunk of stream) text += chunk.choices[0]?.delta.content || "";

    expect(text).toBe(content);
    expect(requests[0]).toHaveProperty("stream", true);
    expect(requests[0]).toHaveProperty("tools", [{ type: "deepseek_web_search" }]);
    expect(requests[0]).not.toHaveProperty("response_format");
  });

  it.each(["qwen-plus", "other-model"])("%s 保留原有参数", async (model) => {
    const responseFormat = {
      type: "json_schema",
      json_schema: { name: "song", strict: true, schema: { type: "object" } },
    };
    await createLLM(model).sendMessage("识别歌曲", undefined, {
      enableSearch: true,
      enableThinking: false,
      reasoningEffort: "low",
      searchOptions: { forcedSearch: true, search_strategy: "max" },
      responseFormat,
    });

    expect(requests[0]).toMatchObject({
      enable_search: true,
      enable_thinking: false,
      search_options: { forcedSearch: true, search_strategy: "max" },
      response_format: responseFormat,
    });
    expect(requests[0]).not.toHaveProperty("tools");
    expect(requests[0]).not.toHaveProperty("thinking");
    expect(requests[0]).not.toHaveProperty("reasoning_effort");
  });
});
