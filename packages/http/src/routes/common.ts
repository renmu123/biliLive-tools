import { exec } from "node:child_process";
import path from "node:path";
import fs from "fs-extra";

import Router from "koa-router";
import { foramtTitle } from "@biliLive-tools/shared/utils/index.js";
import douyu from "@biliLive-tools/shared/task/douyu.js";

import { config } from "../index.js";

const router = new Router({
  prefix: "/common",
});

router.post("/foramtTitle", async (ctx) => {
  const data = ctx.request.body as {
    template: string;
  };
  const template = (data.template || "") as string;

  const title = foramtTitle(
    {
      title: "标题",
      username: "主播名",
      time: new Date().toISOString(),
      roomId: 123456,
    },
    template,
  );
  ctx.body = title;
});

router.get("/version", (ctx) => {
  ctx.body = config.version;
});

function getDriveLetters(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    exec("wmic logicaldisk get name", (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${stderr}`);
        return;
      }

      // 解析输出，提取盘符
      const drives = stdout
        .split("\r\r\n")
        .filter((line) => line.trim() && line.includes(":"))
        .map((line) => line.trim());

      resolve(drives);
    });
  });
}

function isDriveLetter(letter: string): boolean {
  return /^[a-zA-Z]:\\$/.test(letter);
}

router.get("/files", async (ctx) => {
  const params = ctx.request.query;
  let root = params.path as string;
  const ext = params.ext as string;
  const type = params.type as string;
  console.log(params);

  if (root == "/" && process.platform === "win32") {
    const drives = await getDriveLetters();
    root = drives[0];
    ctx.body = {
      list: drives.map((drive) => ({ type: "directory", name: drive, path: `${drive}\\` })),
      parent: "",
    };
    return;
  }

  const extFilter = ext || null;

  try {
    const paths = await fs.readdir(root);
    let parentDir = path.dirname(root);
    if (process.platform === "win32" && isDriveLetter(root)) {
      parentDir = "/";
    }

    const data = [];
    for (const name of paths) {
      const filePath = path.join(root, name);
      try {
        const fileStat = await fs.stat(filePath);
        data.push({
          type: fileStat.isDirectory() ? "directory" : "file",
          name: name,
          path: filePath,
        });
      } catch (error) {
        continue;
      }
    }
    let files = data;
    if (type === "directory") {
      files = data.filter((item) => item.type === "directory");
    }

    ctx.body = { list: files, parent: parentDir };
  } catch (e) {
    console.error(e);
    ctx.status = 400;
    ctx.body = "Unable to scan directory";
    return;
  }
});

router.post("/douyu/parse", (ctx) => {
  const { url } = ctx.request.body as { url: string };
  const data = douyu.parseVideo(url);
  ctx.body = data;
});

router.post("/douyu/download", async (ctx) => {
  const { output, decodeData, options } = ctx.request.body as {
    output: string;
    decodeData: any;
    options: any;
  };
  const { taskId } = await douyu.download(output, decodeData, options);
  ctx.body = { taskId: taskId };
});

export default router;
