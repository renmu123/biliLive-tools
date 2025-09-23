import fs from "fs-extra";
import path from "path";
import axios from "axios";

import logger from "../utils/log.js";
import { virtualRecordModel } from "../db/index.js";
import { appConfig } from "../config.js";
import { sleep } from "../utils/index.js";
import { readVideoMeta } from "./video.js";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

import type { AppConfig } from "@biliLive-tools/types";

dayjs.extend(customParseFormat);

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
 * 从文件名中提取开始时间戳
 * @param filename 文件名
 * @param startTimeAutoMatch 是否自动匹配开始时间
 * @param fileBirthtimeMs 文件创建时间作为备用
 * @returns 时间戳（毫秒）
 */
const extractStartTimeFromFilename = (
  filename: string,
  startTimeAutoMatch: boolean | undefined,
  fileBirthtimeMs: number,
): number => {
  // 如果没有配置或关闭，使用文件创建时间
  if (!startTimeAutoMatch) {
    return fileBirthtimeMs;
  }

  try {
    // 匹配格式如：2025-09-12 17-16-48
    const date = dayjs(filename, ["YYYY-MM-DD_HH-mm-ss", "YYYY-MM-DD HH-mm-ss"]);
    console.log("匹配时间", filename, date.isValid(), date.toString());
    if (date.isValid()) {
      return date.valueOf();
    }
  } catch (error) {
    logger.error(`自动时间格式解析失败: ${filename}`, error);
  }

  return fileBirthtimeMs;
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

  const videoFiles = files
    .filter((file) => {
      // 使用配置的文件匹配规则，如果未配置则使用默认规则
      const matchRegex = config.fileMatchRegex || "\\.(mp4|ts|flv|mkv|m4s)$";
      try {
        const regex = new RegExp(matchRegex);
        return regex.test(file);
      } catch (error) {
        logger.error(`文件匹配正则表达式解析失败: ${matchRegex}`, error);
        // 如果正则表达式解析失败，使用默认规则
        return /\.(mp4|ts|flv|mkv|m4s)$/.test(file);
      }
    })
    .filter((file) => {
      // 如果配置了忽略文件规则，则过滤掉匹配的文件
      if (config.ignoreFileRegex) {
        try {
          const ignoreRegex = new RegExp(config.ignoreFileRegex);
          if (ignoreRegex.test(file)) {
            logger.debug(`文件被忽略规则匹配，跳过: ${file}`);
            return false;
          }
        } catch (error) {
          logger.error(`忽略文件正则表达式解析失败: ${config.ignoreFileRegex}`, error);
        }
      }
      return true;
    })
    .map((file) => {
      return path.join(folderPath, file);
    });

  if (videoFiles.length === 0) {
    // logger.debug(`没有找到符合条件的文件：${folderPath}`);
    return;
  }

  // 读取数据库，排除掉已存在的记录
  const existingRecords = virtualRecordModel.list();
  const existingPathSets = new Set(existingRecords.map((item) => item.path));
  const unprocessedFiles = videoFiles.filter((file) => !existingPathSets.has(file));

  if (unprocessedFiles.length === 0) {
    return;
  }

  const stats = await Promise.allSettled(unprocessedFiles.map((file) => fs.stat(file)));
  const newRecords: FileInfo[] = stats
    .map((item, index) => {
      return {
        path: unprocessedFiles[index],
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

  if (newRecords.length === 0) {
    // logger.debug(`没有找到符合条件的新文件：${folderPath}`);
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
    const filename = path.basename(file.path);

    // 提取开始时间
    const startTimestamp = extractStartTimeFromFilename(
      filename,
      config.startTimeAutoMatch,
      file.birthtimeMs,
    );

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

    logger.info(
      `开始处理文件: ${file.path}, 房间号: ${roomId}, 主播: ${username}, 开始时间: ${new Date(startTimestamp).toLocaleString()}`,
    );

    // 发送文件开始事件
    await axios.post(
      `http://127.0.0.1:${port}/webhook/custom`,
      {
        event: "FileOpening",
        filePath: file.path,
        roomId: roomId,
        time: new Date(startTimestamp).toISOString(),
        title: title,
        username: username,
      },
      {
        proxy: false,
      },
    );

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
    await axios.post(
      `http://127.0.0.1:${port}/webhook/custom`,
      {
        event: "FileClosed",
        filePath: file.path,
        roomId: roomId,
        time: new Date(endTimestamp).toISOString(),
        title: title,
        username: username,
      },
      {
        proxy: false,
      },
    );

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
    setTimeout(checkVirtualRecordLoop, 2 * 60 * 1000);
  }
}

/**
 * 启动虚拟录制检查
 */
export async function check() {
  // 默认使用轮询方式实现
  checkVirtualRecordLoop();
  // TODO: 之后可能采取 watch 方式实现
}
