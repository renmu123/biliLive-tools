import Router from "koa-router";
import recordHistory from "@biliLive-tools/shared/recorder/recordHistory.js";

const router = new Router({
  prefix: "/record-history",
});

/**
 * 查询直播记录
 * @route GET /record-history/list
 * @param {string} room_id - 房间号
 * @param {string} platform - 平台
 * @param {number} [page=1] - 页码
 * @param {number} [pageSize=100] - 每页条数
 * @param {number} [startTime] - 开始时间（时间戳）
 * @param {number} [endTime] - 结束时间（时间戳）
 */
router.get("/list", async (ctx) => {
  const { room_id, platform, page, pageSize, startTime, endTime } = ctx.query;

  if (!room_id || !platform) {
    ctx.status = 400;
    ctx.body = {
      code: 400,
      message: "房间号和平台不能为空",
    };
    return;
  }

  try {
    const result = recordHistory.queryRecordsByRoomAndPlatform({
      room_id: room_id as string,
      platform: platform as string,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      startTime: startTime ? parseInt(startTime as string) : undefined,
      endTime: endTime ? parseInt(endTime as string) : undefined,
    });

    ctx.body = {
      code: 200,
      data: result.data,
      pagination: result.pagination,
    };
  } catch (error) {
    console.error("查询直播记录失败", error);
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: "查询直播记录失败",
      error: error.message,
    };
  }
});

export default router;
