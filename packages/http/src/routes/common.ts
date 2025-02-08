import { exec } from "node:child_process";
import path from "node:path";
import fs from "fs-extra";
import multer from "../middleware/multer.js";

import Router from "koa-router";
import { formatTitle, getTempPath, uuid } from "@biliLive-tools/shared/utils/index.js";
import douyu from "@biliLive-tools/shared/task/douyu.js";
import { readXmlTimestamp, parseMeta } from "@biliLive-tools/shared/task/video.js";
import { StatisticsService } from "@biliLive-tools/shared/db/service/index.js";

import { config } from "../index.js";

const router = new Router({
  prefix: "/common",
});
const upload = multer({ dest: getTempPath() });

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

router.post("/fileJoin", async (ctx) => {
  const { dir, name } = ctx.request.body as {
    dir: string;
    name: string;
  };
  if (!fs.existsSync(dir)) {
    ctx.status = 400;
    ctx.body = "文件夹不存在";
    return;
  }
  const filePath = path.join(dir, name);
  ctx.body = filePath;
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
  const { decodeData, options } = ctx.request.body as {
    decodeData: any;
    options: any;
  };
  const { taskId } = await douyu.download(
    path.join(options.savePath, options.name),
    decodeData,
    options,
  );
  ctx.body = { taskId: taskId };
});

router.post("/danma/timestamp", async (ctx) => {
  const { filepath } = ctx.request.body as {
    filepath: string;
  };

  ctx.body = await readXmlTimestamp(filepath);
});

router.post("/parseMeta", async (ctx) => {
  const files = ctx.request.body as {
    videoFilePath?: string;
    danmaFilePath?: string;
  };

  ctx.body = await parseMeta(files);
});

/**
 * @api {get} /common/fonts 获取系统字体列表
 */
router.get("/fonts", async (ctx) => {
  const { getFontsList } = await import("@biliLive-tools/shared/utils/fonts.js");
  ctx.body = await getFontsList();
});

router.post("/cover/upload", upload.single("file"), async (ctx) => {
  const file = ctx.request?.file?.path as string;
  if (!file) {
    ctx.status = 400;
    ctx.body = "No file selected";
    return;
  }
  const originalname = ctx.request?.file?.originalname as string;
  const ext = path.extname(originalname);

  const coverPath = path.join(config.userDataPath, "cover");
  const outputName = `${uuid()}${ext}`;
  // 将图片复制到指定目录
  await fs.ensureDir(coverPath);
  await fs.copyFile(file, path.join(coverPath, outputName));
  await fs.remove(file).catch(() => {});
  ctx.body = {
    name: outputName,
    path: `/assets/cover/${outputName}`,
  };
});

router.get("/appStartTime", async (ctx) => {
  const data = StatisticsService.query("start_time");
  ctx.body = data?.value;
});

router.get("/exportLogs", async (ctx) => {
  const logFilePath = config.logPath;
  ctx.body = fs.createReadStream(logFilePath);
});

export default router;
