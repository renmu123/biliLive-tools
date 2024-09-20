import Koa from "koa";
import Router from "koa-router";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import sse from "koa-sse-stream";

import errorMiddleware from "./middleware/error.js";
export * from "./routes/api_types.js";

import webhookRouter from "./routes/webhook.js";
import configRouter from "./routes/config.js";
import llmRouter from "./routes/llm.js";
import commonRouter from "./routes/common.js";
import userRouter from "./routes/user.js";
import presetRouter from "./routes/preset.js";
import SSERouter from "./routes/sse.js";
import recocderRouter from "./routes/recorder.js";
import biliRouter from "./routes/bili.js";
import taskRouter from "./routes/task.js";
import { WebhookHandler } from "./services/webhook.js";

import type { GlobalConfig } from "@biliLive-tools/types";
import type { AwilixContainer } from "awilix";
import type { AppConfig } from "@biliLive-tools/shared";

export let config: GlobalConfig;
export let handler!: WebhookHandler;
export let appConfig!: AppConfig;
export let container!: AwilixContainer;

const app = new Koa();
const router = new Router();

router.get("/", async (ctx) => {
  ctx.body = "Hello World";
});

app.use(errorMiddleware);
app.use(cors());
app.use(bodyParser());
app.use(router.routes());
app.use(webhookRouter.routes());
app.use(configRouter.routes());
app.use(llmRouter.routes());
app.use(userRouter.routes());
app.use(commonRouter.routes());
app.use(presetRouter.routes());
app.use(recocderRouter.routes());
app.use(biliRouter.routes());
app.use(taskRouter.routes());

// sse
app.use(
  SSERouter.use(
    sse({
      maxClients: 5000,
      pingInterval: 30000,
    }),
  ).routes(),
);

export function serverStart(
  options: {
    port: number;
    host: string;
  },
  axContainer: AwilixContainer,
) {
  container = axContainer;

  config = container.resolve<GlobalConfig>("globalConfig");
  appConfig = container.resolve<AppConfig>("appConfig");
  handler = new WebhookHandler(appConfig);

  app.listen(options.port, options.host, () => {
    console.log(`Server is running at http://${options.host}:${options.port}`);
  });
  return app;
}
