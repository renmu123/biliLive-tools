import axios, { AxiosInstance } from "axios";

import { chunkArray, parseMarkdownBlocks, type MarkdownBlock } from "./markdown.js";

export interface NotionConfig {
  token: string;
  pageId: string;
}

type NotionRichText = {
  type: "text";
  text: {
    content: string;
  };
};

type NotionBlock = {
  object: "block";
  type: string;
  [key: string]: unknown;
};

const NOTION_BASE_URL = "https://api.notion.com/v1";
const NOTION_VERSION = "2026-03-11";
const RICH_TEXT_CHUNK_SIZE = 1900;

function splitText(content: string, size: number) {
  const chunks: string[] = [];
  for (let i = 0; i < content.length; i += size) {
    chunks.push(content.slice(i, i + size));
  }
  return chunks;
}

function richText(content: string): NotionRichText[] {
  return splitText(content, RICH_TEXT_CHUNK_SIZE).map((item) => ({
    type: "text",
    text: {
      content: item,
    },
  }));
}

function textBlock(type: string, content: string): NotionBlock {
  return {
    object: "block",
    type,
    [type]: {
      rich_text: richText(content),
    },
  };
}

function markdownBlockToNotionBlock(block: MarkdownBlock): NotionBlock {
  if (block.type === "divider") {
    return {
      object: "block",
      type: "divider",
      divider: {},
    };
  }
  if (block.type === "heading") {
    return textBlock(`heading_${Math.min(block.level, 4)}`, block.text);
  }
  if (block.type === "bullet") {
    return textBlock("bulleted_list_item", block.text);
  }
  if (block.type === "ordered") {
    return textBlock("numbered_list_item", block.text);
  }
  return textBlock("paragraph", block.text);
}

export function markdownToNotionBlocks(markdown: string): NotionBlock[] {
  return parseMarkdownBlocks(markdown).map(markdownBlockToNotionBlock);
}

function normalizeUuid(value: string) {
  const compact = value.replace(/-/g, "");
  if (!/^[0-9a-f]{32}$/i.test(compact)) return "";
  return [
    compact.slice(0, 8),
    compact.slice(8, 12),
    compact.slice(12, 16),
    compact.slice(16, 20),
    compact.slice(20),
  ].join("-");
}

export function extractNotionPageId(input: string) {
  const value = input.trim();
  if (!value) return "";

  const uuidMatch = value.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuidMatch?.[0]) return normalizeUuid(uuidMatch[0]);

  const compactMatches = value.match(/[0-9a-f]{32}/gi);
  if (compactMatches?.length) {
    return normalizeUuid(compactMatches[compactMatches.length - 1]);
  }

  return "";
}

export function formatNotionError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) {
      return "Notion Token 无效或已失效，请检查 Internal Integration Token";
    }
    if (status === 403) {
      return "Notion integration 没有写入权限，请确认已将目标页面分享给该 integration";
    }
    if (status === 404) {
      return "Notion 页面不存在或当前 integration 无访问权限，请检查页面 ID/链接，并确认已将目标页面分享给该 integration";
    }

    const message = error.response?.data && typeof error.response.data === "object"
      ? (error.response.data as { message?: unknown }).message
      : undefined;
    if (typeof message === "string" && message) return message;
  }

  return error instanceof Error ? error.message : String(error);
}

export class NotionClient {
  private client: AxiosInstance;

  constructor(private config: NotionConfig) {
    this.client = axios.create({
      baseURL: NOTION_BASE_URL,
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
        "Notion-Version": NOTION_VERSION,
      },
    });
  }

  async appendMarkdown(markdown: string) {
    const blocks = markdownToNotionBlocks(markdown);
    if (!blocks.length) return;

    try {
      for (const children of chunkArray(blocks, 100)) {
        await this.client.patch(`/blocks/${this.config.pageId}/children`, {
          children,
        });
      }
    } catch (error) {
      throw new Error(formatNotionError(error));
    }
  }
}
