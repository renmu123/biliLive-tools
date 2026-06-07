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

    for (const children of chunkArray(blocks, 100)) {
      await this.client.patch(`/blocks/${this.config.pageId}/children`, {
        children,
      });
    }
  }
}
