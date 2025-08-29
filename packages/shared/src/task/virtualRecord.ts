import fs from "fs-extra";
import path from "path";
import axios from "axios";

import logger from "../utils/log.js";
import { virtualRecordModel } from "../db/index.js";
import { appConfig } from "../config.js";
import { sleep } from "../utils/index.js";
import { readVideoMeta } from "./video.js";

import type { AppConfig } from "@biliLive-tools/types";

type VirtualRecordConfig = AppConfig["virtualRecord"]["config"][number];

interface FileInfo {
  path: string;
  birthtimeMs: number;
  ctimeMs: number;
  isFile: () => boolean;
}

/**
 * 使用正则表达式从文件名中提取信息
 */
const extractInfoFromFilename = (filename: string, regex: string): string | null => {
  if (!regex) return null;

  try {
    const match = filename.match(new RegExp(regex));
    return match?.[1] || match?.[0] || null;
  } catch (error) {
    logger.error(`正则表达式解析失败: ${regex}`, error);
    return null;
  }
};

/**
 * 处理单个文件夹的检查
 */
const checkFolder = async (config: VirtualRecordConfig, folderPath: string, startTime: number) => {
  if (!config.switch) return;

  // 检查监听文件夹是否存在
  const exists = await fs.pathExists(folderPath);
  if (!exists) {
    logger.warn(`文件夹不存在: ${folderPath}`);
    return;
  }

  // 筛选出符合条件的文件
  const files = await fs.readdir(folderPath);
  // 筛选出mp4,ts,flv,mkv后缀的文件
  const videoFiles = files
    .filter((file) => /\.(mp4|ts|flv|mkv)$/.test(file))
    .map((file) => {
      return path.join(folderPath, file);
    });

  if (videoFiles.length === 0) {
    logger.debug(`没有找到符合条件的文件：${folderPath}`);
    return;
  }

  const stats = await Promise.allSettled(videoFiles.map((file) => fs.stat(file)));

  const validFiles: FileInfo[] = stats
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
    logger.debug(`没有找到符合条件的新文件：${folderPath}`);
    return;
  }

  // 读取数据库，排除掉已存在的记录
  const existingRecords = virtualRecordModel.list();
  const existingPathSets = new Set(existingRecords.map((item) => item.path));
  const newRecords = validFiles.filter((file) => !existingPathSets.has(file.path));

  if (newRecords.length === 0) {
    logger.debug(`没有新的未处理文件：${folderPath}`);
    return;
  }

  // 处理每个新文件
  const port = appConfig.get("port");
  for (const file of newRecords) {
    await processFile(file, config, port);
  }
};

/**
 * 处理单个文件
 */
const processFile = async (file: FileInfo, config: VirtualRecordConfig, port: number) => {
  try {
    const startTimestamp = file.birthtimeMs;
    const filename = path.basename(file.path);

    let roomId = config.roomId;
    let title = "未知标题";
    let username = config.username || "未知主播";

    // 高级模式：从文件名中提取信息
    if (config.mode === "advance") {
      // 提取房间号
      const extractedRoomId = extractInfoFromFilename(filename, config.roomIdRegex);
      if (!extractedRoomId) {
        logger.warn(`无法从文件名提取房间号，跳过处理: ${filename}`);
        return;
      }
      roomId = extractedRoomId;

      // 提取主播名称（可选）
      if (config.usernameRegex) {
        const extractedUsername = extractInfoFromFilename(filename, config.usernameRegex);
        if (extractedUsername) {
          username = extractedUsername;
        }
      }
    }

    // 提取标题（两种模式都支持）
    if (config.titleRegex) {
      const extractedTitle = extractInfoFromFilename(filename, config.titleRegex);
      if (extractedTitle) {
        title = extractedTitle;
      }
    }

    logger.info(`开始处理文件: ${file.path}, 房间号: ${roomId}, 主播: ${username}`);

    // 发送文件开始事件
    await axios.post(`http://127.0.0.1:${port}/webhook/custom`, {
      event: "FileOpening",
      filePath: file.path,
      roomId: roomId,
      time: new Date(startTimestamp).toISOString(),
      title: title,
      username: username,
    });

    await sleep(5000);

    // 计算结束时间
    let endTimestamp = Date.now();
    try {
      // 读取视频时长
      const videoMeta = await readVideoMeta(file.path);
      const duration = videoMeta?.format?.duration ?? 0;
      endTimestamp = startTimestamp + duration * 1000;
    } catch (error) {
      logger.error("读取视频元数据失败", error, file.path);
    }

    // 发送文件结束事件
    await axios.post(`http://127.0.0.1:${port}/webhook/custom`, {
      event: "FileClosed",
      filePath: file.path,
      roomId: roomId,
      time: new Date(endTimestamp).toISOString(),
      title: title,
      username: username,
    });

    logger.info(`文件处理完成: ${file.path}`);
  } catch (error) {
    logger.error(`处理文件失败: ${file.path}`, error);
  } finally {
    // 将这次处理的数据添加到数据库
    virtualRecordModel.add({
      path: file.path,
    });
  }
};

/**
 * 检查单个配置的所有文件夹
 */
const checkConfig = async (config: VirtualRecordConfig, startTime: number) => {
  if (!config.switch) return;

  // 处理每个监听文件夹
  for (const folderPath of config.watchFolder) {
    await checkFolder(config, folderPath, startTime);
  }
};

/**
 * 检查所有配置
 */
const checkFolders = async () => {
  const data = appConfig.get("virtualRecord");
  const startTime = data.startTime;
  const list = data?.config || [];

  for (const config of list) {
    await checkConfig(config, startTime);
  }
};

/**
 * 虚拟录制检查循环
 */
async function checkVirtualRecordLoop() {
  try {
    await checkFolders();
  } catch (error) {
    logger.error("虚拟录制检查失败", error);
  } finally {
    setTimeout(checkVirtualRecordLoop, 1 * 60 * 1000);
  }
}

/**
 * 启动虚拟录制检查
 */
export async function check() {
  logger.info("启动虚拟录制检查服务");
  // 默认使用轮询方式实现
  checkVirtualRecordLoop();
  // TODO: 之后可能采取 watch 方式实现
}
