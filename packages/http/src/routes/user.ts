import Router from "koa-router";
import { appConfig } from "../index.js";

import type { BiliUser } from "@biliLive-tools/types";

const router = new Router({
  prefix: "/user",
});

router.get("/list", async (ctx) => {
  const users = appConfig.get("biliUser") || {};
  const list = Object.values(users) as unknown as BiliUser[];

  ctx.body = list.map((item) => {
    const expires = JSON.parse(item.rawAuth)?.cookie_info?.cookies?.find(
      (item) => item.name === "SESSDATA",
    )?.expires;
    return {
      uid: item.mid,
      name: item.name,
      face: item.avatar,
      expires,
    };
  });
});

// router.post("/delete", async (ctx) => {});

export default router;
