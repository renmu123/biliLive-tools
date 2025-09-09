import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import https from "node:https";
import Koa from "koa";
import Router from "koa-router";
import cors from "@koa/cors";
import { bodyParser } from "@koa/bodyparser";

import errorMiddleware from "./middleware/error.js";

import webhookRouter from "./routes/webhook.js";
import configRouter from "./routes/config.js";
import llmRouter from "./routes/llm.js";
import commonRouter from "./routes/common.js";
import userRouter from "./routes/user.js";
import presetRouter from "./routes/preset.js";
import SSERouter from "./routes/sse.js";
import recocderRouter from "./routes/recorder.js";
import biliRouter from "./routes/bili.js";
import taskRouter from "./routes/task.js";
import assetsRouter from "./routes/assets.js";
import videoRouter from "./routes/video.js";
import recordHistoryRouter from "./routes/recordHistory.js";
import danmaRouter from "./routes/danma.js";
import syncRouter from "./routes/sync.js";
import { WebhookHandler } from "./services/webhook.js";
import { createFileCache } from "./services/fileCache.js";

import type { GlobalConfig } from "@biliLive-tools/types";
import type { AwilixContainer } from "awilix";
import type { AppConfig } from "@biliLive-tools/shared";

export let config: GlobalConfig;
export let handler!: WebhookHandler;
export let appConfig!: AppConfig;
export let container!: AwilixContainer;
export const fileCache = createFileCache();

export const __dirname = path.dirname(fileURLToPath(import.meta.url));

const authMiddleware = (passKey: string | number) => {
  return async (ctx: Koa.Context, next: Koa.Next) => {
    const authHeader = ctx.headers["authorization"] || ctx.request.query.auth;
    // 忽略视频请求
    if (ctx.path.includes("/common/video/")) {
      await next();
      return;
    }
    if (!authHeader) {
      ctx.status = 401;
      ctx.body = "Authorization header is missing";
      return;
    }

    if (!passKey) {
      ctx.status = 500;
      ctx.body = "passkey should be set";
      return;
    }

    const token = authHeader;
    if (token !== passKey) {
      ctx.status = 401;
      ctx.body = "Forbidden";
      return;
    }

    await next();
  };
};

const app = new Koa();
const router = new Router();

router.get("/", async (ctx) => {
  ctx.body = "Hello World";
});

app.use(errorMiddleware);
app.use(cors());
app.use(bodyParser());
app.use(router.routes());
app.use(webhookRouter.routes());
app.use(assetsRouter.routes());

export async function serverStart(
  options: {
    port: number;
    host: string;
    auth: boolean;
    passKey: string;
  },
  axContainer: AwilixContainer,
) {
  container = axContainer;

  config = container.resolve<GlobalConfig>("globalConfig");
  appConfig = container.resolve<AppConfig>("appConfig");
  handler = new WebhookHandler(appConfig);

  if (options.auth) {
    const passKey = process.env.BILILIVE_TOOLS_PASSKEY || options.passKey;
    const auth = authMiddleware(passKey);
    app.use(auth);
  }

  app.use(configRouter.routes());
  app.use(llmRouter.routes());
  app.use(userRouter.routes());
  app.use(commonRouter.routes());
  app.use(presetRouter.routes());
  app.use(recocderRouter.routes());
  app.use(biliRouter.routes());
  app.use(taskRouter.routes());
  app.use(videoRouter.routes());
  app.use(recordHistoryRouter.routes());
  app.use(danmaRouter.routes());
  app.use(syncRouter.routes());

  app.use(SSERouter.routes());
  app.use(router.allowedMethods());

  await createServer(options);
  return app;
}

// function createCertificateAsync(): Promise<pem.CertificateCreationResult> {
//   return new Promise((resolve, reject) => {
//     pem.createCertificate({ days: 1, selfSigned: true }, (err, keys) => {
//       if (err) {
//         reject(err);
//       }
//       resolve(keys);
//     });
//   });
// }

async function createServer(options: { port: number; host: string }) {
  const isHttps = false;
  if (isHttps) {
    // const keys = await createCertificateAsync();
    // const httpsServer = https.createServer(
    //   { key: keys.serviceKey, cert: keys.certificate },
    //   app.callback(),
    // );
    const httpsServer = https.createServer({ key: "", cert: "" }, app.callback());
    httpsServer.on("error", (err) => {
      throw err;
    });
    httpsServer.listen(options.port, options.host, () => {
      console.log(`Server is running at https://${options.host}:${options.port}`);
    });
  } else {
    const httpServer = http.createServer(app.callback());
    httpServer.listen(options.port, options.host, () => {
      console.log(`Server is running at http://${options.host}:${options.port}`);
    });
  }
}
