import Router from "@koa/router";
import biliService from "@biliLive-tools/shared/task/bili.js";
import crypto from "crypto";
import type { BiliUser } from "@biliLive-tools/types";

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

router.post("/get_cookie", async (ctx) => {
  const { uid, timestamp, signature } = ctx.request.body as {
    uid: number;
    timestamp: number;
    signature: string;
  };
  const currentTimestamp = Math.floor(Date.now() / 1000);

  if (Math.abs(currentTimestamp - timestamp) > 10) {
    ctx.status = 400;
    ctx.body = "请求超时";
    return;
  }

  const secret = "r96gkr8ahc34fsrewr34";
  const hash = crypto.createHmac("sha256", secret).update(`${uid}${timestamp}`).digest("hex");

  if (hash !== signature) {
    ctx.status = 400;
    ctx.body = "签名无效";
    return;
  }

  try {
    const data = await biliService.getBuvidConf();
    const buvid = data.data.b_3;

    const obj = biliService.getCookie(uid);
    const cookie = Object.entries(obj)
      .map(([key, value]) => {
        return `${key}=${value}`;
      })
      .join("; ");
    ctx.body = `${cookie}; buvid3=${buvid}`;
  } catch (error) {
    ctx.status = 500;
    ctx.body = "获取失败，请重试";
  }
});

router.get("/export", async (ctx) => {
  const list = biliService.readUserList();
  ctx.body = list;
});

router.post("/export_single", async (ctx) => {
  const { uid } = ctx.request.body as { uid: number };
  const user = biliService.readUser(uid);
  if (!user) {
    ctx.status = 404;
    ctx.body = "用户不存在";
    return;
  }
  ctx.body = user;
});

router.post("/import", async (ctx) => {
  const { users } = ctx.request.body as { users: BiliUser[] };
  if (!Array.isArray(users)) {
    ctx.status = 400;
    ctx.body = "参数错误";
    return;
  }

  for (const item of users) {
    if (!item?.mid || !item?.accessToken || !item?.refreshToken || !item?.cookie) {
      ctx.status = 400;
      ctx.body = "账号数据不完整";
      return;
    }
    await biliService.writeUser(item);
  }
  ctx.status = 200;
});

router.post("/import_single", async (ctx) => {
  const { user } = ctx.request.body as { user: BiliUser };
  if (!user?.mid || !user?.accessToken || !user?.refreshToken || !user?.cookie) {
    ctx.status = 400;
    ctx.body = "账号数据不完整";
    return;
  }
  await biliService.writeUser(user);
  ctx.status = 200;
});

export default router;
