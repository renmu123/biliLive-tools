import Router from "koa-router";
import { appConfig, container } from "../index.js";
import { _send } from "@biliLive-tools/shared/notify.js";

import type { GlobalConfig } from "@biliLive-tools/types";

const router = new Router({
  prefix: "/config",
});

router.get("/", async (ctx) => {
  const config = appConfig.getAll();
  ctx.body = config;
});

router.post("/", async (ctx) => {
  const data = ctx.request.body;
  // @ts-ignore
  appConfig.setAll(data);
  ctx.body = "success";
});

router.post("/set", async (ctx) => {
  const data = ctx.request.body;
  if (!data.key || !data.value) {
    ctx.body = "key and value is required";
    return;
  }
  // @ts-ignore
  appConfig.set(data.key, data.value);
  ctx.body = "success";
});

router.post("/resetBin", async (ctx) => {
  const data = ctx.request.body;
  const type = data.type;
  if (!type) {
    ctx.body = "type is required";
    return;
  }

  const globalConfig = container.resolve<GlobalConfig>("globalConfig");

  if (type === "ffmpeg") {
    ctx.body = globalConfig.defaultFfmpegPath;
  } else if (type === "ffprobe") {
    ctx.body = globalConfig.defaultFfprobePath;
  } else if (type === "danmakuFactory") {
    ctx.body = globalConfig.defaultDanmakuFactoryPath;
  } else {
    ctx.body = "type should be ffmpeg, ffprobe or danmakuFactory";
  }
});

router.post("/notifyTest", async (ctx) => {
  const { title, desp, options } = ctx.request.body;
  await _send(title, desp, options);
  ctx.body = "success";
});

export default router;
