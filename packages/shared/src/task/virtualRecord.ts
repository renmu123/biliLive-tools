import fs from "fs-extra";
import path from "path";
import axios from "axios";

import logger from "../utils/log.js";
import { virtualRecordModel } from "../db/index.js";
import { appConfig } from "../config.js";
import { sleep } from "../utils/index.js";
import { readVideoMeta } from "./video.js";

interface VirtualRecordConfig {
  id: string;
  switch: boolean;
  roomId: string;
  watchFolder: string;
}

const checkFolder = async (config: VirtualRecordConfig, startTime: number) => {
  if (!config.switch) return;

  const { watchFolder } = config;

  // 检查监听文件夹是否存在
  const exists = await fs.pathExists(watchFolder);
  if (!exists) {
    logger.warn(`文件夹不存在: ${watchFolder}`);
    return;
  }

  // 筛选出符合条件的文件
  const files = await fs.readdir(watchFolder);
  // 筛选出mp4,ts,flv,mkv后缀的文件
  const videoFiles = files
    .filter((file) => /\.(mp4|ts|flv|mkv)$/.test(file))
    .map((file) => {
      return path.join(watchFolder, file);
    });
  if (videoFiles.length === 0) {
    logger.warn(`没有找到符合条件的文件：${watchFolder}`);
    return;
  }

  const stats = await Promise.allSettled(videoFiles.map((file) => fs.stat(file)));

  const validFiles = stats
    .map((item, index) => {
      return {
        path: videoFiles[index],
        ...item,
      };
    })
    .filter((result) => result.status === "fulfilled")
    .filter((result) => {
      // 排除directory，创建时间大于startTime，ctime大于当前时间五分钟，birthtimeMs从旧到新排序
      return (
        result.value.isFile() &&
        result.value.birthtimeMs > startTime &&
        Date.now() - result.value.ctimeMs > 5 * 60 * 1000
      );
    })
    .map((result) => {
      return {
        path: result.path,
        ...result.value,
      };
    })
    .sort((a, b) => {
      return a.birthtimeMs - b.birthtimeMs;
    });

  if (validFiles.length === 0) {
    logger.warn(`没有找到符合条件的文件2：${watchFolder}`);
    return;
  }

  // 读取数据库，排除掉已存在的记录
  const existingRecords = virtualRecordModel.list();
  const existingPathSets = new Set(existingRecords.map((item) => item.path));
  const newRecords = validFiles.filter((file) => !existingPathSets.has(file.path));

  // 发送数据到webhook
  const port = appConfig.get("port");
  for (const file of newRecords) {
    try {
      const startTimestamp = file.birthtimeMs;
      logger.info(`发送数据: ${file.path}`);
      await axios.post(`http://127.0.0.1:${port}/webhook/custom`, {
        event: "FileOpening",
        filePath: file.path,
        roomId: config.roomId,
        time: new Date(startTimestamp).toISOString(),
        title: "未知标题",
        username: "未知主播",
      });
      await sleep(5000);

      let endTimestamp = Date.now();
      try {
        //  TODO:读取ffprobe时长加上开始时间
        const videoMeta = await readVideoMeta(file.path);
        // 单位是秒
        const duration = videoMeta?.format?.duration ?? 0;
        endTimestamp = startTimestamp + duration * 1000;
      } catch (error) {
        logger.error("读取视频元数据失败", error, file.path);
      }

      axios.post(`http://127.0.0.1:${port}/webhook/custom`, {
        event: "FileClosed",
        filePath: file.path,
        roomId: config.roomId,
        time: new Date(endTimestamp).toISOString(),
        title: "未知标题",
        username: "未知主播",
      });
    } catch (error) {
      logger.error(`发送数据失败: ${file.path}`, error);
    } finally {
      // 将这次处理的数据添加到数据库
      virtualRecordModel.add({
        path: file.path,
      });
    }
  }
};

const checkFolders = async () => {
  const data = appConfig.get("virtualRecord");
  const startTime = data.startTime;
  const list = data?.config || [];
  for (const config of list) {
    await checkFolder(config, startTime);
  }
};

async function checkVirtualRecordLoop() {
  try {
    await checkFolders();
  } catch (error) {
    logger.error("检查失败", error);
  } finally {
    setTimeout(checkVirtualRecordLoop, 1 * 60 * 1000);
  }
}

export async function check() {
  // 默认使用轮询方式实现
  checkVirtualRecordLoop();
  // TODO:之后可能采取watch方式实现
}
