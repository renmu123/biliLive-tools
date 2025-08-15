import Router from "koa-router";
import { container } from "../index.js";

import type { DanmuPreset, VideoPreset, FFmpegPreset } from "@biliLive-tools/shared";
import { omit } from "lodash-es";

const router = new Router({
  prefix: "/preset",
});

////////////////// 弹幕预设 ///////////////////////////////
router.get("/danmu", async (ctx) => {
  const danmuPreset = container.resolve<DanmuPreset>("danmuPreset");
  ctx.body = await danmuPreset.list();
});
router.get("/danmu/:id", async (ctx) => {
  const danmuPreset = container.resolve<DanmuPreset>("danmuPreset");
  ctx.body = await danmuPreset.get(ctx.params.id);
});
router.post("/danmu", async (ctx) => {
  const danmuPreset = container.resolve<DanmuPreset>("danmuPreset");
  const data: any = ctx.request.body;
  ctx.body = await danmuPreset.save(data);
});
router.del("/danmu/:id", async (ctx) => {
  const danmuPreset = container.resolve<DanmuPreset>("danmuPreset");
  ctx.body = await danmuPreset.delete(ctx.params.id);
});
router.put("/danmu/:id", async (ctx) => {
  const danmuPreset = container.resolve<DanmuPreset>("danmuPreset");
  const data: any = ctx.request.body;
  ctx.body = await danmuPreset.save({ ...data, id: ctx.params.id });
});

////////////////// 视频上传预设 ///////////////////////////////
router.get("/video", async (ctx) => {
  const preset = container.resolve<VideoPreset>("videoPreset");
  ctx.body = await preset.list();
});
router.get("/video/:id", async (ctx) => {
  const preset = container.resolve<VideoPreset>("videoPreset");
  ctx.body = await preset.get(ctx.params.id);
});
router.post("/video", async (ctx) => {
  const preset = container.resolve<VideoPreset>("videoPreset");
  const data: any = ctx.request.body;

  data.config = omit(data.config, ["dtime"]);
  ctx.body = await preset.save(data);
});
router.del("/video/:id", async (ctx) => {
  const preset = container.resolve<VideoPreset>("videoPreset");
  ctx.body = await preset.delete(ctx.params.id);
});
router.put("/video/:id", async (ctx) => {
  const preset = container.resolve<VideoPreset>("videoPreset");
  const data: any = ctx.request.body;

  data.config = omit(data.config, ["dtime"]);
  ctx.body = await preset.save({ ...data, id: ctx.params.id });
});

////////////////// ffmpeg预设 ///////////////////////////////
router.get("/ffmpeg", async (ctx) => {
  const preset = container.resolve<FFmpegPreset>("ffmpegPreset");
  ctx.body = await preset.list();
});
router.get("/ffmpeg/options", async (ctx) => {
  const preset = container.resolve<FFmpegPreset>("ffmpegPreset");
  ctx.body = await preset.getFfmpegPresetOptions();
});
router.get("/ffmpeg/:id", async (ctx) => {
  const preset = container.resolve<FFmpegPreset>("ffmpegPreset");
  ctx.body = await preset.get(ctx.params.id);
});
router.post("/ffmpeg", async (ctx) => {
  const preset = container.resolve<FFmpegPreset>("ffmpegPreset");
  const data: any = ctx.request.body;
  ctx.body = await preset.save(data);
});
router.del("/ffmpeg/:id", async (ctx) => {
  const preset = container.resolve<FFmpegPreset>("ffmpegPreset");
  ctx.body = await preset.delete(ctx.params.id);
});
router.put("/ffmpeg/:id", async (ctx) => {
  const preset = container.resolve<FFmpegPreset>("ffmpegPreset");
  const data: any = ctx.request.body;
  ctx.body = await preset.save({ ...data, id: ctx.params.id });
});

export default router;
