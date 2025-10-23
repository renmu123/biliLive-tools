import Router from "@koa/router";

// import type { RecorderAPI } from "../types/recorder.js";
import { getInfo, getStream } from "@bililive-tools/douyin-recorder/stream.js";
import { provider } from "@bililive-tools/douyin-recorder/index.js";
import { title } from "process";
import { format } from "path";

const router = new Router({
  prefix: "/bgo",
});

router.get("/channel-info", async (ctx) => {
  const { url } = ctx.request.query;
  const info = await provider.resolveChannelInfoFromURL(url as string);
  ctx.body = info;
});

router.get("/live-info", async (ctx) => {
  const { roomId, platform, dev } = ctx.request.query;
  if (platform !== "douyin") {
    ctx.body = { error: "Platform not supported" };
    ctx.status = 400;
    return;
  }
  try {
    const info = await getInfo(roomId as string, { api: "balance" });
    const body = {
      title: info.title,
      owner: info.owner,
      living: info.living
    };
    if (dev) {
      body["dev"] = info;
    }
    ctx.body = body;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: (error as Error).message };
  }
});

router.get("/stream-info", async (ctx) => {
  const { roomId, platform, dev } = ctx.request.query;
  if (platform !== "douyin") {
    ctx.body = { error: "Platform not supported" };
    ctx.status = 400;
    return;
  }
  try {
    const info = await getStream({
      channelId: roomId as string,
      quality: 0,
      streamPriorities: [],
      sourcePriorities: [],
      formatPriorities: ["flv"],
    });
    const body = { stream: info.currentStream.url };
    if (dev) {
      body["dev"] = info;
    }
    ctx.body = body;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: (error as Error).message };
  }
});

export default router;
