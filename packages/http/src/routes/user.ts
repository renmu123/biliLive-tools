import Router from "koa-router";
import { appConfig } from "../index.js";
import biliService from "@biliLive-tools/shared/task/bili.js";

import type { BiliUser } from "@biliLive-tools/types";

const router = new Router({
  prefix: "/user",
});

router.get("/list", async (ctx) => {
  const users = appConfig.getAll().biliUser || {};
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

router.post("/delete", async (ctx) => {
  const { uid } = ctx.request.body as { uid: number };
  await biliService.deleteUser(uid);
  ctx.status = 200;
});

router.post("/update", async (ctx) => {
  const { uid } = ctx.request.body as { uid: number };
  await biliService.updateUserInfo(uid);
  ctx.status = 200;
});

export default router;
