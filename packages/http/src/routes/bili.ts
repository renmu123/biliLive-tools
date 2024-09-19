import Router from "koa-router";
import { biliApi, validateBiliupConfig } from "@biliLive-tools/shared/task/bili.js";

const router = new Router({
  prefix: "/bili",
});

// 验证视频上传参数
router.post("/validUploadParams", async (ctx) => {
  const params = ctx.request.body;
  // @ts-ignore
  const [status, msg] = validateBiliupConfig(params);
  if (status) {
    ctx.body = "success";
    return;
  }
  ctx.body = msg;
  ctx.status = 400;
});

router.get("/archives", async (ctx) => {
  const params = ctx.request.query;
  const { uid } = params;
  // @ts-ignore
  const data = biliApi.getArchives(params, uid);
  ctx.body = data;
});

router.get("/archive/:id", async (ctx) => {
  const params = ctx.request.query;
  const { bvid, uid } = params;
  // @ts-ignore
  const data = biliApi.getArchiveDetail(bvid, uid);
  ctx.body = data;
});

router.post("/checkTag", async (ctx) => {
  // @ts-ignore
  const { tag, uid } = ctx.request.body;
  // @ts-ignore
  const data = biliApi.checkTag(tag, uid);
  ctx.body = data;
});

router.get("/searchTopic", async (ctx) => {
  // @ts-ignore
  const { keyword, uid } = ctx.request.query;
  // @ts-ignore
  const data = biliApi.searchTopic(keyword, uid);
  ctx.body = data;
});

router.get("/seasons", async (ctx) => {
  // @ts-ignore
  const { uid } = ctx.request.query;
  // @ts-ignore
  const data = biliApi.getSeasonList(uid);
  ctx.body = data;
});
router.get("/season/:id", async (ctx) => {
  // @ts-ignore
  const { aid, uid } = ctx.request.query;
  // @ts-ignore
  const data = biliApi.getSessionId(aid, uid);
  ctx.body = data;
});

router.get("/platformArchiveDetail", async (ctx) => {
  // @ts-ignore
  const { aid, uid } = ctx.request.query;
  // @ts-ignore
  const data = biliApi.getPlatformArchiveDetail(aid, uid);
  ctx.body = data;
});
router.get("/platformPre", async (ctx) => {
  // @ts-ignore
  const { uid } = ctx.request.query;
  // @ts-ignore
  const data = biliApi.getPlatformPre(uid);
  ctx.body = data;
});
router.get("/typeDesc", async (ctx) => {
  // @ts-ignore
  const { tid, uid } = ctx.request.query;
  // @ts-ignore
  const data = biliApi.getTypeDesc(tid, uid);
  ctx.body = data;
});

export default router;
