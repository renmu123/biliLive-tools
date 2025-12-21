import path from "node:path";
import fs from "fs-extra";

import Router from "@koa/router";
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
 * @returns
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
          : 0,
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

/**
 * 获取视频文件路径
 * @param id 记录ID
 * @returns
 */
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
 * 获取弹幕文件路径，优先查询ass文件，其次查询xml文件
 * @param videoFile 视频文件路径
 * @returns 弹幕文件路径
 */
const getDanmaFile = async (
  videoFile: string,
): Promise<{
  file: string;
  ext: string;
} | null> => {
  const assFile = replaceExtName(videoFile, ".ass");
  if (await fs.pathExists(assFile)) {
    return { file: assFile, ext: "ass" };
  }
  const danmaFile = replaceExtName(videoFile, ".xml");
  if (await fs.pathExists(danmaFile)) {
    return { file: danmaFile, ext: "xml" };
  }
  return null;
};

/**
 * 获取记录文件信息
 * @route GET /record-history/file/:id
 * @param {number} id - 记录ID
 */
router.get("/file/:id", async (ctx) => {
  const { id } = ctx.params;

  if (!id || isNaN(parseInt(id))) {
    ctx.status = 400;
    ctx.body = "记录ID不能为空且必须为数字";
  }

  const videoFile = await getVideoFile(parseInt(id));
  if (!videoFile) {
    ctx.status = 400;
    ctx.body = "视频文件不存在";
    return;
  }
  const extname = path.extname(videoFile).toLowerCase();

  const videoFileId = fileCache.setFile(videoFile);
  let videoFileExt = "";
  switch (extname) {
    case ".flv":
      videoFileExt = "flv";
      break;
    case ".ts":
      videoFileExt = "ts";
      break;
  }

  const danmaFile = await getDanmaFile(videoFile);
  let danmaFileId: string | null = null;
  if (danmaFile) {
    danmaFileId = fileCache.setFile(danmaFile.file);
  }

  ctx.body = {
    videoFilePath: videoFile,
    videoFileId,
    videoFileExt,
    danmaFilePath: danmaFile?.file || null,
    danmaFileId,
    danmaFileExt: danmaFile?.ext || null,
  };
});

export default router;
