import os from "node:os";
import path from "node:path";

import fs from "fs-extra";
import Router from "koa-router";

import {
  addSyncTask,
  isLogin,
  loginByCookie,
  aliyunpanLogin,
} from "@biliLive-tools/shared/task/sync.js";

const router = new Router({
  prefix: "/sync",
});

async function uploadTest(params: {
  remoteFolder: string;
  execPath: string;
  type: "baiduPCS" | "aliyunpan";
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

router.post("/loginByCookie", async (ctx) => {
  const params = ctx.request.body;
  // @ts-ignore
  const { cookie, execPath } = params;

  if (!cookie) {
    ctx.status = 400;
    ctx.body = "Cookie不能为空";
    return;
  }

  try {
    const success = await loginByCookie({ cookie, execPath });
    ctx.body = success ? "登录成功" : "登录失败";
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = `登录失败: ${error.message}`;
  }
});

router.get("/isLogin", async (ctx) => {
  const params = ctx.request.query;
  // @ts-ignore
  const { execPath, type } = params;
  const status = await isLogin({
    execPath: execPath as string,
    type: type as "baiduPCS" | "aliyunpan",
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

export default router;
