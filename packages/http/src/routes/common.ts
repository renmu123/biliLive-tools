// import fs from "node:fs";
// import path from "node:path";

import Router from "koa-router";
import { foramtTitle } from "@biliLive-tools/shared/utils/index.js";
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

// router.get("/api/files", (req, res) => {
// const directoryPath = req.query.path
//   ? path.join(__dirname, "files", req.query.path)
//   : path.join(__dirname, "files");
// const extFilter = req.query.ext || null;
// fs.readdir(directoryPath, { withFileTypes: true }, (err, files) => {
//   if (err) {
//     return res.status(500).send("Unable to scan directory");
//   }
//   const fileList = files.map((file) => ({
//     name: file.name,
//     isDirectory: file.isDirectory(),
//     path: path.join(req.query.path || "", file.name),
//   }));
//   // 筛选扩展名
//   const filteredList = extFilter
//     ? fileList.filter((file) => file.isDirectory || file.name.endsWith(extFilter))
//     : fileList;
//   res.json(filteredList);
// });
// });

export default router;
