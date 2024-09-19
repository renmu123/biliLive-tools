import Router from "koa-router";
import { appConfig } from "../index.js";

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
  // @ts-ignore
  appConfig.set(data.key, data.value);
  ctx.body = "success";
});

export default router;
