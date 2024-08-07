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

router.post("/pause", async (ctx) => {
  const { id } = ctx.request.body as { id: string };
  console.log(id);
  handlePauseTask(id);
  ctx.body = { code: 0 };
});

router.post("/resume", async (ctx) => {
  const { id } = ctx.request.body as { id: string };
  handleResumeTask(id);
  ctx.body = { code: 0 };
});

router.post("/kill", async (ctx) => {
  const { id } = ctx.request.body as { id: string };
  handleKillTask(id);
  ctx.body = { code: 0 };
});

router.post("/interrupt", async (ctx) => {
  const { id } = ctx.request.body as { id: string };
  hanldeInterruptTask(id);
  ctx.body = { code: 0 };
});

router.get("/list", async (ctx) => {
  ctx.body = handleListTask();
});

router.get("/query", async (ctx) => {
  const { id } = ctx.query as { id: string };
  ctx.body = handleQueryTask(id);
});

router.post("/remove", async (ctx) => {
  const { id } = ctx.request.body as { id: string };
  handleRemoveTask(id);
  ctx.body = { code: 0 };
});

router.post("/start", async (ctx) => {
  const { id } = ctx.request.body as { id: string };
  handleStartTask(id);
  ctx.body = { code: 0 };
});

export default router;
