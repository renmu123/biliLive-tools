import Koa from "koa";
import Router from "koa-router";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import sse from "koa-sse-stream";
import { AppConfig } from "@biliLive-tools/shared";

import errorMiddleware from "./middleware/error.js";
import webhookRouter from "./routes/webhook.js";
import configRouter from "./routes/config.js";
import llmRouter from "./routes/llm.js";
import commonRouter from "./routes/common.js";
import userRouter from "./routes/user.js";
import SSERouter from "./routes/sse.js";
import { WebhookHandler } from "./services/webhook.js";

import type { GlobalConfig } from "@biliLive-tools/types";
import type { AwilixContainer } from "awilix";

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
app.use(
  sse({
    maxClients: 5000,
    pingInterval: 30000,
  }),
);
app.use(SSERouter.routes());

app.use(commonRouter.routes());

export function serverStart(
  options: {
    port: number;
    host: string;
  },
  iConfig: GlobalConfig,
  axContainer: AwilixContainer,
) {
  if (iConfig) config = iConfig;
  appConfig = new AppConfig(config.configPath);
  handler = new WebhookHandler(appConfig);
  container = axContainer;

  app.listen(options.port, options.host, () => {
    console.log(`Server is running at http://${options.host}:${options.port}`);
  });
  return app;
}

// serverStart();
