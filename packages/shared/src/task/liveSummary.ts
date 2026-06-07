import path from "node:path";
import { spawn } from "node:child_process";

import fs from "fs-extra";

import { createASRProvider, QwenLLM, type StandardASRResult } from "../ai/index.js";
import { extractFeishuDocumentId, FeishuDocClient } from "../ai/feishu.js";
import { appConfig } from "../config.js";
import { recordHistoryService } from "../db/index.js";
import { TaskType } from "../enum.js";
import { getModel } from "../musicDetector/utils.js";
import { getTempPath } from "../utils/index.js";
import logger from "../utils/log.js";
import { AbstractTask, taskQueue } from "./core/index.js";

export interface LiveSummaryTaskOptions {
  recordId: number;
  videoFile: string;
  title?: string;
  streamer?: string;
  roomId?: string;
  platform?: string;
}

function getVendor(vendorId: string) {
  const config = appConfig.getAll();
  const vendor = config.ai.vendors.find((item) => item.id === vendorId);
  if (!vendor) {
    throw new Error(`找不到LLM模型关联的供应商：${vendorId}`);
  }
  return vendor;
}

function formatTime(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((item) => String(item).padStart(2, "0")).join(":");
}

function buildTranscript(result: StandardASRResult) {
  if (!result.segments.length) {
    return result.text;
  }
  return result.segments
    .map((segment) => `[${formatTime(segment.start)}-${formatTime(segment.end)}] ${segment.text}`)
    .join("\n");
}

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  const headLength = Math.floor(maxLength * 0.7);
  const tailLength = maxLength - headLength;
  return `${text.slice(0, headLength)}

...[中间内容因长度限制省略]...

${text.slice(-tailLength)}`;
}

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) {
    throw new Error("直播总结任务已取消");
  }
}

function buildSummaryDocument(summary: string, input: LiveSummaryTaskOptions) {
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

async function appendSummaryToFeishu(summary: string, options: LiveSummaryTaskOptions) {
  const feishuConfig = appConfig.getAll().ai.liveSummary.feishu;
  if (!feishuConfig?.enabled) return;

  const documentId = extractFeishuDocumentId(feishuConfig.documentId);
  if (!feishuConfig.appId || !feishuConfig.appSecret || !documentId) {
    throw new Error("请先完整配置飞书 App ID、App Secret 和云文档 Document ID");
  }

  const client = new FeishuDocClient({
    appId: feishuConfig.appId,
    appSecret: feishuConfig.appSecret,
    documentId,
  });
  await client.appendMarkdown(buildSummaryDocument(summary, options));
}

async function extractAudioToMp3(
  videoFile: string,
  outputFile: string,
  signal: AbortSignal,
): Promise<void> {
  const { ffmpegPath } = appConfig.getAll();
  if (!ffmpegPath) {
    throw new Error("未找到 ffmpeg 路径，请先完成 ffmpeg 配置");
  }

  await fs.ensureDir(path.dirname(outputFile));

  return new Promise((resolve, reject) => {
    const child = spawn(
      ffmpegPath,
      [
        "-y",
        "-i",
        videoFile,
        "-vn",
        "-acodec",
        "libmp3lame",
        "-ar",
        "16000",
        "-ac",
        "1",
        "-b:a",
        "32k",
        outputFile,
      ],
      { windowsHide: true },
    );

    let stderr = "";
    const onAbort = () => {
      child.kill("SIGKILL");
      reject(new Error("直播总结任务已取消"));
    };
    signal.addEventListener("abort", onAbort, { once: true });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    child.on("error", (error) => {
      signal.removeEventListener("abort", onAbort);
      reject(error);
    });
    child.on("close", (code) => {
      signal.removeEventListener("abort", onAbort);
      if (signal.aborted) return;
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`提取音频失败，ffmpeg 退出码：${code}\n${stderr.slice(-1000)}`));
      }
    });
  });
}

async function createSummary(input: {
  transcript: string;
  title?: string;
  streamer?: string;
  roomId?: string;
  platform?: string;
}) {
  const config = appConfig.getAll();
  const summaryConfig = config.ai.liveSummary;
  const llmModelId = summaryConfig.llmModelId;
  if (!llmModelId) {
    throw new Error("请先在 AI 配置中设置直播总结 LLM 模型");
  }

  const model = getModel(llmModelId, config);
  const vendor = getVendor(model.vendorId);
  const llm = new QwenLLM({
    apiKey: vendor.apiKey,
    baseURL: vendor.baseURL,
    model: model.modelName,
    timeout: 120000,
  });

  const maxInputLength = summaryConfig.maxInputLength || 24000;
  const transcript = truncateText(input.transcript, maxInputLength);
  const meta = [
    input.title ? `直播标题：${input.title}` : "",
    input.streamer ? `主播：${input.streamer}` : "",
    input.platform ? `平台：${input.platform}` : "",
    input.roomId ? `房间号：${input.roomId}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await llm.sendMessage(
    `${meta}

以下是按时间排列的直播语音转写内容：

${transcript}`,
    summaryConfig.prompt,
    {
      temperature: 0.2,
      maxTokens: 3000,
    },
  );

  if (!response.content) {
    throw new Error("LLM 未返回总结内容");
  }
  return response.content;
}

export class LiveSummaryTask extends AbstractTask {
  type = TaskType.liveSummary;
  controller = new AbortController();
  private options: LiveSummaryTaskOptions;

  constructor(options: LiveSummaryTaskOptions) {
    super();
    this.options = options;
    this.name = `直播总结: ${path.basename(options.videoFile)}`;
    this.action = ["kill"];
    this.extra = {
      recordId: options.recordId,
      videoFile: options.videoFile,
    };
  }

  exec() {
    if (this.status !== "pending") return;
    this.status = "running";
    this.progress = 0;
    this.startTime = Date.now();
    this.emitter.emit("task-start", { taskId: this.taskId });

    this.run()
      .then(() => {
        if (this.status === "canceled") return;
        this.status = "completed";
        this.progress = 100;
        this.emitter.emit("task-end", { taskId: this.taskId });
      })
      .catch((error) => {
        this.status = this.status === "canceled" ? "canceled" : "error";
        const errorMessage = error?.message || String(error);
        this.error = errorMessage;
        if (this.status === "canceled") {
          recordHistoryService.update({
            id: this.options.recordId,
            ai_summary_status: "error",
            ai_summary_error: "直播总结任务已取消",
            ai_summary_time: Date.now(),
          });
          this.emitter.emit("task-cancel", { taskId: this.taskId, autoStart: true });
          return;
        }
        recordHistoryService.update({
          id: this.options.recordId,
          ai_summary_status: "error",
          ai_summary_error: errorMessage,
          ai_summary_time: Date.now(),
        });
        this.emitter.emit("task-error", { taskId: this.taskId, error: errorMessage });
      })
      .finally(() => {
        this.endTime = Date.now();
      });
  }

  private async run() {
    const config = appConfig.getAll();
    const summaryConfig = config.ai.liveSummary;
    const asrModelId = summaryConfig.asrModelId;
    if (!asrModelId) {
      throw new Error("请先在 AI 配置中设置直播总结 ASR 模型");
    }

    recordHistoryService.update({
      id: this.options.recordId,
      ai_summary_status: "running",
      ai_summary_error: "",
    });

    this.custsomProgressMsg = "正在提取音频";
    this.progress = 10;
    this.emitter.emit("task-progress", { taskId: this.taskId });

    const workDir = path.join(getTempPath(), "live-summary", this.taskId);
    try {
      const audioFile = path.join(workDir, "audio.mp3");
      await extractAudioToMp3(this.options.videoFile, audioFile, this.controller.signal);
      throwIfAborted(this.controller.signal);

      this.custsomProgressMsg = "正在识别语音";
      this.progress = 35;
      this.emitter.emit("task-progress", { taskId: this.taskId });

      const asr = createASRProvider(asrModelId);
      const result = await asr.recognizeLocalFile(audioFile);
      throwIfAborted(this.controller.signal);

      const transcript = buildTranscript(result);
      if (!transcript.trim()) {
        throw new Error("ASR 未识别到有效语音内容");
      }

      let transcriptFile: string | undefined;
      if (summaryConfig.saveTranscript) {
        transcriptFile = path.join(
          path.dirname(this.options.videoFile),
          `${path.basename(this.options.videoFile, path.extname(this.options.videoFile))}.transcript.txt`,
        );
        await fs.writeFile(transcriptFile, transcript);
      }

      this.custsomProgressMsg = "正在生成总结";
      this.progress = 70;
      this.emitter.emit("task-progress", { taskId: this.taskId });

      const summary = await createSummary({
        transcript,
        title: this.options.title,
        streamer: this.options.streamer,
        roomId: this.options.roomId,
        platform: this.options.platform,
      });
      throwIfAborted(this.controller.signal);

      if (summaryConfig.feishu?.enabled) {
        this.custsomProgressMsg = "正在写入飞书文档";
        this.progress = 90;
        this.emitter.emit("task-progress", { taskId: this.taskId });

        try {
          await appendSummaryToFeishu(summary, this.options);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const summaryErrorMessage = `总结已生成，但写入飞书文档失败：${errorMessage}`;
          recordHistoryService.update({
            id: this.options.recordId,
            ai_summary_status: "error",
            ai_summary: summary,
            ai_summary_error: summaryErrorMessage,
            ...(transcriptFile ? { ai_transcript_file: transcriptFile } : {}),
            ai_summary_time: Date.now(),
          });
          throw new Error(summaryErrorMessage);
        }
      }

      recordHistoryService.update({
        id: this.options.recordId,
        ai_summary_status: "completed",
        ai_summary: summary,
        ai_summary_error: "",
        ...(transcriptFile ? { ai_transcript_file: transcriptFile } : {}),
        ai_summary_time: Date.now(),
      });
    } finally {
      await fs.remove(workDir);
    }
  }

  pause() {
    return false;
  }

  resume() {
    return false;
  }

  kill() {
    if (["completed", "error", "canceled"].includes(this.status)) return false;
    this.controller.abort();
    this.status = "canceled";
    return true;
  }
}

export function addLiveSummaryTask(
  options: LiveSummaryTaskOptions,
  extraOptions?: {
    force?: boolean;
  },
) {
  const config = appConfig.getAll();
  if (!extraOptions?.force && !config.ai.liveSummary.enabled) return null;

  const task = new LiveSummaryTask(options);
  recordHistoryService.update({
    id: options.recordId,
    ai_summary_status: "pending",
    ai_summary_error: "",
  });
  taskQueue.addTask(task, true);
  logger.info("已添加直播总结任务", {
    taskId: task.taskId,
    recordId: options.recordId,
    videoFile: options.videoFile,
  });
  return task;
}
