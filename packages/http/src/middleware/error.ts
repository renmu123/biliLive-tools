import { Context, Next } from "koa";
import log from "@biliLive-tools/shared/lib/utils/log.js";

const errorMiddleware = async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    ctx.status = 500;
    ctx.body = error.message;
    ctx.app.emit("error", error, ctx);
    log.error(error);
  }
};
export default errorMiddleware;
