import type { AppConfig } from "@biliLive-tools/types";

import { extractFeishuDocumentId, FeishuDocClient } from "./feishu.js";
import { extractNotionPageId, NotionClient } from "./notion.js";

export interface SummaryExportContext {
  title?: string;
  streamer?: string;
  roomId?: string;
  platform?: string;
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
    try {
      const documentId = extractFeishuDocumentId(feishuConfig.documentId);
      if (!feishuConfig.appId || !feishuConfig.appSecret || !documentId) {
        throw new Error("请先完整配置飞书 App ID、App Secret 和云文档 Document ID");
      }
      await new FeishuDocClient({
        appId: feishuConfig.appId,
        appSecret: feishuConfig.appSecret,
        documentId,
      }).appendMarkdown(markdown);
    } catch (error) {
      errors.push(`飞书文档：${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (notionConfig?.enabled) {
    try {
      const pageId = extractNotionPageId(notionConfig.pageId);
      if (!notionConfig.token || !pageId) {
        throw new Error("请先完整配置 Notion Token 和页面 ID/链接");
      }
      await new NotionClient({
        token: notionConfig.token,
        pageId,
      }).appendMarkdown(markdown);
    } catch (error) {
      errors.push(`Notion：${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (errors.length) {
    throw new Error(`总结已生成，但导出失败：${errors.join("；")}`);
  }
}
