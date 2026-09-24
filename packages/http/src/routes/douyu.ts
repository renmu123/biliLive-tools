import Router from "@koa/router";
import crypto from "node:crypto";

import {
  deleteDouyuUser,
  DouyuQrcodeLogin,
  readDouyuUserList,
  writeDouyuUser,
} from "@biliLive-tools/shared/recorder/douyu.js";

const router = new Router({ prefix: "/douyu" });
const sessions = new Map<string, DouyuQrcodeLogin>();

const purgeExpiredSessions = () => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (session.expiresAt <= now) {
      session.cancel();
      sessions.delete(id);
    }
  }
};

router.post("/login", async (ctx) => {
  purgeExpiredSessions();
  const session = await DouyuQrcodeLogin.create();
  const id = crypto.randomUUID();
  sessions.set(id, session);
  ctx.body = { id, url: session.url, expiresAt: session.expiresAt };
});

router.get("/login/poll", async (ctx) => {
  const id = String(ctx.query.id || "");
  if (!id) {
    ctx.status = 400;
    ctx.body = "id required";
    return;
  }
  const session = sessions.get(id);
  if (!session) {
    ctx.status = 400;
    ctx.body = "login info not found";
    return;
  }
  const result = await session.poll();
  if (result.status === "completed") {
    writeDouyuUser(result.user);
    sessions.delete(id);
    ctx.body = { status: "completed" };
    return;
  }
  if (result.status === "error") sessions.delete(id);
  ctx.body = result;
});

router.post("/login/cancel", async (ctx) => {
  const { id } = ctx.request.body as { id?: string };
  if (!id) {
    ctx.status = 400;
    ctx.body = "id required";
    return;
  }
  const session = sessions.get(id);
  if (!session) {
    ctx.status = 400;
    ctx.body = "login info not found";
    return;
  }
  session.cancel();
  sessions.delete(id);
  ctx.body = "success";
});

router.get("/user/list", (ctx) => {
  ctx.body = readDouyuUserList().map(({ uid, name, avatar }) => ({ uid, name, avatar }));
});

router.post("/user/delete", (ctx) => {
  const uid = Number((ctx.request.body as { uid?: number }).uid);
  if (!Number.isSafeInteger(uid) || uid <= 0) {
    ctx.status = 400;
    ctx.body = "valid uid required";
    return;
  }
  deleteDouyuUser(uid);
  ctx.body = "success";
});

export default router;
