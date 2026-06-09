import type { AppConfig } from "@biliLive-tools/types";

import { extractFeishuDocumentId, extractFeishuFolderToken, FeishuDocClient } from "./feishu.js";
import { extractNotionPageId, NotionClient } from "./notion.js";
import logger from "../utils/log.js";

export interface SummaryExportContext {
  title?: string;
  streamer?: string;
  roomId?: string;
  platform?: string;
  recordStartTime?: number;
}

type LiveSummaryConfig = AppConfig["ai"]["liveSummary"] & {
  feishu?: AppConfig["ai"]["liveSummary"]["exportTargets"]["feishu"];
};

export function buildSummaryExportMarkdown(summary: string, input: SummaryExportContext) {
  const meta = [
    input.streamer ? `- 主播：${input.streamer}` : "",
    input.title ? `- 直播标题：${input.title}` : "",
    input.platform ? `- 平台：${input.platform}` : "",
    input.roomId ? `- 房间号：${input.roomId}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    input.title ? `# ${input.title}` : "# 直播总结",
    meta,
    summary,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function padTime(value: number) {
  return String(value).padStart(2, "0");
}

function formatTitleTime(timestamp?: number) {
  const date = new Date(timestamp || Date.now());
  return [
    date.getFullYear(),
    padTime(date.getMonth() + 1),
    padTime(date.getDate()),
  ].join("-") + ` ${padTime(date.getHours())}:${padTime(date.getMinutes())}`;
}

function cleanExportTitle(title: string) {
  return title.replace(/[\r\n\t]/g, " ").replace(/\s+/g, " ").trim();
}

export function buildSummaryExportTitle(input: SummaryExportContext, template?: string) {
  const time = formatTitleTime(input.recordStartTime);
  const room = input.streamer || (input.roomId ? `房间${input.roomId}` : "直播房间");
  const variables: Record<string, string> = {
    streamer: input.streamer || "",
    roomId: input.roomId || "",
    room,
    title: input.title || "",
    platform: input.platform || "",
    time,
  };
  const raw = template?.trim()
    ? template.replace(/\{(streamer|roomId|room|title|platform|time)\}/g, (_, key: string) => variables[key] || "")
    : `${room} - ${time}`;
  return cleanExportTitle(raw) || `直播总结 - ${time}`;
}

function getFeishuConfig(config: LiveSummaryConfig) {
  const current = config.exportTargets?.feishu;
  if (!config.feishu) return current;
  if (current?.enabled || current?.appId || current?.appSecret || current?.documentId) return current;
  return config.feishu;
}

export function getEnabledSummaryExportTargetNames(config: LiveSummaryConfig) {
  const names: string[] = [];
  const feishuConfig = getFeishuConfig(config);
  if (feishuConfig?.enabled) names.push("飞书文档");
  if (config.exportTargets?.notion?.enabled) names.push("Notion");
  return names;
}

export async function exportSummaryToTargets(
  summary: string,
  input: SummaryExportContext,
  config: LiveSummaryConfig,
) {
  const markdown = buildSummaryExportMarkdown(summary, input);
  const errors: string[] = [];
  const feishuConfig = getFeishuConfig(config);
  const notionConfig = config.exportTargets?.notion;

  if (feishuConfig?.enabled) {
    const documentId = extractFeishuDocumentId(feishuConfig.documentId);
    const folderToken = extractFeishuFolderToken(feishuConfig.folderToken || "");
    const mode = feishuConfig.mode || "append";
    const exportTitle = buildSummaryExportTitle(input, feishuConfig.titleTemplate);
    logger.info("开始导出直播总结到飞书文档", {
      ...input,
      documentId,
      folderToken,
      mode,
      exportTitle,
      markdownLength: markdown.length,
    });
    try {
      if (!feishuConfig.appId || !feishuConfig.appSecret) {
        throw new Error("请先完整配置飞书 App ID 和 App Secret");
      }
      const feishuClient = new FeishuDocClient({
        appId: feishuConfig.appId,
        appSecret: feishuConfig.appSecret,
        documentId: mode === "append" ? documentId : undefined,
      });
      if (mode === "create") {
        if (!folderToken) {
          throw new Error("请先配置飞书云空间文件夹 Token/链接");
        }
        await feishuClient.createDocumentAndAppendMarkdown({
          folderToken,
          title: exportTitle,
          markdown,
        });
      } else {
        if (!documentId) {
          throw new Error("请先配置飞书云文档 Document ID/链接");
        }
        await feishuClient.appendMarkdown(markdown);
      }
      logger.info("导出直播总结到飞书文档完成", {
        ...input,
        documentId,
        folderToken,
        mode,
        exportTitle,
        markdownLength: markdown.length,
      });
    } catch (error) {
      logger.error("导出直播总结到飞书文档失败", error);
      errors.push(`飞书文档：${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (notionConfig?.enabled) {
    const pageId = extractNotionPageId(notionConfig.pageId);
    const mode = notionConfig.mode || "append";
    const exportTitle = buildSummaryExportTitle(input, notionConfig.titleTemplate);
    logger.info("开始导出直播总结到 Notion", {
      ...input,
      pageId,
      mode,
      exportTitle,
      markdownLength: markdown.length,
    });
    try {
      if (!notionConfig.token || !pageId) {
        throw new Error(
          mode === "create_child_page"
            ? "请先完整配置 Notion Token 和父页面 ID/链接"
            : "请先完整配置 Notion Token 和页面 ID/链接",
        );
      }
      const notionClient = new NotionClient({
        token: notionConfig.token,
        pageId,
      });
      if (mode === "create_child_page") {
        await notionClient.createChildPageAndAppendMarkdown({
          title: exportTitle,
          markdown,
        });
      } else {
        await notionClient.appendMarkdown(markdown);
      }
      logger.info("导出直播总结到 Notion 完成", {
        ...input,
        pageId,
        mode,
        exportTitle,
        markdownLength: markdown.length,
      });
    } catch (error) {
      logger.error("导出直播总结到 Notion 失败", error);
      errors.push(`Notion：${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (errors.length) {
    throw new Error(`总结已生成，但导出失败：${errors.join("；")}`);
  }
}
