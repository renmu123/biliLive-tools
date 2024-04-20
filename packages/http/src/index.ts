import Koa from "koa";
import Router from "koa-router";

import webhookRouter from "./routes/webhook";

const app = new Koa();
const router = new Router();

router.get("/", async (ctx) => {
  ctx.body = "Hello World1";
});

app.use(router.routes());
app.use(webhookRouter.routes());

function serverStart() {
  app.listen(3000, () => {
    console.log("Server is running at http://localhost:3000");
  });
  console.log("Server is running at http://localhost:3000");
}

serverStart();
