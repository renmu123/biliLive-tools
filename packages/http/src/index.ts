import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import { init } from "@biliLive-tools/shared";

import webhookRouter from "./routes/webhook.js";
import configRouter from "./routes/config.js";

const app = new Koa();
const router = new Router();

router.get("/", async (ctx) => {
  ctx.body = "Hello World11";
});

app.use(bodyParser());
app.use(router.routes());
app.use(webhookRouter.routes());
app.use(configRouter.routes());

export const globalConfig = {
  port: 3000,
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
};

export function serverStart(config: Partial<typeof globalConfig> = {}) {
  Object.assign(globalConfig, config);

  init(globalConfig);

  app.listen(globalConfig.port, () => {
    console.log("Server is running at http://localhost:3000");
  });
  console.log("Server is running at http://localhost:3000");
}

serverStart();
