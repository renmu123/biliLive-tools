import axios, { AxiosInstance } from "axios";

import { chunkArray, parseMarkdownBlocks, type MarkdownBlock } from "./markdown.js";

export interface FeishuDocConfig {
  appId: string;
  appSecret: string;
  documentId?: string;
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

type FeishuCreatedDocument = {
  document?: {
    document_id?: string;
  };
};

const FEISHU_BASE_URL = "https://open.feishu.cn/open-apis";

function formatFeishuResponseError(data: unknown, status?: number) {
  const parts: string[] = [];
  if (status) parts.push(`HTTP ${status}`);
  if (data && typeof data === "object") {
    const response = data as { code?: unknown; msg?: unknown; message?: unknown };
    if (response.code !== undefined) parts.push(`code ${response.code}`);
    const message = typeof response.msg === "string" && response.msg
      ? response.msg
      : typeof response.message === "string" && response.message
        ? response.message
        : "";
    if (message) parts.push(message);
  }
  return parts.join("，") || "未知错误";
}

export function formatFeishuError(error: unknown) {
  if (axios.isAxiosError(error)) {
    return `飞书 API 调用失败：${formatFeishuResponseError(error.response?.data, error.response?.status)}`;
  }

  return error instanceof Error ? error.message : String(error);
}

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

function markdownBlockToFeishuBlock(block: MarkdownBlock): FeishuBlock {
  if (block.type === "divider") {
    return { block_type: 22, divider: {} };
  }
  if (block.type === "heading") {
    return textBlock(2 + block.level, `heading${block.level}`, block.text);
  }
  if (block.type === "bullet") {
    return textBlock(12, "bullet", block.text);
  }
  if (block.type === "ordered") {
    return textBlock(13, "ordered", block.text);
  }
  return textBlock(2, "text", block.text);
}

export function markdownToFeishuBlocks(markdown: string): FeishuBlock[] {
  return parseMarkdownBlocks(markdown).map(markdownBlockToFeishuBlock);
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
    let response;
    try {
      response = await this.client.request<FeishuResponse<T>>({
        method,
        url,
        data,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json; charset=utf-8",
        },
      });
    } catch (error) {
      throw new Error(formatFeishuError(error));
    }

    if (response.data.code !== 0) {
      throw new Error(`飞书 API 调用失败：${formatFeishuResponseError(response.data)}`);
    }
    return response.data.data as T;
  }

  private async getTenantAccessToken() {
    if (this.token && Date.now() < this.tokenExpireAt) {
      return this.token;
    }

    let response;
    try {
      response = await this.client.post<FeishuResponse>("/auth/v3/tenant_access_token/internal", {
        app_id: this.config.appId,
        app_secret: this.config.appSecret,
      });
    } catch (error) {
      throw new Error(formatFeishuError(error));
    }

    if (response.data.code !== 0 || !response.data.tenant_access_token) {
      throw new Error(`获取飞书 tenant_access_token 失败：${formatFeishuResponseError(response.data)}`);
    }

    this.token = response.data.tenant_access_token;
    this.tokenExpireAt = Date.now() + Math.max((response.data.expire || 7200) - 300, 60) * 1000;
    return this.token;
  }

  async appendMarkdown(markdown: string, documentId = this.config.documentId) {
    if (!documentId) {
      throw new Error("请先配置飞书云文档 Document ID");
    }
    const blocks = markdownToFeishuBlocks(markdown);
    if (!blocks.length) return;

    for (const children of chunkArray(blocks, 40)) {
      await this.request(
        "post",
        `/docx/v1/documents/${documentId}/blocks/${documentId}/children`,
        {
          children,
          index: -1,
        },
      );
    }
  }

  async createDocument(input: { folderToken: string; title: string }) {
    const data = await this.request<FeishuCreatedDocument>("post", "/docx/v1/documents", {
      folder_token: input.folderToken,
      title: input.title,
    });
    const documentId = data?.document?.document_id;
    if (!documentId) {
      throw new Error("飞书创建文档失败：未返回 Document ID");
    }
    return documentId;
  }

  async createDocumentAndAppendMarkdown(input: { folderToken: string; title: string; markdown: string }) {
    const documentId = await this.createDocument({
      folderToken: input.folderToken,
      title: input.title,
    });
    await this.appendMarkdown(input.markdown, documentId);
    return documentId;
  }
}

export function extractFeishuDocumentId(input: string) {
  const value = input.trim();
  if (!value) return "";

  const match = value.match(/\/docx\/([^/?#]+)/);
  if (match?.[1]) return match[1];
  return value;
}

export function extractFeishuFolderToken(input: string) {
  const value = input.trim();
  if (!value) return "";

  const match = value.match(/\/drive\/folder\/([^/?#]+)/);
  if (match?.[1]) return match[1];
  return value;
}
