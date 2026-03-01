import fs from "fs-extra";
import Router from "@koa/router";
import { songRecognize } from "@biliLive-tools/shared/musicDetector/index.js";
import { subtitleRecognize } from "@biliLive-tools/shared/musicDetector/subtitle.js";
import { getTempPath, uuid } from "@biliLive-tools/shared/utils/index.js";
import { addExtractAudioTask } from "@biliLive-tools/shared/task/video.js";
import { appConfig } from "@biliLive-tools/shared/config.js";

const router = new Router({
  prefix: "/ai",
});

// router.post("/asr", async (ctx) => {
//   const data = ctx.request.body as {
//     file: string;
//     vendorId: string;
//     model: string;
//   };
//   const result = await asrRecognize(data.file, { vendorId: data.vendorId, model: data.model });

//   ctx.body = result;
// });

// router.post("/llm", async (ctx) => {
//   const data = ctx.request.body as {
//     message: string;
//     systemPrompt?: string;
//     enableSearch?: boolean;
//     jsonResponse?: boolean;
//     stream?: boolean;
//   };
//   const result = await llm(data.message, data.systemPrompt, {
//     enableSearch: data.enableSearch,
//     key: undefined,
//     jsonResponse: data.jsonResponse,
//     stream: data.stream,
//   });
//   ctx.body = result;
// });

router.post("/song_recognize", async (ctx) => {
  const data = ctx.request.body as {
    // file - 完整视频文件路径
    file: string;
    // startTime - 提取音频的开始时间，单位秒
    startTime: number;
    // endTime - 提取音频的结束时间，单位秒
    endTime: number;
  };
  if (!data.file || data.startTime == null || data.endTime == null) {
    ctx.status = 400;
    ctx.body = {
      error: "参数错误，必须包含 file、startTime 和 endTime 字段",
    };
    return;
  }

  const cachePath = getTempPath();
  const fileName = `${uuid()}.mp3`;
  const task = await addExtractAudioTask(data.file, fileName, {
    startTime: data.startTime,
    endTime: data.endTime,
    saveType: 2,
    savePath: cachePath,
    autoRun: true,
    addQueue: false,
    format: "libmp3lame",
    audioBitrate: "192k",
  });
  const outputFile: string = await new Promise((resolve, reject) => {
    task.on("task-end", () => {
      resolve(task.output as string);
    });
    task.on("task-error", (err) => {
      reject(err);
    });
  });

  const result = await songRecognize(outputFile, data.startTime);

  // 清理临时音频文件
  fs.remove(outputFile);

  ctx.body = result;
});

router.post("/subtitle", async (ctx) => {
  const data = ctx.request.body as {
    // file - 完整视频文件路径
    file: string;
    // modelId - AI 模型 ID
    modelId?: string;
    // startTime - 开始时间，单位秒
    startTime?: number;
    // endTime - 结束时间，单位秒
    endTime?: number;
    // offset - 时间偏移量，单位秒
    offset?: number;
  };

  if (!data.file) {
    ctx.status = 400;
    ctx.body = {
      error: "参数错误，必须包含 file 字段",
    };
    return;
  }
  const config = appConfig.get("ai") || {};
  const asrModelId = config.subtitleRecognize.modelId;
  if (!asrModelId) {
    throw new Error("请先在配置中设置字幕识别ASR模型");
  }

  try {
    let audioFile = data.file;
    let needCleanup = false;

    // 如果指定了时间范围，需要先提取音频片段
    if (data.startTime != null && data.endTime != null) {
      const cachePath = getTempPath();
      const fileName = `${uuid()}.mp3`;
      const task = await addExtractAudioTask(data.file, fileName, {
        startTime: data.startTime,
        endTime: data.endTime,
        saveType: 2,
        savePath: cachePath,
        autoRun: true,
        addQueue: false,
        format: "libmp3lame",
        audioBitrate: "192k",
      });

      audioFile = await new Promise((resolve, reject) => {
        task.on("task-end", () => {
          resolve(task.output as string);
        });
        task.on("task-error", (err) => {
          reject(err);
        });
      });
      needCleanup = true;
    }

    const srt = await subtitleRecognize(audioFile, asrModelId, {
      offset: data.offset,
      disableCache: true,
    });

    // 清理临时音频文件
    if (needCleanup) {
      fs.remove(audioFile);
    }

    ctx.body = {
      srt,
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = {
      error: error.message || "字幕识别失败",
    };
  }
});

export default router;
