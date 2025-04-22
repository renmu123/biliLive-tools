import Router from "koa-router";

import { mergeXml } from "@biliLive-tools/shared/task/danmu.js";

const router = new Router({
  prefix: "/danma",
});

router.post("/mergeXml", async (ctx) => {
  const { inputVideos, options } = ctx.request.body as {
    inputVideos: { videoPath: string; danmakuPath: string }[];
    options: {
      output?: string;
      saveOriginPath: boolean;
    };
  };
  await mergeXml(inputVideos, options);
  ctx.body = "OK";
});

export default router;
