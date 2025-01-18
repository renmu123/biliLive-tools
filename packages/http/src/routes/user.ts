import Router from "koa-router";
import biliService from "@biliLive-tools/shared/task/bili.js";

const router = new Router({
  prefix: "/user",
});

router.get("/list", async (ctx) => {
  const list = biliService.readUserList();

  ctx.body = list.map((item) => {
    return {
      uid: item.mid,
      name: item.name,
      face: item.avatar,
      expires: item.expires,
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

router.post("/update_auth", async (ctx) => {
  const { uid } = ctx.request.body as { uid: number };
  await biliService.updateAuth(uid);
  ctx.status = 200;
});

export default router;
