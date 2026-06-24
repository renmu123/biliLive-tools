import { Context, Next } from "koa";
import log from "@biliLive-tools/shared/utils/log.js";

const errorMiddleware = async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.status = 500;
    ctx.body = message;
    ctx.app.emit("error", error, ctx);
    log.error(error);
  }
};
export default errorMiddleware;
