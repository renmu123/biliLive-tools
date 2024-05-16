import Router from "koa-router";
import { ollama } from "@biliLive-tools/shared/lib/llm/index.js";

const router = new Router({
  prefix: "/llm",
});

router.get("/ollama/modelList", async (ctx) => {
  const data = ctx.request.query as {
    baseUrl: string;
  };
  const models = (await ollama.getModelList(data.baseUrl)).models.map((item) => item.name);
  ctx.body = models;
});

export default router;
