import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { Stream } from "openai/streaming";

export interface QwenConfig {
  /**
   * API Key，格式：sk-xxx
   */
  apiKey: string;
  /**
   * 模型名称，默认 qwen-plus
   * 支持的模型：qwen-turbo, qwen-plus, qwen-max, qwen-max-longcontext 等
   * 完整列表：https://help.aliyun.com/zh/model-studio/getting-started/models
   */
  model?: string;
  /**
   * 基础 URL，默认为阿里云的 OpenAI 兼容端点
   */
  baseURL?: string;
  /**
   * 请求超时时间（毫秒）
   */
  timeout?: number;
}

export interface ChatOptions {
  /**
   * 采样温度，控制生成文本的多样性
   * 取值范围：[0, 2)
   * 默认值：0.7
   */
  temperature?: number;
  /**
   * 核采样概率阈值
   * 取值范围：(0, 1.0]
   */
  topP?: number;
  /**
   * 最大输出 token 数
   */
  maxTokens?: number;
  /**
   * 是否流式输出
   */
  stream?: boolean;
  /**
   * 停止词
   */
  stop?: string | string[];
  /**
   * 控制模型生成文本时的内容重复度
   * 取值范围：[-2.0, 2.0]
   */
  presencePenalty?: number;
  /**
   * 是否开启联网搜索
   */
  enableSearch?: boolean;

  searchOptions?: {
    /**
     * 是否强制联网搜索
     */
    forcedSearch?: boolean;
    search_strategy?: "turbo" | "max";
    intention_options?: {
      prompt_intervene: string;
    };
  };
  responseFormat?: { type: "json_object" } | any;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  content: string;
  usage: OpenAI.CompletionUsage | undefined;
  finishReason: "stop" | "length" | "tool_calls" | "content_filter" | "function_call";
}

export class QwenLLM {
  private client: OpenAI;
  private model: string;

  constructor(config: QwenConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL || "https://dashscope.aliyuncs.com/compatible-mode/v1",
      timeout: config.timeout || 60000,
    });
    this.model = config.model || "qwen-plus";
  }

  /**
   * 发送聊天请求（非流式）
   */
  async chat(messages: ChatMessage[], options?: Omit<ChatOptions, "stream">): Promise<ChatResponse>;
  /**
   * 发送聊天请求（流式）
   */
  async chat(
    messages: ChatMessage[],
    options: ChatOptions & { stream: true },
  ): Promise<Stream<OpenAI.Chat.Completions.ChatCompletionChunk>>;
  /**
   * 发送聊天请求
   */
  async chat(
    messages: ChatMessage[],
    options: ChatOptions = {},
  ): Promise<ChatResponse | Stream<OpenAI.Chat.Completions.ChatCompletionChunk>> {
    const params = {
      model: this.model,
      messages: messages as ChatCompletionMessageParam[],
      temperature: options.temperature ?? 0.7,
      top_p: options.topP,
      max_tokens: options.maxTokens,
      stop: options.stop,
      presence_penalty: options.presencePenalty,
      response_format: options.responseFormat,
      // 阿里云特有参数
      ...(options.enableSearch !== undefined && {
        enable_search: options.enableSearch,
      }),
      ...(options.searchOptions !== undefined && {
        search_options: options.searchOptions,
      }),
    };

    if (options.stream) {
      return this.client.chat.completions.create({
        ...params,
        stream: true,
      }) as unknown as Stream<OpenAI.Chat.Completions.ChatCompletionChunk>;
    } else {
      const completion = await this.client.chat.completions.create({
        ...params,
        stream: false,
      });
      return {
        content: completion.choices[0].message.content || "",
        usage: completion.usage,
        finishReason: completion.choices[0].finish_reason,
      };
    }
  }

  /**
   * 便捷方法：发送单条消息
   */
  async sendMessage(
    content: string,
    systemPrompt?: string,
    options?: Omit<ChatOptions, "stream">,
  ): Promise<ChatResponse>;
  async sendMessage(
    content: string,
    systemPrompt: string | undefined,
    options: ChatOptions & { stream: true },
  ): Promise<Stream<OpenAI.Chat.Completions.ChatCompletionChunk>>;
  async sendMessage(
    content: string,
    systemPrompt?: string,
    options: ChatOptions = {},
  ): Promise<ChatResponse | Stream<OpenAI.Chat.Completions.ChatCompletionChunk>> {
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }

    messages.push({ role: "user", content });

    return this.chat(messages, options as any);
  }

  /**
   * 便捷方法：文本续写
   */
  async complete(prompt: string, options: ChatOptions = {}): Promise<ChatResponse> {
    const messages: ChatMessage[] = [{ role: "user", content: prompt }];
    const result = await this.chat(messages, options);
    return result as ChatResponse;
  }
}
