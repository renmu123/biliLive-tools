import { exec } from "node:child_process";
import path from "node:path";
import fs from "fs-extra";

import Router from "koa-router";
import { formatTitle, getFontsList } from "@biliLive-tools/shared/utils/index.js";
import douyu from "@biliLive-tools/shared/task/douyu.js";
import { readXmlTimestamp } from "@biliLive-tools/shared/task/video.js";

import { config } from "../index.js";

const router = new Router({
  prefix: "/common",
});

router.post("/formatTitle", async (ctx) => {
  const data = ctx.request.body as {
    template: string;
  };
  const template = (data.template || "") as string;

  const title = formatTitle(
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
  const filterExts = ((params.exts as string) || "")
    .split("|")
    .filter((ext) => ext)
    .map((ext) => `.${ext}`);
  const type = params.type as string;
  const allFiles = filterExts.length === 0 || filterExts.includes("*");

  if (root == "/" && process.platform === "win32") {
    const drives = await getDriveLetters();
    root = drives[0];
    ctx.body = {
      list: drives.map((drive) => ({ type: "directory", name: drive, path: `${drive}\\` })),
      parent: "",
    };
    return;
  }

  try {
    const paths = await fs.readdir(root);
    let parentDir = path.dirname(root);
    if (process.platform === "win32" && isDriveLetter(root)) {
      parentDir = "/";
    }

    const data: {
      type: "directory" | "file";
      name: string;
      path: string;
    }[] = [];
    for (const name of paths) {
      const filePath = path.join(root, name);
      try {
        const fileStat = await fs.stat(filePath);
        const type = fileStat.isDirectory() ? "directory" : "file";

        if (type === "file" && !allFiles && !filterExts.includes(path.extname(name))) {
          continue;
        }
        data.push({
          type: type,
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

router.post("/douyu/parse", async (ctx) => {
  const { url } = ctx.request.body as { url: string };
  const data = await douyu.parseVideo(url);
  ctx.body = data;
});

/**
 * @api {get} /common/download/streams 获取视频流信息
 */
router.get("/download/streams", async (ctx) => {
  const { decodeData } = ctx.request.query as { decodeData: string };
  const data: {
    value: string;
    label: string;
  }[] = (await douyu.getAvailableStreams(decodeData)).map((item) => ({
    value: item.stream_type,
    label: item.name,
  }));
  data.unshift({
    value: "highest",
    label: "最高",
  });
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

router.post("/danma/timestamp", async (ctx) => {
  const { filepath } = ctx.request.body as {
    filepath: string;
  };

  ctx.body = await readXmlTimestamp(filepath);
});

/**
 * @api {get} /common/fonts 获取系统字体列表
 */
router.get("/fonts", async (ctx) => {
  ctx.body = await getFontsList();
});

export default router;
