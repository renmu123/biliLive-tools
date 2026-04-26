import Router from "@koa/router";
import streamerDetailService from "@biliLive-tools/shared/streamerDetail/index.js";

import type { StreamerDetailAPI } from "../types/streamerDetail.js";

const router = new Router({
  prefix: "/streamerDetail",
});

const getSingleQueryValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

router.get("/list", async (ctx) => {
  const roomId = getSingleQueryValue(ctx.request.query.room_id);
  const platform = getSingleQueryValue(ctx.request.query.platform);
  const page = getSingleQueryValue(ctx.request.query.page);
  const pageSize = getSingleQueryValue(ctx.request.query.pageSize);
  const startTime = getSingleQueryValue(ctx.request.query.startTime);
  const endTime = getSingleQueryValue(ctx.request.query.endTime);

  if (!roomId || !platform) {
    ctx.status = 400;
    ctx.body = {
      message: "room_id 和 platform 不能为空",
    };
    return;
  }

  ctx.body = {
    payload: streamerDetailService.queryStreamerDetail({
      room_id: roomId,
      platform,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      startTime: startTime ? Number(startTime) : undefined,
      endTime: endTime ? Number(endTime) : undefined,
    }),
  };
});

export default router;
