import os from "node:os";
import path from "node:path";

import fs from "fs-extra";
import Router from "@koa/router";
import { trashItem, getTempPath, uuid } from "@biliLive-tools/shared/utils/index.js";
import { appConfig, fileCache, config } from "../index.js";
import multer from "../middleware/multer.js";

const upload = multer({ dest: os.tmpdir() });

type BrowserItem = {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  mtimeMs: number;
  canDelete: boolean;
  fileKind?: "video" | "danmaku";
};

const router = new Router({
  prefix: "/files",
});

const DELETE_DIRS_ENV = "BILILIVE_TOOLS_DELETE_DIRS";
const videoExts = new Set([".flv", ".mp4", ".ts", ".mkv", ".webm", ".m4v", ".m4s"]);
const danmakuExts = new Set([".ass", ".xml", ".srt"]);

function normalizePath(inputPath: string) {
  return path.resolve(inputPath);
}

function normalizeForCompare(inputPath: string) {
  const resolved = normalizePath(inputPath);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function isSubPath(targetPath: string, rootPath: string) {
  const normalizedTarget = normalizeForCompare(targetPath);
  const normalizedRoot = normalizeForCompare(rootPath);
  if (normalizedTarget === normalizedRoot) {
    return true;
  }
  const relative = path.relative(normalizedRoot, normalizedTarget);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function getRootPath() {
  const webhookConfig = appConfig.get("webhook");
  const recorderConfig = appConfig.get("recorder");
  const rootPath = webhookConfig?.recoderFolder || recorderConfig?.savePath;
  if (!rootPath) {
    throw new Error("未配置录制目录");
  }
  return normalizePath(rootPath);
}

function getAllowedDeleteDirs() {
  const envValue = process.env[DELETE_DIRS_ENV] || "";
  return envValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => normalizePath(item));
}

function getFileKind(filePath: string): "video" | "danmaku" | null {
  const ext = path.extname(filePath).toLowerCase();
  if (videoExts.has(ext)) {
    return "video";
  }
  if (danmakuExts.has(ext)) {
    return "danmaku";
  }
  return null;
}

function canDeleteFile(filePath: string) {
  const fileKind = getFileKind(filePath);
  if (!fileKind) {
    return false;
  }
  const allowedDeleteDirs = getAllowedDeleteDirs();
  if (allowedDeleteDirs.length === 0) {
    return false;
  }
  return allowedDeleteDirs.some((dir) => isSubPath(filePath, dir));
}

async function ensureDirectory(dirPath: string) {
  if (!(await fs.pathExists(dirPath))) {
    throw new Error("录制目录不存在");
  }
  const stat = await fs.stat(dirPath);
  if (!stat.isDirectory()) {
    throw new Error("录制目录无效");
  }
}

async function resolveBrowsePath(inputPath?: string) {
  const rootPath = getRootPath();
  await ensureDirectory(rootPath);
  const currentPath = inputPath ? normalizePath(inputPath) : rootPath;
  if (!isSubPath(currentPath, rootPath)) {
    throw new Error("访问路径超出录制目录范围");
  }
  const stat = await fs.stat(currentPath).catch(() => null);
  if (!stat || !stat.isDirectory()) {
    throw new Error("目录不存在");
  }
  return {
    rootPath,
    currentPath,
  };
}

router.get("/list", async (ctx) => {
  const inputPath = ctx.query.path as string | undefined;
  const { rootPath, currentPath } = await resolveBrowsePath(inputPath);
  const names = await fs.readdir(currentPath);
  const items: BrowserItem[] = [];

  for (const name of names) {
    const filePath = path.join(currentPath, name);
    const stat = await fs.stat(filePath).catch(() => null);
    if (!stat) {
      continue;
    }
    if (stat.isDirectory()) {
      items.push({
        name,
        path: filePath,
        type: "directory",
        mtimeMs: stat.mtimeMs,
        canDelete: false,
      });
      continue;
    }
    const fileKind = getFileKind(filePath);
    if (!fileKind) {
      continue;
    }
    items.push({
      name,
      path: filePath,
      type: "file",
      size: stat.size,
      mtimeMs: stat.mtimeMs,
      canDelete: canDeleteFile(filePath),
      fileKind,
    });
  }

  items.sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === "directory" ? -1 : 1;
    }
    return left.name.localeCompare(right.name, "zh-CN");
  });

  ctx.body = {
    rootPath,
    currentPath,
    parentPath: currentPath === rootPath ? null : path.dirname(currentPath),
    deleteEnabled: getAllowedDeleteDirs().length > 0,
    list: items,
  };
});

router.post("/download", async (ctx) => {
  const { path: filePath } = ctx.request.body as { path?: string };
  if (!filePath) {
    ctx.status = 400;
    ctx.body = { message: "文件路径不能为空" };
    return;
  }
  const { rootPath } = await resolveBrowsePath(path.dirname(filePath));
  const resolvedFilePath = normalizePath(filePath);
  if (!isSubPath(resolvedFilePath, rootPath)) {
    throw new Error("访问路径超出录制目录范围");
  }
  const stat = await fs.stat(resolvedFilePath).catch(() => null);
  if (!stat || !stat.isFile()) {
    throw new Error("文件不存在");
  }
  const fileKind = getFileKind(resolvedFilePath);
  if (!fileKind) {
    throw new Error("不支持下载该文件类型");
  }
  const fileId = fileCache.setFile(resolvedFilePath);
  ctx.body = {
    fileId,
    fileName: path.basename(resolvedFilePath),
    fileKind,
  };
});

router.post("/delete", async (ctx) => {
  const { path: filePath } = ctx.request.body as { path?: string };
  if (!filePath) {
    ctx.status = 400;
    ctx.body = { message: "文件路径不能为空" };
    return;
  }
  const resolvedFilePath = normalizePath(filePath);
  const { rootPath } = await resolveBrowsePath(path.dirname(resolvedFilePath));
  if (!isSubPath(resolvedFilePath, rootPath)) {
    throw new Error("访问路径超出录制目录范围");
  }
  const stat = await fs.stat(resolvedFilePath).catch(() => null);
  if (!stat || !stat.isFile()) {
    throw new Error("文件不存在");
  }
  const fileKind = getFileKind(resolvedFilePath);
  if (!fileKind) {
    throw new Error("仅支持删除视频和弹幕文件");
  }
  if (!canDeleteFile(resolvedFilePath)) {
    throw new Error(`当前未开启删除，或文件不在 ${DELETE_DIRS_ENV} 白名单目录中`);
  }
  await trashItem(resolvedFilePath);
  ctx.body = {
    message: "删除成功",
    path: resolvedFilePath,
    fileKind,
  };
});

router.post("/exists", async (ctx) => {
  const { filepath } = ctx.request.body as {
    filepath: string;
  };
  const exists = await fs.pathExists(filepath);
  ctx.body = exists;
});

router.post("/join", async (ctx) => {
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

/**
 * @api {get} /files/temp 获取缓存文件夹路径
 * @apiDescription 获取当前配置的缓存文件夹路径
 * @apiSuccess {string} path 缓存文件夹路径
 */
router.get("/temp", async (ctx) => {
  try {
    const tempPath = getTempPath();
    ctx.body = tempPath;
  } catch (error) {
    console.error("获取缓存路径失败:", error);
    ctx.status = 500;
    ctx.body = "获取缓存路径失败";
  }
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

export default router;
