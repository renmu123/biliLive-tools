import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import { init } from "@biliLive-tools/shared";
import { taskQueue as _taskQueue } from "@biliLive-tools/shared/lib/task/task.js";
import errorMiddleware from "./middleware/error.js";

import webhookRouter from "./routes/webhook.js";
import configRouter from "./routes/config.js";

const app = new Koa();
const router = new Router();

router.get("/", async (ctx) => {
  ctx.body = "Hello World11";
});

app.use(errorMiddleware);
app.use(bodyParser());
app.use(router.routes());
app.use(webhookRouter.routes());
app.use(configRouter.routes());

export let taskQueue: typeof _taskQueue;

export const globalConfig: {
  port: number;
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
  configPath: "C:\\Users\\renmu\\AppData\\Roaming\\biliLive-tools\\appConfig.json",
  ffmpegPath:
    "C:\\Users\\renmu\\AppData\\Local\\Programs\\biliLive-tools\\resources\\app.asar.unpacked\\resources\\bin\\ffmpeg.exe",
  ffprobePath:
    "C:\\Users\\renmu\\AppData\\Local\\Programs\\biliLive-tools\\resources\\app.asar.unpacked\\resources\\bin\\ffprobe.exe",
  danmakuFactoryPath:
    "C:\\Users\\renmu\\AppData\\Local\\Programs\\biliLive-tools\\resources\\app.asar.unpacked\\resources\\bin\\DanmakuFactory.exe",
  logPath: "C:\\Users\\renmu\\AppData\\Roaming\\biliLive-tools\\logs\\main.log",
  downloadPath: "C:\\Users\\renmu\\Downloads",
  ffmpegPresetPath: "C:\\Users\\renmu\\AppData\\Roaming\\biliLive-tools\\ffmpeg_presets.json",
  videoPresetPath: "C:\\Users\\renmu\\AppData\\Roaming\\biliLive-tools\\presets.json",
  danmuPresetPath: "C:\\Users\\renmu\\AppData\\Roaming\\biliLive-tools\\danmu_presets.json",
  taskQueue: _taskQueue,
};

export function serverStart(config: Partial<typeof globalConfig> = {}) {
  Object.assign(globalConfig, config);
  taskQueue = globalConfig.taskQueue;

  init(globalConfig);

  app.listen(globalConfig.port, () => {
    console.log(`Server is running at http://localhost:${globalConfig.port}`);
  });
  return app;
}

// serverStart();
