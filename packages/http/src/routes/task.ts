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

export default router;
