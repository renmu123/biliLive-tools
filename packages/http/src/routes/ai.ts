import path from "node:path";
import fs from "fs-extra";
import Router from "@koa/router";
import { asrRecognize, llm, songRecognize } from "@biliLive-tools/shared/task/ai.js";
import { calculateFileQuickHash, getTempPath, uuid } from "@biliLive-tools/shared/utils/index.js";
import { addExtractAudioTask } from "@biliLive-tools/shared/task/video.js";

const router = new Router({
  prefix: "/ai",
});

router.post("/asr", async (ctx) => {
  const data = ctx.request.body as {
    file: string;
  };
  const result = await asrRecognize(data.file);

  ctx.body = result;
});

router.post("/llm", async (ctx) => {
  const data = ctx.request.body as {
    message: string;
    systemPrompt?: string;
  };
  const result = await llm(data.message, data.systemPrompt);
  ctx.body = result;
});

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
  // const fileHash = await calculateFileQuickHash(data.file);
  // const cachePath = getTempPath();
  // let maybeFullAudioFile = path.join(cachePath, `cut_${fileHash}.wav`);

  // if (await fs.pathExists(maybeFullAudioFile)) {
  //   // 已经存在完整音频文件，直接从这里开始识别
  // } else {
  //   const task = await addExtractAudioTask(data.file, `cut_${fileHash}.wav`, {
  //     startTime: data.startTime,
  //     endTime: data.endTime,
  //     saveType: 2,
  //     savePath: cachePath,
  //     autoRun: true,
  //     addQueue: false,
  //   });
  //   const outputFile: string = await new Promise((resolve, reject) => {
  //     task.on("task-end", () => {
  //       resolve(task.output as string);
  //     });
  //     task.on("task-error", (err) => {
  //       reject(err);
  //     });
  //   });
  // }

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
    audioRate: "192k",
  });
  const outputFile: string = await new Promise((resolve, reject) => {
    task.on("task-end", () => {
      resolve(task.output as string);
    });
    task.on("task-error", (err) => {
      reject(err);
    });
  });

  const result = await songRecognize(outputFile);

  // 清理临时音频文件
  fs.remove(outputFile);

  ctx.body = result;
});

export default router;
