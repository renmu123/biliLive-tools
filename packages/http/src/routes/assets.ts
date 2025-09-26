import path from "node:path";
import fs from "fs-extra";
import Router from "koa-router";
import { config, fileCache } from "../index.js";

const router = new Router({
  prefix: "/assets",
});

router.get("/cover/:filename", async (ctx) => {
  const { filename } = ctx.params;
  const coverPath = path.join(config.userDataPath, "cover", filename);

  if (await fs.pathExists(coverPath)) {
    ctx.type = path.extname(coverPath);
    ctx.body = fs.createReadStream(coverPath);
  } else {
    ctx.status = 404;
    ctx.body = "Cover not found";
  }
});

router.get("/download/:id", async (ctx) => {
  const { id } = ctx.params;

  const file = fileCache.get(id);
  if (!file) {
    ctx.status = 404;
    ctx.body = { message: "文件不存在" };
    return;
  }
  if (!(await fs.pathExists(file.path))) {
    ctx.status = 404;
    ctx.body = { message: "文件不存在" };
    return;
  }

  const stat = await fs.stat(file.path);
  ctx.set("Content-Length", stat.size.toString());
  ctx.set("Content-Type", "application/octet-stream");
  ctx.set(
    "Content-Disposition",
    `attachment; filename=${encodeURIComponent(path.basename(file.path))}`,
  );
  ctx.body = fs.createReadStream(file.path);
});

export default router;
