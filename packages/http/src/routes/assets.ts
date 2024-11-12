import path from "node:path";
import fs from "fs-extra";
import Router from "koa-router";
import { config } from "../index.js";

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

export default router;
