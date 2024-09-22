import Router from "koa-router";
import { biliApi, validateBiliupConfig } from "@biliLive-tools/shared/task/bili.js";
import { TvQrcodeLogin } from "@renmu/bili-api";
import { v4 as uuid } from "uuid";
import { omit } from "lodash-es";

const router = new Router({
  prefix: "/bili",
});

// 验证视频上传参数
router.post("/validUploadParams", async (ctx) => {
  const params = ctx.request.body;
  // @ts-ignore
  const [status, msg] = await validateBiliupConfig(params);
  if (status) {
    ctx.body = "success";
    return;
  }
  ctx.body = msg;
  ctx.status = 400;
});

/**
 * 投稿中心视频列表
 */
router.get("/archives", async (ctx) => {
  const params = ctx.request.query as unknown as { pn: number; ps: number; uid: number };
  const { uid } = params;
  const data = await biliApi.getArchives(params, uid);
  ctx.body = data;
});

/**
 * 用户视频详情
 */
router.get("/user/archive/:bvid", async (ctx) => {
  const params = ctx.request.query;
  const { uid } = params;
  const { bvid } = ctx.params;
  // @ts-ignore
  const data = await biliApi.getArchiveDetail(bvid, uid);
  ctx.body = data;
});

router.post("/checkTag", async (ctx) => {
  // @ts-ignore
  const { tag, uid } = ctx.request.body;
  // @ts-ignore
  const data = await biliApi.checkTag(tag, uid);
  ctx.body = data;
});

router.get("/searchTopic", async (ctx) => {
  const { keyword, uid } = ctx.request.query;
  // @ts-ignore
  const data = await biliApi.searchTopic(keyword, uid);
  ctx.body = data;
});

router.get("/seasons", async (ctx) => {
  const { uid } = ctx.request.query;
  // @ts-ignore
  const data = await biliApi.getSeasonList(uid);
  ctx.body = data;
});
router.get("/season/:aid", async (ctx) => {
  const { uid } = ctx.request.query;
  const { aid } = ctx.params;
  // @ts-ignore
  const data = await biliApi.getSessionId(aid, uid);
  ctx.body = data;
});

router.get("/platformArchiveDetail", async (ctx) => {
  const { aid, uid } = ctx.request.query;
  // @ts-ignore
  const data = await biliApi.getPlatformArchiveDetail(aid, uid);
  ctx.body = data;
});
router.get("/platformPre", async (ctx) => {
  const { uid } = ctx.request.query;
  // @ts-ignore
  const data = await biliApi.getPlatformPre(uid);
  ctx.body = data;
});
router.get("/typeDesc", async (ctx) => {
  const { tid, uid } = ctx.request.query;
  // @ts-ignore
  const data = await biliApi.getTypeDesc(tid, uid);
  ctx.body = data;
});

router.post("/download", async (ctx) => {
  // @ts-ignore
  const { options, uid } = ctx.request.body;
  // @ts-ignore
  const data = await biliApi.download(options, uid);
  ctx.body = data;
});

// 登录相关
const loginObj: {
  [id: string]: {
    client: TvQrcodeLogin;
    res: string;
    status: "scan" | "completed" | "error";
    failReason: string;
  };
} = {};
router.post("/login", async (ctx) => {
  const tv = new TvQrcodeLogin();
  const id = uuid();
  loginObj[id] = {
    client: tv,
    res: "",
    status: "scan",
    failReason: "",
  };
  tv.on("error", (res) => {
    console.log("error", res);
    loginObj[id].res = JSON.stringify(res);
    loginObj[id].failReason = res.message;
    loginObj[id].status = "error";
  });
  tv.on("scan", (res) => {
    console.log("scan", res);
    loginObj[id].res = JSON.stringify(res);
    loginObj[id].status = "scan";
  });
  tv.on("completed", async (res) => {
    loginObj[id].res = JSON.stringify(res);
    loginObj[id].status = "completed";

    console.log("completed", res);
    const data = res.data;
    await biliApi.addUser(data);
  });
  const url = await tv.login();

  ctx.body = {
    url,
    id,
  };
});

router.post("/login/cancel", async (ctx) => {
  const { id } = ctx.request.body;
  if (!id) {
    ctx.body = "id required";
    ctx.status = 400;
    return;
  }
  const loginInfo = loginObj[id];
  if (!loginInfo) {
    ctx.body = "login info not found";
    ctx.status = 400;
    return;
  }
  const tv = loginInfo.client;
  tv.interrupt();
  ctx.body = "success";
});

router.get("/login/poll", async (ctx) => {
  const { id } = ctx.request.query as unknown as { id: string };
  if (!id) {
    ctx.body = "id required";
    ctx.status = 400;
    return;
  }
  const loginInfo = loginObj[id];
  if (!loginInfo) {
    ctx.body = "login info not found";
    ctx.status = 400;
    return;
  }

  ctx.body = omit(loginInfo, ["client"]);
});

export default router;
