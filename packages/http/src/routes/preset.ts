import Router from "koa-router";
import { container } from "../index.js";

import type { DanmuPreset } from "@biliLive-tools/shared";

const router = new Router({
  prefix: "/preset",
});

router.get("/danmu", async (ctx) => {
  const danmuPreset = container.resolve<DanmuPreset>("danmuPreset");
  ctx.body = await danmuPreset.list();
});
router.get("/danmu/:id", async (ctx) => {
  const danmuPreset = container.resolve<DanmuPreset>("danmuPreset");
  ctx.body = await danmuPreset.get(ctx.params.id);
});
// router.post("/danmu/save", async (ctx) => {
//   const danmuPreset = container.resolve<DanmuPreset>("danmuPreset");
//   const data: any = ctx.request.body;
//   ctx.body = await danmuPreset.save(data);
// });
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

export default router;
