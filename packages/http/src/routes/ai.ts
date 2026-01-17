import Router from "@koa/router";
import { asrRecognize, llm } from "@biliLive-tools/shared/task/ai.js";

const router = new Router({
  prefix: "/ai",
});

router.post("/asr", async (ctx) => {
  const result = await asrRecognize();

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

export default router;
