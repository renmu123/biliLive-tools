import Koa from "koa";
import Router from "koa-router";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import { init } from "@biliLive-tools/shared";
import { taskQueue as _taskQueue } from "@biliLive-tools/shared/lib/task/task.js";
import errorMiddleware from "./middleware/error.js";

import webhookRouter from "./routes/webhook.js";
import configRouter from "./routes/config.js";
import llmRouter from "./routes/llm.js";

const app = new Koa();
const router = new Router();

router.get("/", async (ctx) => {
  ctx.body = "Hello World11";
});

app.use(errorMiddleware);
app.use(cors());
app.use(bodyParser());
app.use(router.routes());
app.use(webhookRouter.routes());
app.use(configRouter.routes());
app.use(llmRouter.routes());

export let taskQueue: typeof _taskQueue = _taskQueue;

export const globalConfig: {
  port: number;
  host: string;
  configPath: string;
  ffmpegPath: string;
  ffprobePath: string;
  danmakuFactoryPath: string;
  logPath: string;
  downloadPath: string;
  ffmpegPresetPath: string;
  videoPresetPath: string;
  danmuPresetPath: string;
  taskQueue: typeof _taskQueue;
} = {
  port: 18010,
  host: "127.0.0.1",
  configPath: "",
  ffmpegPath: "ffmpeg.exe",
  ffprobePath: "ffprobe.exe",
  danmakuFactoryPath: "DanmakuFactory.exe",
  logPath: "main.log",
  downloadPath: "",
  ffmpegPresetPath: "",
  videoPresetPath: "",
  danmuPresetPath: "",
  taskQueue: _taskQueue,
};

export function serverStart(config: typeof globalConfig, autoInit = false) {
  Object.assign(globalConfig, config);
  taskQueue = globalConfig.taskQueue;

  if (autoInit) {
    init(globalConfig);
  }

  app.listen(globalConfig.port, globalConfig.host, () => {
    console.log(`Server is running at http://${globalConfig.host}:${globalConfig.port}`);
  });
  return app;
}

// serverStart();
