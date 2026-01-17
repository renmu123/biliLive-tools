import Router from "@koa/router";
import { asrRecognize } from "@biliLive-tools/shared/task/ai.js";

const router = new Router({
  prefix: "/ai",
});

router.post("/asr", async (ctx) => {
  const result = await asrRecognize();

  ctx.body = result;
});

export default router;
