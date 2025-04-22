import Router from "koa-router";

import { mergeXml } from "@biliLive-tools/shared/task/danmu.js";

const router = new Router({
  prefix: "/danma",
});

router.post("/mergeXml", async (ctx) => {
  const { inputFiles, options } = ctx.request.body as {
    inputFiles: { videoPath: string; danmakuPath: string }[];
    options: {
      output?: string;
      saveOriginPath: boolean;
    };
  };
  await mergeXml(inputFiles, options);
  ctx.body = "OK";
});

export default router;
