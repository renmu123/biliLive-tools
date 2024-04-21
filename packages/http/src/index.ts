import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";

import webhookRouter from "./routes/webhook";
import configRouter from "./routes/config";

const app = new Koa();
const router = new Router();

router.get("/", async (ctx) => {
  ctx.body = "Hello World11";
});

app.use(bodyParser());
app.use(router.routes());
app.use(webhookRouter.routes());
app.use(configRouter.routes());

export const globalConfig = {
  port: 3000,
  configPath: "C:\\Users\\renmu\\AppData\\Roaming\\biliLive-tools\\appConfig.json",
};

export function serverStart(config: Partial<typeof globalConfig> = {}) {
  Object.assign(globalConfig, config);

  app.listen(globalConfig.port, () => {
    console.log("Server is running at http://localhost:3000");
  });
  console.log("Server is running at http://localhost:3000");
}

serverStart();
