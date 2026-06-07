import axios, { AxiosInstance } from "axios";

export interface FeishuDocConfig {
  appId: string;
  appSecret: string;
  documentId: string;
}

interface FeishuResponse<T = unknown> {
  code: number;
  msg: string;
  data?: T;
  tenant_access_token?: string;
  expire?: number;
}

type FeishuBlock = {
  block_type: number;
  [key: string]: unknown;
};

const FEISHU_BASE_URL = "https://open.feishu.cn/open-apis";

function textElements(content: string) {
  return [
    {
      text_run: {
        content,
      },
    },
  ];
}

function textBlock(type: number, field: string, content: string): FeishuBlock {
  return {
    block_type: type,
    [field]: {
      elements: textElements(content),
    },
  };
}

function stripMarkdownInline(text: string) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function markdownLineToBlock(line: string): FeishuBlock | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (/^---+$/.test(trimmed)) {
    return { block_type: 22, divider: {} };
  }

  const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
  if (heading) {
    const level = Math.min(heading[1].length, 6);
    return textBlock(2 + level, `heading${level}`, stripMarkdownInline(heading[2]));
  }

  const bullet = trimmed.match(/^[-*+]\s+(.+)$/);
  if (bullet) {
    return textBlock(12, "bullet", stripMarkdownInline(bullet[1]));
  }

  const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);
  if (ordered) {
    return textBlock(13, "ordered", stripMarkdownInline(ordered[1]));
  }

  return textBlock(2, "text", stripMarkdownInline(trimmed));
}

export function markdownToFeishuBlocks(markdown: string): FeishuBlock[] {
  const blocks: FeishuBlock[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(textBlock(2, "text", stripMarkdownInline(paragraph.join("\n"))));
    paragraph = [];
  };

  for (const line of markdown.split(/\r?\n/)) {
    const block = markdownLineToBlock(line);
    if (!block) {
      flushParagraph();
      continue;
    }

    if (block.block_type === 2 && typeof block.text === "object") {
      paragraph.push(line.trim());
      continue;
    }

    flushParagraph();
    blocks.push(block);
  }
  flushParagraph();

  return blocks;
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export class FeishuDocClient {
  private client: AxiosInstance;
  private token?: string;
  private tokenExpireAt = 0;

  constructor(private config: FeishuDocConfig) {
    this.client = axios.create({
      baseURL: FEISHU_BASE_URL,
      timeout: 30000,
    });
  }

  private async request<T>(method: "get" | "post", url: string, data?: unknown) {
    const token = await this.getTenantAccessToken();
    const response = await this.client.request<FeishuResponse<T>>({
      method,
      url,
      data,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
    });

    if (response.data.code !== 0) {
      throw new Error(`飞书 API 调用失败：${response.data.msg || response.data.code}`);
    }
    return response.data.data as T;
  }

  private async getTenantAccessToken() {
    if (this.token && Date.now() < this.tokenExpireAt) {
      return this.token;
    }

    const response = await this.client.post<FeishuResponse>("/auth/v3/tenant_access_token/internal", {
      app_id: this.config.appId,
      app_secret: this.config.appSecret,
    });

    if (response.data.code !== 0 || !response.data.tenant_access_token) {
      throw new Error(`获取飞书 tenant_access_token 失败：${response.data.msg || response.data.code}`);
    }

    this.token = response.data.tenant_access_token;
    this.tokenExpireAt = Date.now() + Math.max((response.data.expire || 7200) - 300, 60) * 1000;
    return this.token;
  }

  async appendMarkdown(markdown: string) {
    const blocks = markdownToFeishuBlocks(markdown);
    if (!blocks.length) return;

    for (const children of chunkArray(blocks, 40)) {
      await this.request(
        "post",
        `/docx/v1/documents/${this.config.documentId}/blocks/${this.config.documentId}/children`,
        {
          children,
          index: -1,
        },
      );
    }
  }
}

export function extractFeishuDocumentId(input: string) {
  const value = input.trim();
  if (!value) return "";

  const match = value.match(/\/docx\/([^/?#]+)/);
  if (match?.[1]) return match[1];
  return value;
}
