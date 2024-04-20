// webhhok
import Router from "koa-router";

const router = new Router();

router.get("/webhook", async (ctx) => {
  ctx.body = "Hello World1";
});

export default router;
