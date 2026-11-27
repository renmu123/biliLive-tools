import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getConfig: vi.fn(),
  getAllConfig: vi.fn(),
  recognize: vi.fn(),
  shazamRecognize: vi.fn(),
  sendMessage: vi.fn(),
}));

vi.mock("../../src/config.js", () => ({
  appConfig: { get: mocks.getConfig, getAll: mocks.getAllConfig },
}));
vi.mock("../../src/ai/index.js", () => ({
  recognize: mocks.recognize,
  QwenLLM: class {
    sendMessage = mocks.sendMessage;
  },
}));
vi.mock("../../src/musicDetector/shazam.js", () => ({ recognize: mocks.shazamRecognize }));
vi.mock("../../src/task/video.js", () => ({ addExtractAudioTask: vi.fn() }));
vi.mock("../../src/utils/index.js", () => ({
  getTempPath: vi.fn(),
  uuid: vi.fn(),
  calculateFileQuickHash: vi.fn(),
}));
vi.mock("../../src/utils/log.js", () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("music-segment-detector", () => ({
  analyzeAudio: vi.fn(),
  detectMusicSegments: vi.fn(),
}));

import { songRecognize } from "../../src/musicDetector/index.js";

function createAIConfig() {
  return {
    vendors: [{ id: "vendor", apiKey: "test-key", provider: "aliyun" }],
    models: [{ modelId: "llm", modelName: "qwen-plus", vendorId: "vendor" }],
    songRecognizeAsr: { modelId: "asr" },
    songRecognizeLlm: {
      modelId: "llm",
      prompt: "识别歌名和完整歌词，输出 JSON",
      enableStructuredOutput: true,
      enableSearch: true,
      maxInputLength: 300,
      // 旧配置不应影响每次请求选择的模式。
      lyricOptimize: false,
    },
    songLyricOptimize: { modelId: "", prompt: "优化歌词，输出 JSON" },
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  const ai = createAIConfig();
  mocks.getConfig.mockReturnValue(ai);
  mocks.getAllConfig.mockReturnValue({ ai });
  mocks.shazamRecognize.mockResolvedValue(null);
  mocks.recognize.mockResolvedValue({
    text: "原始歌词",
    segments: [{ id: 0, start: 1, end: 3, text: "原始歌词" }],
  });
});

describe("歌曲识别模式", () => {
  it("默认仅识别歌名，Shazam 成功时不读取 AI 配置", async () => {
    mocks.shazamRecognize.mockResolvedValue({ name: "Shazam 歌曲", lyrics: null });
    mocks.getAllConfig.mockImplementation(() => {
      throw new Error("未配置 AI");
    });

    expect(await songRecognize("audio.mp3")).toEqual({ name: "Shazam 歌曲" });
    expect(mocks.shazamRecognize).toHaveBeenCalledWith("audio.mp3", false);
    expect(mocks.getAllConfig).not.toHaveBeenCalled();
    expect(mocks.recognize).not.toHaveBeenCalled();
    expect(mocks.sendMessage).not.toHaveBeenCalled();
  });

  it.each(["无结果", "抛出异常"])("Shazam %s 后使用 ASR 和 LLM 识别歌名", async (failure) => {
    if (failure === "抛出异常") mocks.shazamRecognize.mockRejectedValue(new Error("请求失败"));
    mocks.sendMessage.mockResolvedValue({ content: '{"name":"LLM 歌曲","lyrics":"不需要的歌词"}' });

    expect(await songRecognize("audio.mp3", 30, "name")).toEqual({ name: "LLM 歌曲" });
    expect(mocks.recognize).toHaveBeenCalledWith("audio.mp3", "asr");
    expect(mocks.sendMessage).toHaveBeenCalledTimes(1);
    const [text, prompt, options] = mocks.sendMessage.mock.calls[0];
    expect(text).toBe("原始歌词");
    expect(prompt).toContain("仅识别歌曲名称");
    expect(options.responseFormat.json_schema.schema).toMatchObject({
      properties: { name: { type: "string" } },
      required: ["name"],
    });
    expect(options.responseFormat.json_schema.schema.properties).not.toHaveProperty("lyrics");
  });

  it("歌名和歌词模式跳过 Shazam，执行 ASR、LLM 识别及歌词优化", async () => {
    mocks.sendMessage
      .mockResolvedValueOnce({ content: '{"name":"LLM 歌曲","lyrics":"标准歌词"}' })
      .mockResolvedValueOnce({ content: '{"data":[{"st":1000,"et":3000,"t":"优化歌词"}]}' });

    const result = await songRecognize("audio.mp3", 30, "lyrics");

    expect(result?.name).toBe("LLM 歌曲");
    expect(result?.lyrics).toContain("00:00:31,000 --> 00:00:33,000");
    expect(result?.lyrics).toContain("优化歌词");
    expect(mocks.shazamRecognize).not.toHaveBeenCalled();
    expect(mocks.recognize).toHaveBeenCalledOnce();
    expect(mocks.sendMessage).toHaveBeenCalledTimes(2);
    expect(mocks.sendMessage.mock.calls[0][2].responseFormat.json_schema.schema.required).toEqual([
      "name",
      "lyrics",
    ]);
    expect(mocks.sendMessage.mock.calls[1][0]).toContain("Standard_Lyrics：标准歌词");
    expect(mocks.sendMessage.mock.calls[1][1]).toBe("优化歌词，输出 JSON");
  });

  it("歌词优化失败时保留 ASR 字幕及片段时间偏移", async () => {
    mocks.sendMessage
      .mockResolvedValueOnce({ content: '{"name":"LLM 歌曲","lyrics":"标准歌词"}' })
      .mockRejectedValueOnce(new Error("优化失败"));

    const result = await songRecognize("audio.mp3", 30, "lyrics");

    expect(result?.lyrics).toContain("原始歌词");
    expect(result?.lyrics).toContain("00:00:31,000 --> 00:00:33,000");
    expect(mocks.shazamRecognize).not.toHaveBeenCalled();
  });

  it.each(["name", "lyrics"] as const)("%s 模式无 ASR 文本时不调用 LLM", async (mode) => {
    mocks.recognize.mockResolvedValue({ text: "", segments: [] });

    expect(await songRecognize("audio.mp3", 0, mode)).toBeUndefined();
    expect(mocks.sendMessage).not.toHaveBeenCalled();
  });

  it.each(["非 JSON", '{"name":""}'])("LLM 结果无有效歌名时不生成歌词：%s", async (content) => {
    mocks.sendMessage.mockResolvedValue({ content });

    expect(await songRecognize("audio.mp3", 0, "lyrics")).toBeUndefined();
    expect(mocks.sendMessage).toHaveBeenCalledOnce();
  });
});
