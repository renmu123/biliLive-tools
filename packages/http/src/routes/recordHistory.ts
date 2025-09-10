import path from "node:path";
import fs from "fs-extra";

import Router from "koa-router";
import { replaceExtName } from "@biliLive-tools/shared/utils/index.js";
import recordHistory from "@biliLive-tools/shared/recorder/recordHistory.js";
import { fileCache } from "../index.js";

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
 * @returns 返回数据包含弹幕密度字段（弹幕数量/视频时长，单位：条/秒）
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

    // 为每条记录计算弹幕密度
    const dataWithDensity = result.data.map((record) => ({
      ...record,
      danma_density:
        record.danma_num && record.video_duration && record.video_duration > 0
          ? Math.round((record.danma_num / record.video_duration) * 100) / 100 // 保留两位小数
          : null,
    }));

    ctx.body = {
      code: 200,
      data: dataWithDensity,
      pagination: result.pagination,
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: "查询直播记录失败",
      error: error?.message,
    };
  }
});

/**
 * 删除单个直播记录
 * @route DELETE /record-history/:id
 * @param {number} id - 记录ID
 */
router.delete("/:id", async (ctx) => {
  const { id } = ctx.params;

  if (!id || isNaN(parseInt(id))) {
    ctx.status = 400;
    ctx.body = {
      code: 400,
      message: "记录ID不能为空且必须为数字",
    };
    return;
  }

  try {
    const success = recordHistory.removeRecord(parseInt(id));

    if (success) {
      ctx.body = {
        code: 200,
        message: "删除成功",
      };
    } else {
      ctx.status = 404;
      ctx.body = {
        code: 404,
        message: "记录不存在或已被删除",
      };
    }
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: "删除直播记录失败",
      error: error?.message,
    };
  }
});

const getVideoFile = async (id: number): Promise<string | null> => {
  const data = recordHistory.getRecordById(id);
  if (!data) {
    throw new Error("记录不存在");
  }
  if (!data.video_file) {
    throw new Error("视频文件不存在");
  }
  if (await fs.pathExists(data.video_file)) {
    return data.video_file;
  }
  const mp4File = replaceExtName(data.video_file, ".mp4");
  if (await fs.pathExists(mp4File)) {
    return mp4File;
  }
  return null;
};

/**
 * 获取视频文件
 * @route GET /record-history/video-file
 * @param {string} video_file - 视频文件路径
 */
router.get("/video/:id", async (ctx) => {
  const { id } = ctx.params;

  if (!id || isNaN(parseInt(id))) {
    ctx.status = 400;
    ctx.body = "记录ID不能为空且必须为数字";
  }

  const file = await getVideoFile(parseInt(id));
  if (file) {
    ctx.body = file;
    return;
  }

  ctx.status = 400;
  ctx.body = "视频文件不存在";
});

/**
 * 下载视频文件
 * @route GET /record-history/download/:id
 * @param {number} id - 记录ID
 */
router.get("/download/:id", async (ctx) => {
  const { id } = ctx.params;

  if (!id || isNaN(parseInt(id))) {
    ctx.status = 400;
    ctx.body = "记录ID不能为空且必须为数字";
  }

  const file = await getVideoFile(parseInt(id));
  if (!file) {
    ctx.status = 400;
    ctx.body = "视频文件不存在";
    return;
  }
  const extname = path.extname(file).toLowerCase();

  const fileId = fileCache.setFile(file);
  let type = "";
  switch (extname) {
    case ".flv":
      type = "flv";
      break;
    case ".ts":
      type = "ts";
      break;
  }

  ctx.body = { fileId, type };
});

export default router;
