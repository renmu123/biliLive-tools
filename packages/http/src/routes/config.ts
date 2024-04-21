import Router from "koa-router";
import { appConfig } from "@biliLive-tools/shared";

import { globalConfig } from "../index";

const router = new Router({
  prefix: "/config",
});

router.get("/all", async (ctx) => {
  appConfig.load(globalConfig.configPath);
  const config = appConfig.getAll();
  ctx.body = config;
});

router.post("/save", async (ctx) => {
  const data = ctx.request.body;
  appConfig.load(globalConfig.configPath);

  ctx.body = "success";
});

export default router;
