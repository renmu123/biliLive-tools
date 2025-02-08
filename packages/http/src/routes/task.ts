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
} from "@biliLive-tools/shared/task/task.js";
import { convertXml2Ass } from "@biliLive-tools/shared/task/danmu.js";
import { mergeVideos, transcode, burn, readVideoMeta } from "@biliLive-tools/shared/task/video.js";
import { biliApi, validateBiliupConfig } from "@biliLive-tools/shared/task/bili.js";

import type { DanmuConfig } from "@biliLive-tools/types";

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

router.post("/:id/remove", async (ctx) => {
  const { id } = ctx.params;
  handleRemoveTask(id);
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
    preset: DanmuConfig;
    options: {
      saveRadio: 1 | 2;
      savePath: string;
      removeOrigin?: boolean;
      copyInput?: boolean;
      temp?: boolean;
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

router.post("/mergeVideo", async (ctx) => {
  const { inputVideos, options } = ctx.request.body as {
    inputVideos: string[];
    options: {
      output?: string;
      removeOrigin: boolean;
      saveOriginPath: boolean;
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

  const task = await mergeVideos(inputVideos, options);
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

export default router;
