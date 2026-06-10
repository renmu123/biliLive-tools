import { describe, expect, it, vi } from "vitest";

import { createASRProvider } from "../../src/ai/asr/adapter.js";
import { appConfig } from "../../src/config.js";

describe("ASR provider config", () => {
  it("creates an OpenRouter ASR provider from an openai-compatible vendor", () => {
    const aiConfig = {
      vendors: [
        {
          id: "openrouter",
          name: "OpenRouter",
          provider: "openai-compatible",
          apiKey: "test-key",
          baseURL: "https://openrouter.ai/api/v1",
        },
      ],
      models: [
        {
          vendorId: "openrouter",
          modelId: "openrouter-whisper",
          modelName: "openai/whisper-1",
          tags: ["asr"],
          config: {},
        },
      ],
    };

    vi.spyOn(appConfig, "get").mockReturnValue(aiConfig);
    vi.spyOn(appConfig, "getAll").mockReturnValue({ ai: aiConfig } as any);

    expect(() => createASRProvider("openrouter-whisper")).not.toThrow();
  });
});
