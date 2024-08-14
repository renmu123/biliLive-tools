import Router from "koa-router";
import { foramtTitle } from "@biliLive-tools/shared/utils/index.js";

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

export default router;
