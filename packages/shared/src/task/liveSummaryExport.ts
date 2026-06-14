import type { AppConfig } from "@biliLive-tools/types";

import type { SummaryExportContext, SummaryExportResult } from "../ai/summaryExport.js";

type LiveSummaryConfig = AppConfig["ai"]["liveSummary"];

export interface LiveSummaryExportRecord {
  id: number;
  title?: string;
  video_file?: string;
  record_start_time?: number;
  ai_summary?: string;
  streamer?: {
    name?: string;
    room_id?: string;
    platform?: string;
  };
}

export interface LiveSummaryExportDeps {
  getRecord(recordId: number): LiveSummaryExportRecord | undefined;
  getSummaryConfig(): LiveSummaryConfig;
  getEnabledTargetNames(config: LiveSummaryConfig): string[];
  exportSummary(
    summary: string,
    input: SummaryExportContext,
    config: LiveSummaryConfig,
  ): Promise<void | SummaryExportResult[]>;
  updateRecord(data: {
    id: number;
    ai_summary_status: "completed" | "error";
    ai_summary?: string;
    ai_summary_error: string;
    ai_summary_time: number;
  }): void;
  logSuccess?(data: { recordId: number; targets: string[] }): void;
}

export async function exportExistingLiveSummaryWithDeps(
  recordId: number,
  deps: LiveSummaryExportDeps,
) {
  const record = deps.getRecord(recordId);
  if (!record) {
    throw new Error("记录不存在");
  }
  if (!record.ai_summary) {
    throw new Error("该记录还没有已生成的总结");
  }

  const summaryConfig = deps.getSummaryConfig();
  const exportTargets = deps.getEnabledTargetNames(summaryConfig);
  if (!exportTargets.length) {
    throw new Error("请先在 AI 配置中启用飞书或 Notion 导出目标");
  }

  const input: SummaryExportContext = {
    title: record.title,
    streamer: record.streamer?.name,
    roomId: record.streamer?.room_id,
    platform: record.streamer?.platform,
    recordStartTime: record.record_start_time,
  };

  try {
    await deps.exportSummary(record.ai_summary, input, summaryConfig);
    deps.updateRecord({
      id: recordId,
      ai_summary_status: "completed",
      ai_summary_error: "",
      ai_summary_time: Date.now(),
    });
    deps.logSuccess?.({
      recordId,
      targets: exportTargets,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    deps.updateRecord({
      id: recordId,
      ai_summary_status: "error",
      ai_summary: record.ai_summary,
      ai_summary_error: errorMessage,
      ai_summary_time: Date.now(),
    });
    throw error;
  }
}
