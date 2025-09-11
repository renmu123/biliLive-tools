import fs from "fs-extra";
import Router from "koa-router";

import {
  handleStartTask,
  handlePauseTask,
  handleResumeTask,
  handleKillTask,
  hanldeInterruptTask,
  handleListTask,
  handleRemoveTask,
  handleQueryTask,
  taskQueue,
  handleRestartTask,
} from "@biliLive-tools/shared/task/task.js";
import { convertXml2Ass } from "@biliLive-tools/shared/task/danmu.js";
import {
  mergeVideos,
  transcode,
  burn,
  readVideoMeta,
  cut,
  checkMergeVideos,
} from "@biliLive-tools/shared/task/video.js";
import { biliApi, validateBiliupConfig } from "@biliLive-tools/shared/task/bili.js";
import { trashItem } from "@biliLive-tools/shared/utils/index.js";
import { fileCache } from "../index.js";

import type { DanmuPreset, DanmaOptions } from "@biliLive-tools/types";

const router = new Router({
  prefix: "/task",
});

router.get("/", async (ctx) => {
  const type = ctx.query.type;
  let data = handleListTask();
  if (type) {
    data = data.filter((item) => item.type === type);
  }

  ctx.body = {
    list: data,
    runningTaskNum: data.filter((item) => item.status === "running").length,
  };
});

router.get("/:id", async (ctx) => {
  const { id } = ctx.params;
  ctx.body = handleQueryTask(id);
});

router.post("/:id/pause", async (ctx) => {
  const { id } = ctx.params;
  console.log(id);
  handlePauseTask(id);
  ctx.body = { code: 0 };
});

router.post("/:id/resume", async (ctx) => {
  const { id } = ctx.params;
  handleResumeTask(id);
  ctx.body = { code: 0 };
});

router.post("/:id/kill", async (ctx) => {
  const { id } = ctx.params;
  handleKillTask(id);
  ctx.body = { code: 0 };
});

router.post("/:id/interrupt", async (ctx) => {
  const { id } = ctx.params;
  hanldeInterruptTask(id);
  ctx.body = { code: 0 };
});

router.post("/:id/removeRecord", async (ctx) => {
  const { id } = ctx.params;
  handleRemoveTask(id);
  ctx.body = { code: 0 };
});

router.post("/:id/restart", async (ctx) => {
  const { id } = ctx.params;
  handleRestartTask(id);
  ctx.body = { code: 0 };
});

router.post("/:id/removeFile", async (ctx) => {
  const { id } = ctx.params;
  const task = taskQueue.queryTask(id);
  if (!task) {
    throw new Error("任务不存在");
  }
  if (task.status !== "completed" && task.status !== "error") {
    throw new Error("任务状态错误");
  }
  if (task.type !== "ffmpeg") {
    throw new Error("不支持的任务");
  }
  if (task.output && !(await fs.pathExists(task?.output))) {
    throw new Error("文件不存在");
  }

  await trashItem(task.output!);
  ctx.body = { code: 0 };
});

router.post("/:id/start", async (ctx) => {
  const { id } = ctx.params;
  handleStartTask(id);
  ctx.body = { code: 0 };
});

router.post("/removeBatch", async (ctx) => {
  const { ids } = ctx.request.body as { ids: string[] };
  ids.forEach((id) => handleRemoveTask(id));
  ctx.body = { code: 0 };
});

router.post("/videoMeta", async (ctx) => {
  const { file } = ctx.request.body as { file: string };
  console.log(ctx.params);
  if (!file) {
    ctx.status = 400;
    ctx.body = "file is required";
    return;
  }
  const data = await readVideoMeta(file, {});
  ctx.body = data;
});

router.post("/convertXml2Ass", async (ctx) => {
  const { input, output, preset, options } = ctx.request.body as {
    input: string;
    output: string;
    preset: DanmuPreset["config"];
    options: DanmaOptions & {
      sync?: boolean;
    };
  };
  if (!input || !output) {
    ctx.status = 400;
    ctx.body = { message: "input and output are required" };
    return;
  }
  if (!preset) {
    ctx.status = 400;
    ctx.body = { message: "preset is required" };
    return;
  }

  const task = await convertXml2Ass(
    {
      input,
      output,
    },
    preset,
    {
      removeOrigin: false,
      copyInput: false,
      ...options,
    },
  );
  if (options.sync) {
    const outputFile = await new Promise((resolve, reject) => {
      task.on("task-end", () => {
        resolve(task.output);
      });
      task.on("task-error", (err) => {
        reject(err);
      });
    });
    ctx.body = { taskId: task.taskId, output: outputFile };
  } else {
    ctx.body = { taskId: task.taskId, output: task.output };
  }
});

router.post("/checkMergeVideos", async (ctx) => {
  const { inputVideos } = ctx.request.body as {
    inputVideos: string[];
  };
  const result = await checkMergeVideos(inputVideos);
  ctx.body = result;
});

router.post("/mergeVideo", async (ctx) => {
  const { inputVideos, options } = ctx.request.body as {
    inputVideos: string[];
    options: {
      output?: string;
      saveOriginPath: boolean;
      keepFirstVideoMeta: boolean;
    };
  };
  if (!inputVideos || inputVideos.length < 2) {
    ctx.status = 400;
    ctx.body = { message: "inputVideos length must be greater than 1" };
    return;
  }
  if (!options.output && !options.saveOriginPath) {
    ctx.status = 400;
    ctx.body = { message: "output is required or saveOriginPath should be true" };
    return;
  }

  const task = await mergeVideos(inputVideos, {
    ...options,
    removeOrigin: false,
  });
  ctx.body = { taskId: task.taskId };
});

router.post("/transcode", async (ctx) => {
  const { input, outputName, ffmpegOptions, options } = ctx.request.body as {
    input: string;
    outputName: string;
    ffmpegOptions: any;
    options: {
      override?: boolean;
      removeOrigin?: boolean;
      /** 支持绝对路径和相对路径 */
      savePath?: string;
      /** 1: 保存到原始文件夹，2：保存到特定文件夹 */
      saveType: 1 | 2;
    };
  };
  if (!input) {
    ctx.status = 400;
    ctx.body = { message: "inputVideos length must be greater than 1" };
    return;
  }
  if (!outputName) {
    ctx.status = 400;
    ctx.body = { message: "outputName is required" };
    return;
  }

  const task = await transcode(input, outputName, ffmpegOptions, options);
  ctx.body = { taskId: task.taskId };
});

/**
 * 烧录
 */
router.post("/burn", async (ctx) => {
  const { files, output, options } = ctx.request.body as any;

  if (options?.uploadOptions?.upload && !options?.uploadOptions?.aid) {
    const [status, msg] = validateBiliupConfig(options?.uploadOptions?.config || {});
    if (!status) {
      ctx.status = 400;
      ctx.body = msg;
      return;
    }
  }
  const task = await burn(files, output, options);

  if (options?.uploadOptions?.upload) {
    task.on("task-end", () => {
      const aid = options?.uploadOptions?.aid;
      const uid = options?.uploadOptions?.uid;
      const file = options?.uploadOptions?.filePath;
      if (aid) {
        biliApi.editMedia(aid as number, [file], options?.uploadOptions?.config, uid);
      } else {
        biliApi.addMedia([file], options?.uploadOptions?.config, uid);
      }
    });
  }

  ctx.body = { taskId: task.taskId };
});

router.post("/cut", async (ctx) => {
  const { files, output, options, ffmpegOptions } = ctx.request.body as any;
  const task = await cut(files, output, ffmpegOptions, options);
  ctx.body = { taskId: task.taskId };
});

router.post("/addExtraVideoTask", async (ctx) => {
  const { taskId, filePath, partName } = ctx.request.body as {
    taskId: string;
    filePath: string;
    partName: string;
  };
  biliApi.addExtraVideoTask(taskId, filePath, partName);
  ctx.body = { code: 0 };
});

router.post("/editVideoPartName", async (ctx) => {
  const { taskId, partName } = ctx.request.body as {
    taskId: string;
    partName: string;
  };
  biliApi.editVideoPartName(taskId, partName);
  ctx.body = { code: 0 };
});

router.post("/queryVideoStatus", async (ctx) => {
  const { taskId } = ctx.request.body as {
    taskId: string;
  };
  const res = await biliApi.queryVideoStatus(taskId);
  ctx.body = res;
});

router.get("/:id/download", async (ctx) => {
  const { id } = ctx.params;
  const task = taskQueue.queryTask(id);
  if (!task) {
    ctx.status = 404;
    ctx.body = { message: "任务不存在" };
    return;
  }
  if (task.type !== "ffmpeg") {
    ctx.status = 400;
    ctx.body = { message: "不支持的任务类型" };
    return;
  }
  if (!task.output || !(await fs.pathExists(task.output))) {
    ctx.status = 404;
    ctx.body = { message: "文件不存在" };
    return;
  }
  const fileId = fileCache.setFile(task.output);

  ctx.body = fileId;
});

export default router;
