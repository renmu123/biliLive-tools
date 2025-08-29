import os from "node:os";
import path from "node:path";

import fs from "fs-extra";
import Router from "koa-router";

import {
  addSyncTask,
  isLogin,
  baiduPCSLogin,
  aliyunpanLogin,
  pan123Login,
} from "@biliLive-tools/shared/task/sync.js";

import type { SyncType } from "@biliLive-tools/types";

const router = new Router({
  prefix: "/sync",
});

async function uploadTest(params: {
  remoteFolder: string;
  type: SyncType;
  execPath?: string;
  apiUrl?: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
}) {
  // 在临时文件新建一个文件，内容为"biliLive-tools"
  const tempFilePath = path.join(os.tmpdir(), "biliLive-tools-upload-test.txt");
  await fs.writeFile(tempFilePath, "biliLive-tools");
  return new Promise(async (resolve, reject) => {
    const task = await addSyncTask({
      input: tempFilePath,
      remotePath: params.remoteFolder,
      execPath: params.execPath,
      retry: 0,
      policy: "overwrite",
      type: params.type,
      apiUrl: params.apiUrl,
      username: params.username,
      password: params.password,
      clientId: params.clientId,
      clientSecret: params.clientSecret,
    });
    task.on("task-end", (data) => {
      console.log("task-end", data);
      fs.unlink(tempFilePath);
      resolve(data);
    });
    task.on("task-error", (data) => {
      console.log("task-error", data);
      fs.unlink(tempFilePath);
      reject(data);
    });
  });
}

// 测试上传
router.post("/uploadTest", async (ctx) => {
  const params = ctx.request.body;
  // @ts-ignore
  try {
    await uploadTest(params);
    ctx.status = 200;
  } catch (error) {
    ctx.body = "上传失败";
    ctx.status = 500;
  }
});

router.post("/baiduPCSLogin", async (ctx) => {
  const params = ctx.request.body;
  // @ts-ignore
  const { cookie, execPath } = params;

  if (!cookie) {
    ctx.status = 400;
    ctx.body = "Cookie不能为空";
    return;
  }

  try {
    const success = await baiduPCSLogin({ cookie, execPath });
    ctx.body = success ? "登录成功" : "登录失败";
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = `登录失败: ${error.message}`;
  }
});

router.post("/pan123Login", async (ctx) => {
  const params = ctx.request.body;
  // @ts-ignore
  const { clientId, clientSecret } = params;

  if (!clientId || !clientSecret) {
    ctx.status = 400;
    ctx.body = "clientId和clientSecret不能为空";
    return;
  }

  try {
    const success = await pan123Login({ clientId, clientSecret });
    ctx.body = success ? "登录成功" : "登录失败";
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = `登录失败: ${error.message}`;
  }
});

router.get("/isLogin", async (ctx) => {
  const params = ctx.request.query;
  // @ts-ignore
  const { execPath, type, apiUrl, username, password, clientId, clientSecret } = params;
  const status = await isLogin({
    execPath: execPath as string,
    type: type as SyncType,
    apiUrl: apiUrl as string,
    username: username as string,
    password: password as string,
    clientId: clientId as string,
    clientSecret: clientSecret as string,
  });
  ctx.body = status;
});

router.get("/aliyunpanLogin", async (ctx) => {
  const params = ctx.request.query;
  // @ts-ignore
  const { execPath, type } = params;
  try {
    const content = await aliyunpanLogin({
      execPath: execPath as string,
      type: type as "getUrl" | "cancel" | "confirm",
    });
    ctx.body = content;
  } catch (error: any) {
    ctx.body = `${error?.message}`;
    ctx.status = 500;
  }
});

router.post("/sync", async (ctx) => {
  const params = ctx.request.body;
  // @ts-ignore
  const { file, type, options, targetPath } = params;
  const task = await addSyncTask({
    input: file,
    type: type as SyncType,
    removeOrigin: options.removeOrigin,
    remotePath: targetPath,
  });
  ctx.body = task.taskId;
});

export default router;
