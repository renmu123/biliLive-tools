import { exec } from "node:child_process";
import path from "node:path";
import fs from "fs-extra";
import multer from "../middleware/multer.js";

import Router from "koa-router";
import {
  formatTitle,
  getTempPath,
  uuid,
  formatPartTitle,
} from "@biliLive-tools/shared/utils/index.js";
import { readXmlTimestamp, parseMeta } from "@biliLive-tools/shared/task/video.js";
import { genTimeData } from "@biliLive-tools/shared/danmu/hotProgress.js";
import { parseDanmu } from "@biliLive-tools/shared/danmu/index.js";
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
      filename: "文件名",
    },
    template,
  );
  ctx.body = title;
});

router.post("/formatPartTitle", async (ctx) => {
  const data = ctx.request.body as {
    template: string;
  };
  const template = (data.template || "") as string;

  const title = formatPartTitle(
    {
      title: "标题",
      username: "主播名",
      time: new Date().toISOString(),
      roomId: 123456,
      filename: "文件名",
      index: 1,
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
  const allFiles = filterExts.length === 0 || filterExts.includes(".*");

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

router.post("/readAss", async (ctx) => {
  const { filepath } = ctx.request.body as {
    filepath: string;
  };
  if (!filepath.endsWith(".ass")) {
    ctx.status = 400;
    ctx.body = "文件不是ass格式";
    return;
  }
  if (!(await fs.pathExists(filepath))) {
    ctx.status = 400;
    ctx.body = "文件不存在";
    return;
  }
  const content = await fs.readFile(filepath, "utf-8");
  ctx.body = content;
});

router.post("/genTimeData", async (ctx) => {
  const { filepath } = ctx.request.body as {
    filepath: string;
  };
  const data = await genTimeData(filepath);
  ctx.body = data;
});

// 视频ID管理，用于临时访问授权
const videoPathMap = new Map<string, { path: string; expireAt: number }>();

// 定期清理过期的视频ID
setInterval(
  () => {
    const now = Date.now();
    for (const [id, info] of videoPathMap.entries()) {
      if (info.expireAt < now) {
        videoPathMap.delete(id);
      }
    }
  },
  60 * 60 * 1000,
); // 每小时清理一次

// 申请视频ID接口
router.post("/apply-video-id", async (ctx) => {
  const { videoPath } = ctx.request.body as { videoPath: string };

  if (!(await fs.pathExists(videoPath))) {
    ctx.status = 404;
    ctx.body = { error: "视频文件不存在" };
    return;
  }

  // 获取文件扩展名并检查是否为视频格式
  const extname = path.extname(videoPath).toLowerCase();
  const allowedExtensions = [".mp4", ".flv", ".m4s", ".ts", ".mkv", ".webm", ".avi", ".mov"];

  if (!allowedExtensions.includes(extname)) {
    ctx.status = 403;
    ctx.body = { error: "只能访问视频文件" };
    return;
  }

  // 检查文件的MIME类型
  try {
    const stat = await fs.stat(videoPath);

    // 检查是否是文件而非目录
    if (!stat.isFile()) {
      ctx.status = 403;
      ctx.body = { error: "请求的路径不是文件" };
      return;
    }

    // 检查文件大小，确保是有效文件
    if (stat.size === 0) {
      ctx.status = 403;
      ctx.body = { error: "文件大小为0，无效视频" };
      return;
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: "文件检查失败" };
    return;
  }

  // 生成唯一ID
  const videoId = uuid();

  // 24小时过期
  const expireAt = Date.now() + 24 * 60 * 60 * 1000;

  // 存储ID和视频路径的映射关系
  videoPathMap.set(videoId, { path: videoPath, expireAt });

  let type = "";
  switch (extname) {
    case ".flv":
      type = "flv";
      break;
    case ".ts":
      type = "ts";
      break;
  }

  ctx.body = {
    videoId,
    expireAt,
    type,
  };
});

router.get("/video/:videoId", async (ctx) => {
  const videoId = ctx.params.videoId;

  // 从映射表中获取视频路径
  const videoInfo = videoPathMap.get(videoId);

  if (!videoInfo) {
    ctx.status = 404;
    ctx.body = "视频ID无效或已过期";
    return;
  }

  const videoPath = videoInfo.path;

  if (!(await fs.pathExists(videoPath))) {
    ctx.status = 404;
    ctx.body = "视频文件不存在";
    return;
  }

  // 获取文件扩展名并确定正确的Content-Type
  const extname = path.extname(videoPath).toLowerCase();
  let contentType = "video/mp4"; // 默认类型

  // 设置不同格式的Content-Type
  switch (extname) {
    case ".mp4":
      contentType = "video/mp4";
      break;
    case ".flv":
      contentType = "video/x-flv";
      break;
    case ".m4s":
      contentType = "video/iso.segment";
      break;
    case ".ts":
      contentType = "video/mp2t";
      break;
    case ".mkv":
      contentType = "video/x-matroska";
      break;
    case ".webm":
      contentType = "video/webm";
      break;
    default:
      contentType = "application/octet-stream"; // 未知类型默认为二进制流
      break;
  }

  const stat = await fs.stat(videoPath);
  const fileSize = stat.size;
  const range = ctx.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": contentType,
    };
    ctx.res.writeHead(206, head);
    ctx.body = file;
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": contentType,
    };
    ctx.res.writeHead(200, head);
    ctx.body = fs.createReadStream(videoPath);
  }
});

router.post("/parseDanmu", async (ctx) => {
  const { filepath } = ctx.request.body as {
    filepath: string;
  };
  const data = await parseDanmu(filepath);
  ctx.body = data;
});

export default router;
