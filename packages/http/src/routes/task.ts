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
import {
  // mergeAssMp4,
  mergeVideos,
} from "@biliLive-tools/shared/task/video.js";

import type { DanmuConfig } from "@biliLive-tools/types";

const router = new Router({
  prefix: "/task",
});

router.get("/", async (ctx) => {
  ctx.body = handleListTask();
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

router.post("/convertXml2Ass", async (ctx) => {
  const { input, output, preset, options } = ctx.request.body as {
    input: string;
    output: string;
    preset: DanmuConfig;
    options: {
      removeOrigin: boolean;
      copyInput: boolean;
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
  ctx.body = { taskId: task.taskId };
});

router.post("/mergeVideo", async (ctx) => {
  const { inputVideos, output, options } = ctx.request.body as {
    inputVideos: string[];
    output: string;
    options: {
      removeOrigin: boolean;
    };
  };
  if (!inputVideos || inputVideos.length < 2) {
    ctx.status = 400;
    ctx.body = { message: "inputVideos length must be greater than 1" };
    return;
  }
  if (!output) {
    ctx.status = 400;
    ctx.body = { message: "output is required" };
    return;
  }

  const task = await mergeVideos(inputVideos, output, options);
  ctx.body = { taskId: task.taskId };
});

export default router;
