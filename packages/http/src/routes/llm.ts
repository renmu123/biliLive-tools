import Router from "@koa/router";
import { ollama } from "@biliLive-tools/shared/llm/index.js";
import { addTranslateTask } from "@biliLive-tools/shared/task/llm.js";

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

router.post("/translate", async (ctx) => {
  const data = ctx.request.body as {
    input: string;
    output: string;
  };
  console.log(data);
  const content = await addTranslateTask(data.input, data.output);
  // const models = (await ollama.getModelList(data.baseUrl)).models.map((item) => item.name);
  ctx.body = content;
});

export default router;
