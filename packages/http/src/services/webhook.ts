import path from "node:path";
import fs from "fs-extra";

import { FFmpegPreset, VideoPreset, DanmuPreset } from "@biliLive-tools/shared";
import { DEFAULT_BILIUP_CONFIG } from "@biliLive-tools/shared/presets/videoPreset.js";
import { biliApi } from "@biliLive-tools/shared/task/bili.js";
import { isEmptyDanmu, convertXml2Ass } from "@biliLive-tools/shared/task/danmu.js";
import { transcode, burn, analyzeResolutionChanges } from "@biliLive-tools/shared/task/video.js";
import log from "@biliLive-tools/shared/utils/log.js";
import {
  getFileSize,
  uuid,
  sleep,
  trashItem,
  formatTitle,
  formatPartTitle,
  replaceExtName,
} from "@biliLive-tools/shared/utils/index.js";

import { config } from "../index.js";
import FileLockManager from "./fileLockManager.js";

import type {
  BiliupConfig,
  FfmpegOptions,
  DanmuConfig,
  AppRoomConfig,
  CommonRoomConfig,
  HotProgressOptions,
} from "@biliLive-tools/types";
import type { AppConfig } from "@biliLive-tools/shared/config.js";
import type { Options, Platform, Part, PickPartial } from "../types/webhook.js";

export const enum EventType {
  OpenEvent = "FileOpening",
  CloseEvent = "FileClosed",
}

export class Live {
  eventId: string;
  platform: Platform;
  startTime: number;
  roomId: number;
  // 直播标题
  title: string;
  // 主播名
  username: string;
  aid?: number;
  // 非弹幕版aid
  rawAid?: number;
  parts: Part[];

  constructor(options: {
    eventId: string;
    platform: Platform;
    roomId: number;
    title: string;
    username: string;
    startTime: number;
    aid?: number;
    rawAid?: number;
  }) {
    this.eventId = options.eventId;
    this.platform = options.platform;
    this.roomId = options.roomId;
    this.startTime = options.startTime;
    this.title = options.title;
    this.username = options.username;
    this.aid = options.aid;
    this.rawAid = options.rawAid;
    this.parts = [];
  }

  addPart(part: PickPartial<Part, "uploadStatus" | "rawUploadStatus" | "rawFilePath">) {
    const defaultPart: Pick<Part, "uploadStatus" | "rawUploadStatus" | "rawFilePath"> = {
      uploadStatus: "pending",
      rawUploadStatus: "pending",
      rawFilePath: part.filePath,
    };
    this.parts.push({
      ...defaultPart,
      ...part,
    });
  }

  updatePartValue<K extends keyof Part>(partId: string, key: K, value: Part[K]) {
    const part = this.parts.find((p) => p.partId === partId);
    if (part) {
      part[key] = value;
    }
  }

  findPartByFilePath(filePath: string, type: "raw" | "handled" = "handled"): Part | undefined {
    if (type === "handled") {
      return this.parts.find((part) => part.filePath === filePath);
    } else if (type === "raw") {
      return this.parts.find((part) => part.rawFilePath === filePath);
    } else {
      throw new Error("type error");
    }
  }
  removePart(partId: string) {
    const part = this.parts.findIndex((part) => part.partId === partId);
    if (part !== -1) {
      this.parts.splice(part, 1);
    }
  }
}

export class WebhookHandler {
  liveData: Live[] = [];
  ffmpegPreset: FFmpegPreset;
  videoPreset: VideoPreset;
  danmuPreset: DanmuPreset;
  appConfig: AppConfig;
  // 存储已处理的文件名，避免重复处理
  private processedFiles: Set<string> = new Set();
  private fileLockManager: FileLockManager = new FileLockManager();
  constructor(appConfig: AppConfig) {
    this.ffmpegPreset = new FFmpegPreset({
      globalConfig: { ffmpegPresetPath: config.ffmpegPresetPath },
    });
    this.videoPreset = new VideoPreset({
      globalConfig: { videoPresetPath: config.videoPresetPath },
    });
    this.danmuPreset = new DanmuPreset({
      globalConfig: { danmuPresetPath: config.danmuPresetPath },
    });
    this.appConfig = appConfig;

    // 定期清理过期的锁
    setInterval(() => this.fileLockManager.cleanup(), 60 * 60 * 1000); // 每小时清理一次
  }

  async handle(options: Options) {
    const {
      danmu,
      minSize,
      danmuPresetId,
      videoPresetId,
      open,
      partMergeMinute,
      hotProgress,
      useLiveCover,
      hotProgressSample,
      hotProgressHeight,
      hotProgressColor,
      hotProgressFillColor,
      convert2Mp4Option,
      removeSourceAferrConvert2Mp4,
      afterConvertRemoveVideo,
      afterConvertRemoveXml,
      videoHandleTime,
      uid,
      uploadNoDanmu,
      noDanmuVideoPreset,
      afterUploadDeletAction,
    } = this.getConfig(options.roomId);
    if (!open) {
      log.info(`${options.roomId} is not open`);
      return;
    }

    // 计算live
    const currentLiveIndex = await this.handleLiveData(options, partMergeMinute);

    // 如果是开始事件，不需要后续的处理
    if (options.event === EventType.OpenEvent) {
      return;
    }

    const currentLive = this.liveData[currentLiveIndex];
    const currentPart = currentLive.findPartByFilePath(options.filePath);
    if (!currentPart) return;

    // 如果源文件不存在，那么尝试将后缀替换为mp4再判断是否存在
    if (!(await fs.pathExists(options.filePath))) {
      const mp4FilePath = replaceExtName(options.filePath, ".mp4");
      if (await fs.pathExists(mp4FilePath)) {
        options.filePath = mp4FilePath;
        currentPart.filePath = mp4FilePath;
        currentPart.rawFilePath = mp4FilePath;
      }
    }

    // 在录制结束时判断大小，如果文件太小，直接返回
    const fileSize = await getFileSize(options.filePath);
    if (fileSize / 1024 / 1024 < minSize) {
      log.warn(`${options.filePath}: file size is too small`);
      if (currentLive) {
        log.warn("remove part", currentLive, options.filePath);
        const part = currentLive.findPartByFilePath(options.filePath);
        log.warn("part", part);
        if (part) {
          currentLive.removePart(part.partId);
          // 如果删除part后，live的part列表为空，删除这个live
          if (currentLive.parts.length === 0) {
            const liveIndex = this.liveData.findIndex(
              (live) => live.eventId === currentLive.eventId,
            );
            if (liveIndex !== -1) {
              this.liveData.splice(liveIndex, 1);
              log.warn(`Removed empty live: ${currentLive.eventId}`);
            }
          }
        }
      }
      return;
    }

    log.debug(currentLive);

    const cover = await this.handleCover(options);

    if (useLiveCover) {
      if (cover) {
        currentPart.cover = cover;
      } else {
        log.error(`${cover} can not be found`);
      }
    }

    if (convert2Mp4Option) {
      const file = await this.transcode(
        options.filePath,
        {
          encoder: "copy",
          audioCodec: "copy",
        },
        {
          removeVideo: removeSourceAferrConvert2Mp4 ?? true,
        },
      );
      log.debug("convert2Mp4 output", file);
      options.filePath = file;
      currentPart.filePath = file;
      currentPart.rawFilePath = file;
    }
    // TODO:还是可能存在视频上传完但是源视频已经被删除的情况
    currentPart.recordStatus = "prehandled";

    let xmlFilePath: string;
    if (options.danmuPath) {
      xmlFilePath = options.danmuPath;
    } else {
      xmlFilePath = replaceExtName(options.filePath, ".xml");
    }

    // 用于跟踪转换是否成功
    let conversionSuccessful = true;
    // 用于跟踪弹幕转换是否成功
    let danmuConversionSuccessful = true;

    if (danmu) {
      try {
        await sleep(10000);
        if (!(await fs.pathExists(xmlFilePath)) || (await isEmptyDanmu(xmlFilePath))) {
          currentPart.recordStatus = "handled";
          // 等待1秒后，将上传状态设置为pending，不直接返回是由于后续有同步等相关操作
          setTimeout(() => {
            currentPart.uploadStatus = "pending";
          }, 1000);
          throw new Error(`没有找到弹幕文件：${xmlFilePath}`);
        }
        if (!danmuPresetId || !videoPresetId) {
          currentPart.uploadStatus = "error";
          throw new Error(`没有找到预设${danmuPresetId}或${videoPresetId}`);
        }

        const danmuConfig = (await this.danmuPreset.get(danmuPresetId))!.config;
        const ffmpegPreset = await this.ffmpegPreset.get(videoPresetId);

        const output = await this.burn(
          {
            videoFilePath: options.filePath,
            subtitleFilePath: xmlFilePath,
          },
          {
            danmaOptions: danmuConfig,
            ffmpegOptions: ffmpegPreset!.config,
            hasHotProgress: hotProgress,
            hotProgressOptions: {
              interval: hotProgressSample || 30,
              color: hotProgressColor || "#f9f5f3",
              fillColor: hotProgressFillColor || "#333333",
              height: hotProgressHeight || 60,
            },
            removeVideo: false,
            removeDanmu: false,
            limitTime: videoHandleTime,
          },
        );

        currentPart.filePath = output;
        currentPart.recordStatus = "handled";
      } catch (error) {
        log.error(error);
        currentPart.uploadStatus = "error";
        conversionSuccessful = false;
        danmuConversionSuccessful = false;
      }
    } else {
      if (videoPresetId) {
        try {
          const preset = await this.ffmpegPreset.get(videoPresetId);
          if (!preset) {
            throw new Error(`ffmpegPreset not found ${videoPresetId}`);
          }
          const output = await this.transcode(options.filePath, preset.config, {
            removeVideo: false,
            suffix: "-后处理",
            limitTime: videoHandleTime,
          });
          currentPart.filePath = output;
        } catch (error) {
          log.error(error);
          currentPart.uploadStatus = "error";
          conversionSuccessful = false;
        }
      }
      currentPart.recordStatus = "handled";

      // 弹幕错误也无所谓了
      if (danmuPresetId) {
        try {
          const preset = await this.danmuPreset.get(danmuPresetId);
          await this.convertDanmu(xmlFilePath, preset!.config);
        } catch (error) {
          log.error(error);
          danmuConversionSuccessful = false;
        }
      }
    }

    // 如果转换失败，不删除原始文件
    const shouldRemoveVideo = conversionSuccessful && afterConvertRemoveVideo;
    if (!conversionSuccessful && afterConvertRemoveVideo) {
      log.warn("转换失败，已取消删除原始视频文件的操作");
    }

    // 如果弹幕转换失败，不删除XML弹幕文件
    const shouldRemoveXml = danmuConversionSuccessful && afterConvertRemoveXml;
    if (!danmuConversionSuccessful && afterConvertRemoveXml) {
      log.warn("弹幕转换失败，已取消删除XML弹幕文件的操作");
    }

    // 处理封面同步
    if (cover) {
      await this.handleCoverSync(options.roomId, cover, currentPart.partId).catch((error) => {
        log.error("handleCoverSync", error);
      });
    }

    // 处理弹幕文件同步和删除
    if (xmlFilePath) {
      await this.handleDanmuSync(
        options.roomId,
        xmlFilePath,
        currentPart.partId,
        shouldRemoveXml,
      ).catch((error) => {
        log.error("handleDanmuSync", error);
      });
    }

    if (uid) {
      this.fileLockManager.acquireLock(currentPart.filePath, "upload");

      if (uploadNoDanmu && noDanmuVideoPreset) {
        this.fileLockManager.acquireLock(currentPart.rawFilePath, "upload");
      }
    }
    // 处理原始视频
    await this.handleVideoSync(
      options.roomId,
      currentPart.rawFilePath,
      currentPart.partId,
      shouldRemoveVideo,
    ).catch((error) => {
      log.error("handleVideoSync", error);
    });
    // 处理压制后的视频
    await this.handleVideoSync(
      options.roomId,
      currentPart.filePath,
      currentPart.partId,
      afterUploadDeletAction && afterUploadDeletAction !== "none",
    ).catch((error) => {
      log.error("handleVideoSync", error);
    });
  }

  /**
   * 根据filePath查找live，并非rawFilePath
   * @param filePath 文件路径
   */
  findLiveByFilePath(filePath: string) {
    return this.liveData.find((live) => live.parts.some((part) => part.filePath === filePath));
  }

  /**
   * 通用文件同步处理
   * @param roomId 房间ID
   * @param filePath 文件路径
   * @param fileType 文件类型
   * @param partId 分段ID（可选），用于更准确地关联直播分段
   * @param removeAfterSync 同步后是否删除源文件
   */
  async handleFileSync(
    roomId: number,
    filePath: string,
    fileType: "source" | "danmaku" | "xml" | "cover",
    partId?: string,
    removeAfterSync: boolean = false,
  ) {
    if (!(await fs.pathExists(filePath))) return;

    // 检查文件是否已经处理过
    if (this.processedFiles.has(filePath)) {
      log.info(`文件已处理过，跳过同步: ${filePath}`);
      return;
    }

    const syncConfig = this.getSyncConfig(roomId);
    if (!syncConfig) return;

    // 检查是否需要同步该类型的文件
    if (!syncConfig.targetFiles.includes(fileType)) return;

    // 准备直播信息和分段信息
    let livePart: { live: Live; part?: Part } | undefined;

    // 通过partId查找
    if (partId) {
      for (const live of this.liveData) {
        const part = live.parts.find((p) => p.partId === partId);
        if (part) {
          livePart = { live, part };
          break;
        }
      }
    }
    if (!livePart) return;

    // 将文件添加到已处理集合中
    this.processedFiles.add(filePath);
    this.fileLockManager.acquireLock(filePath, "sync");

    // 提取基本信息
    let platform: Platform = "blrec";
    // let title = "unknown";
    let username = "unknown";

    const { live } = livePart;
    platform = live.platform;
    // title = live.title;
    username = live.username;

    const liveStartTime = new Date(live.startTime);

    // 准备格式化参数
    const formatParams = {
      platform,
      user: username,
      year: liveStartTime.getFullYear(),
      month: (liveStartTime.getMonth() + 1).toString().padStart(2, "0"),
      date: liveStartTime.getDate().toString().padStart(2, "0"),
      yyyy: liveStartTime.getFullYear(),
      MM: (liveStartTime.getMonth() + 1).toString().padStart(2, "0"),
      dd: liveStartTime.getDate().toString().padStart(2, "0"),
      now: `${liveStartTime.getFullYear()}.${(liveStartTime.getMonth() + 1).toString().padStart(2, "0")}.${liveStartTime.getDate().toString().padStart(2, "0")}`,
      partId: livePart?.part?.partId || "",
    };

    // 格式化文件夹结构
    let folderStructure = syncConfig.folderStructure;
    for (const [key, value] of Object.entries(formatParams)) {
      folderStructure = folderStructure.replace(new RegExp(`{{${key}}}`, "g"), String(value));
    }

    try {
      // 调用同步函数
      const { addSyncTask } = await import("@biliLive-tools/shared/task/sync.js");
      const task = await addSyncTask({
        input: filePath,
        remotePath: folderStructure,
        retry: 3,
        policy: "skip",
        type: syncConfig.syncSource,
      });
      log.info(`开始同步${fileType}文件: ${filePath}`);

      task.on("task-end", async () => {
        // 等待65秒，确保文件被释放，不需要的原因是上传任务锁必定先执行
        // await sleep(1000 * 65);
        this.fileLockManager.releaseLock(filePath, "sync");
        log.info(`同步 ${filePath} 文件成功，是否删除文件：${removeAfterSync}`);
        // 同步后删除源文件（如果需要）
        if (removeAfterSync) {
          // 检查文件是否被锁定
          if (this.fileLockManager.isLocked(filePath)) {
            log.warn(`文件 ${filePath} 被锁定，跳过删除`);
            return;
          }
          await trashItem(filePath);
          log.info(`已删除同步后的源文件: ${filePath}`);
        }
      });
    } catch (error) {
      log.error(`同步${fileType}文件失败: ${filePath}`, error);
    }
  }

  /**
   * 处理封面同步
   * @param roomId 房间ID
   * @param coverPath 封面路径
   * @param partId 分段ID（可选）
   */
  async handleCoverSync(roomId: number, coverPath: string, partId: string) {
    return this.handleFileSync(roomId, coverPath, "cover", partId);
  }

  /**
   * 处理封面
   * @param options
   * @param {string} [options.coverPath] - 封面路径
   * @param {string} options.filePath - 文件路径
   * @returns {Promise<string | undefined>} 封面路径
   */
  async handleCover(options: {
    coverPath?: string;
    filePath: string;
  }): Promise<string | undefined> {
    let cover: string | undefined;
    if (options.coverPath) {
      cover = options.coverPath;
    } else {
      const { name, dir } = path.parse(options.filePath);
      if (await fs.pathExists(path.join(dir, `${name}.cover.jpg`))) {
        cover = path.join(dir, `${name}.cover.jpg`);
      }
      if (await fs.pathExists(path.join(dir, `${name}.jpg`))) {
        cover = path.join(dir, `${name}.jpg`);
      }
    }
    if (cover && (await fs.pathExists(cover))) {
      return cover;
    } else {
      return undefined;
    }
  }
  /**
   * 判断房间是否开启
   */
  canRoomOpen(
    roomSetting: { open: boolean } | undefined,
    webhookBlacklist: string,
    roomId: number,
  ) {
    if (roomSetting) {
      // 如果配置了房间，那么以房间设置为准
      return roomSetting.open;
    } else {
      // 如果没有配置房间，那么以黑名单为准
      const blacklist = (webhookBlacklist || "").split(",");
      if (blacklist.includes("*")) return false;
      if (blacklist.includes(String(roomId))) return false;

      return true;
    }
  }
  getConfig(roomId: number): {
    /* 是否需要压制弹幕 */
    danmu: boolean;
    /* 是否合并到一个文件中 */
    mergePart: boolean;
    /* 最小文件大小 */
    minSize: number;
    /* 上传preset */
    uploadPresetId: string;
    /* 上传标题 */
    title: string;
    /* 弹幕preset */
    danmuPresetId?: string;
    /* 视频压制preset */
    videoPresetId?: string;
    /* 是否开启 */
    open?: boolean;
    /* 上传uid */
    uid?: number;
    /* 自动合并part时间 */
    partMergeMinute: number;
    /* 高能进度条 */
    hotProgress: boolean;
    /* 使用直播封面 */
    useLiveCover: boolean;
    /** 高能进度条：采样间隔 */
    hotProgressSample?: number;
    /** 高能进度条：高度 */
    hotProgressHeight?: number;
    /** 高能进度条：默认颜色 */
    hotProgressColor?: string;
    /** 高能进度条：覆盖颜色 */
    hotProgressFillColor?: string;
    /** 转封装为mp4 */
    convert2Mp4Option?: boolean;
    /** 转封装后删除源文件 */
    removeSourceAferrConvert2Mp4?: boolean;
    /** 压制完成后的操作 */
    afterConvertAction: Array<"removeVideo" | "removeXml" | "removeAss">;
    /** 是否在处理后删除视频 */
    afterConvertRemoveVideo: boolean;
    /** 是否在处理后删除XML弹幕 */
    afterConvertRemoveXml: boolean;
    /** 限制只在某一段时间上传 */
    limitUploadTime?: boolean;
    /** 允许上传处理时间 */
    uploadHandleTime: [string, string];
    /** 同时上传无弹幕视频 */
    uploadNoDanmu: boolean;
    /** 同时上传无弹幕视频预设 */
    noDanmuVideoPreset: string;
    /** 限制只在某一段时间处理视频 */
    limitVideoConvertTime?: boolean;
    /** 允许视频处理时间 */
    videoHandleTime?: [string, string];
    /** 分p标题模板 */
    partTitleTemplate: string;
    /** 上传完成后删除操作 */
    afterUploadDeletAction: "none" | "delete" | "deleteAfterCheck";
    /** 同步器 */
    syncId?: string;
  } {
    const config = this.appConfig.getAll();
    const roomSetting: AppRoomConfig | undefined = config.webhook?.rooms?.[roomId];

    const danmu = getRoomSetting("danmu");
    const mergePart = getRoomSetting("autoPartMerge");
    const minSize = getRoomSetting("minSize") ?? 10;
    const uploadPresetId = getRoomSetting("uploadPresetId") || "default";
    const title = getRoomSetting("title") || "";
    const danmuPresetId = getRoomSetting("danmuPreset");
    const videoPresetId = getRoomSetting("ffmpegPreset");
    const uid = getRoomSetting("uid");
    let partMergeMinute = getRoomSetting("partMergeMinute") ?? 10;
    const hotProgress = getRoomSetting("hotProgress");
    const useLiveCover = getRoomSetting("useLiveCover");
    const hotProgressSample = getRoomSetting("hotProgressSample");
    const hotProgressHeight = getRoomSetting("hotProgressHeight");
    const hotProgressColor = getRoomSetting("hotProgressColor");
    const hotProgressFillColor = getRoomSetting("hotProgressFillColor");
    const convert2Mp4 = getRoomSetting("convert2Mp4");
    const removeSourceAferrConvert2Mp4 = getRoomSetting("removeSourceAferrConvert2Mp4");
    const limitVideoConvertTime = getRoomSetting("limitVideoConvertTime") ?? false;
    const videoHandleTime = getRoomSetting("videoHandleTime") || ["00:00:00", "23:59:59"];
    const syncId = getRoomSetting("syncId");

    const afterConvertAction = getRoomSetting("afterConvertAction") ?? [];
    const afterConvertRemoveVideoRaw = afterConvertAction.includes("removeVideo");
    const afterConvertRemoveXmlRaw = afterConvertAction.includes("removeXml");

    const limitUploadTime = getRoomSetting("limitUploadTime") ?? false;
    const uploadHandleTime = getRoomSetting("uploadHandleTime") || ["00:00:00", "23:59:59"];
    const uploadNoDanmu = getRoomSetting("uploadNoDanmu") ?? false;
    const noDanmuVideoPreset = getRoomSetting("noDanmuVideoPreset") || "default";

    // 如果没有开启断播续传，那么不需要合并part
    if (!mergePart) partMergeMinute = -1;
    /**
     * 获取房间配置项
     */
    function getRoomSetting<K extends keyof CommonRoomConfig>(key: K) {
      if (roomSetting) {
        if (roomSetting.noGlobal?.includes(key)) return roomSetting[key];

        return config.webhook[key];
      } else {
        return config.webhook[key];
      }
    }

    let afterConvertRemoveVideo: boolean = afterConvertRemoveVideoRaw;
    let afterConvertRemoveXml: boolean = afterConvertRemoveXmlRaw;
    // 如果存在同步器，那么使用原始配置，如果未开启，那么只有存在视频预设时才会进行删除
    if (!syncId) {
      if (videoPresetId) {
        afterConvertRemoveVideo = afterConvertRemoveVideoRaw;
      } else {
        afterConvertRemoveVideo = false;
      }
    }
    if (!syncId) {
      if (danmuPresetId) {
        afterConvertRemoveXml = afterConvertRemoveXmlRaw;
      } else {
        afterConvertRemoveXml = false;
      }
    }

    const open = this.canRoomOpen(roomSetting, config?.webhook?.blacklist, roomId);

    const options = {
      danmu,
      mergePart,
      minSize,
      uploadPresetId,
      title,
      danmuPresetId,
      videoPresetId,
      open,
      uid,
      partMergeMinute,
      hotProgress,
      useLiveCover,
      hotProgressSample,
      hotProgressHeight,
      hotProgressColor,
      hotProgressFillColor,
      convert2Mp4Option: convert2Mp4,
      removeSourceAferrConvert2Mp4,
      afterConvertAction,
      afterConvertRemoveVideo,
      afterConvertRemoveXml,
      limitUploadTime,
      uploadHandleTime,
      uploadNoDanmu,
      noDanmuVideoPreset,
      videoHandleTime: limitVideoConvertTime ? videoHandleTime : undefined,
      partTitleTemplate: getRoomSetting("partTitleTemplate") || "{{filename}}",
      afterUploadDeletAction: getRoomSetting("afterUploadDeletAction") ?? "none",
      syncId,
    };

    return options;
  }
  /**
   * 处理open事件
   * @param options
   * @param partMergeMinute 断播续传时间戳
   */
  handleOpenEvent = (options: Options, partMergeMinute: number) => {
    function getMaxEndTime(parts: Part[]) {
      return Math.max(...parts.map((item) => item.endTime || 0));
    }

    const timestamp = new Date(options.time).getTime();
    // 找到上一个文件结束时间与当前时间差小于一段时间的直播，认为是同一个直播
    let currentLive = this.liveData.find((live) => {
      // 找到part中最大的结束时间
      const endTime = getMaxEndTime(live.parts);
      return (
        live.roomId === options.roomId &&
        live.platform === options.platform &&
        (timestamp - endTime) / (1000 * 60) < (partMergeMinute || 10)
      );
    });
    if (partMergeMinute !== -1 && currentLive === undefined) {
      // 下一个"文件打开"请求时间可能早于上一个"文件结束"请求时间，如果出现这种情况，尝试特殊处理
      // 如果live的任何一个part有endTime，说明不会出现特殊情况，不需要特殊处理
      // 然后去遍历liveData，找到roomId、platform、title都相同的直播，认为是同一场直播
      currentLive = this.liveData.findLast((live) => {
        const hasEndTime = live.parts.some((item) => item.endTime);
        if (hasEndTime) {
          return false;
        } else {
          return live.roomId === options.roomId && live.platform === options.platform;
        }
      });
    }

    if (currentLive) {
      const part: Part = {
        partId: uuid(),
        startTime: timestamp,
        filePath: options.filePath,
        recordStatus: "recording",
        uploadStatus: "pending",
        rawFilePath: options.filePath,
        rawUploadStatus: "pending",
        title: options.title,
      };
      currentLive.addPart(part);
    } else {
      // 新建Live数据
      const live = new Live({
        eventId: uuid(),
        platform: options.platform,
        roomId: options.roomId,
        startTime: timestamp,
        title: options.title,
        username: options.username,
      });
      live.addPart({
        partId: uuid(),
        startTime: timestamp,
        filePath: options.filePath,
        recordStatus: "recording",
        uploadStatus: "pending",
        rawFilePath: options.filePath,
        rawUploadStatus: "pending",
        title: options.title,
      });
      this.liveData.push(live);
    }
  };

  /**
   * 处理close事件
   * @param options
   * @param partMergeMinute 断播续传时间戳
   * @returns 当前live的eventId
   */
  handleCloseEvent = (options: Options): string => {
    const timestamp = new Date(options.time).getTime();
    const currentLive = this.findLiveByFilePath(options.filePath);

    if (currentLive) {
      const currentPart = currentLive.findPartByFilePath(options.filePath);
      if (currentPart) {
        currentLive.updatePartValue(currentPart.partId, "endTime", timestamp);
        currentLive.updatePartValue(currentPart.partId, "recordStatus", "recorded");

        const partIndex = currentLive.parts.findIndex((part) => part.partId === currentPart.partId);
        for (let i = 0; i < partIndex; i++) {
          const part = currentLive.parts[i];
          if (part.recordStatus === "recording") {
            log.error("下一个录制完成时，上一个录制仍在录制中，设置为成功", part);
            currentLive.updatePartValue(part.partId, "recordStatus", "recorded");
          }
        }
      }
    } else {
      const liveEventId = uuid();
      const live = new Live({
        eventId: liveEventId,
        platform: options.platform,
        roomId: options.roomId,
        title: options.title,
        username: options.username,
        startTime: timestamp,
      });
      // TODO: 通过视频或者弹幕元数据获取开始时间
      live.addPart({
        partId: uuid(),
        filePath: options.filePath,
        endTime: timestamp,
        recordStatus: "recorded",
        uploadStatus: "pending",
        rawFilePath: options.filePath,
        rawUploadStatus: "pending",
        title: options.title,
      });
      this.liveData.push(live);

      return liveEventId;
    }
    return currentLive.eventId;
  };

  /**
   * 处理FileOpening和FileClosed事件
   */
  async handleLiveData(options: Options, partMergeMinute: number): Promise<number> {
    if (options.event === EventType.OpenEvent) {
      await sleep(1000);
      this.handleOpenEvent(options, partMergeMinute);
      return -1;
    } else if (options.event === EventType.CloseEvent) {
      const liveId = this.handleCloseEvent(options);
      const index = this.liveData.findIndex((live) => live.eventId === liveId);
      return index;
    } else {
      throw new Error(`不支持的事件：${options.event}`);
    }
  }

  // 转封装为mp4
  async transcode(
    videoFile: string,
    preset: FfmpegOptions,
    options: {
      removeVideo: boolean;
      suffix?: string;
      limitTime?: [string, string];
    },
  ): Promise<string> {
    const { dir, name } = path.parse(videoFile);
    const outputName = `${name}${options.suffix ?? ""}.mp4`;

    const output = path.join(dir, outputName);
    if (await fs.pathExists(output)) return output;

    if (preset.pkOptimize) {
      try {
        const resolutionChanges = await analyzeResolutionChanges(videoFile);
        if (resolutionChanges.length <= 1) {
          log.info("分辨率没有变化，不进行转码", resolutionChanges);
          return videoFile;
        }
      } catch (error) {
        log.error("分析分辨率变化失败", error);
      }
    }

    return new Promise((resolve, reject) => {
      transcode(videoFile, outputName, preset, {
        saveType: 2,
        savePath: dir,
        override: false,
        removeOrigin: options.removeVideo,
      }).then((task) => {
        task.on("task-end", () => {
          resolve(task.output as string);
        });
        task.on("task-error", () => {
          reject();
        });
      });
    });
  }

  burn = (
    files: { videoFilePath: string; subtitleFilePath: string },
    options: {
      danmaOptions: DanmuConfig;
      ffmpegOptions: FfmpegOptions;
      hotProgressOptions: Omit<HotProgressOptions, "videoPath">;
      hasHotProgress: boolean;
      removeVideo?: boolean;
      removeDanmu?: boolean;
      limitTime?: [string, string];
    },
  ): Promise<string> => {
    const videoInput = files.videoFilePath;
    const suffix = "弹幕版";
    const file = path.parse(videoInput);
    return new Promise((resolve, reject) => {
      let output = path.join(file.dir, `${file.name}-${suffix}.mp4`);
      fs.pathExists(output)
        .then((exists) => {
          if (exists) {
            output = path.join(file.dir, `${file.name}-${suffix}-${uuid()}.mp4`);
          }
        })
        .then(() => {
          burn(files, output, {
            ...options,
            removeOrigin: false,
            override: false,
          }).then((task) => {
            task.on("task-end", () => {
              if (options.removeVideo) {
                trashItem(files.videoFilePath);
              }
              if (options.removeDanmu) {
                trashItem(files.subtitleFilePath);
              }
              resolve(output);
            });
            task.on("task-error", ({ error }) => {
              reject(new Error(error));
            });
          });
        });
    });
  };

  convertDanmu = (
    xmlFilePath: string,
    danmuConfig: DanmuConfig,
    options: {
      removeXml?: boolean;
    } = {},
  ): Promise<string> => {
    const file = path.parse(xmlFilePath);
    const outputName = path.basename(xmlFilePath, ".xml");
    const outputPath = path.join(file.dir, `${outputName}.ass`);

    return new Promise((resolve, reject) => {
      convertXml2Ass({ input: xmlFilePath, output: outputName }, danmuConfig, {
        saveRadio: 1,
        savePath: file.dir,
        removeOrigin: false,
      })
        .then((task) => {
          task.on("task-end", () => {
            if (options.removeXml) {
              trashItem(xmlFilePath);
            }
            resolve(outputPath);
          });
          task.on("task-error", ({ error }) => {
            reject(new Error(error));
          });
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  addUploadTask = async (
    uid: number,
    pathArray: {
      path: string;
      title: string;
    }[],
    options: BiliupConfig,
    limitedUploadTime: [] | [string, string],
    afterUploadDeletAction?: "none" | "delete" | "deleteAfterCheck",
  ) => {
    return new Promise((resolve, reject) => {
      // 如果是审核后删除，需要额外加锁
      if (afterUploadDeletAction === "deleteAfterCheck") {
        for (const { path } of pathArray) {
          this.fileLockManager.acquireLock(path, "deleteAfterCheck");
        }
      }
      biliApi
        .addMedia(pathArray, options, uid, {
          limitedUploadTime,
          afterUploadDeletAction: "none",
          forceCheck: afterUploadDeletAction === "deleteAfterCheck",
          checkCallback: (status) => {
            if (status === "completed") {
              for (const { path } of pathArray) {
                this.fileLockManager.releaseLock(path, "deleteAfterCheck");
                const isLocked = this.fileLockManager.isLocked(path);
                if (!isLocked) {
                  if (afterUploadDeletAction === "deleteAfterCheck") {
                    trashItem(path);
                  }
                }
              }
            }
          },
        })
        .then((task) => {
          task.on("task-end", () => {
            // 释放所有文件的锁
            for (const { path } of pathArray) {
              this.fileLockManager.releaseLock(path, "upload");
            }
            if (afterUploadDeletAction === "delete") {
              for (const { path } of pathArray) {
                const isLocked = this.fileLockManager.isLocked(path);
                if (!isLocked) {
                  trashItem(path);
                }
              }
            }
            resolve(task.output);
          });
          task.on("task-error", () => {
            reject();
          });
          task.on("task-cancel", () => {
            reject();
          });
        })
        .catch(() => {
          reject();
        });
    });
  };

  addEditMediaTask = async (
    uid: number,
    aid: number,
    pathArray: {
      path: string;
      title: string;
    }[],
    limitedUploadTime: [string, string] | [],
    afterUploadDeletAction?: "none" | "delete" | "deleteAfterCheck",
  ) => {
    return new Promise((resolve, reject) => {
      // 如果是审核后删除，需要额外加锁
      if (afterUploadDeletAction === "deleteAfterCheck") {
        for (const { path } of pathArray) {
          this.fileLockManager.acquireLock(path, "deleteAfterCheck");
        }
      }
      biliApi
        .editMedia(aid, pathArray, {}, uid, {
          limitedUploadTime: limitedUploadTime,
          afterUploadDeletAction: "none",
          forceCheck: afterUploadDeletAction === "deleteAfterCheck",
          checkCallback: (status) => {
            if (status === "completed") {
              for (const { path } of pathArray) {
                this.fileLockManager.releaseLock(path, "deleteAfterCheck");
                const isLocked = this.fileLockManager.isLocked(path);
                if (!isLocked) {
                  if (afterUploadDeletAction === "deleteAfterCheck") {
                    trashItem(path);
                  }
                }
              }
            }
          },
        })
        .then((task) => {
          task.on("task-end", () => {
            // 释放所有文件的锁
            for (const { path } of pathArray) {
              this.fileLockManager.releaseLock(path, "upload");
            }
            if (afterUploadDeletAction === "delete") {
              for (const { path } of pathArray) {
                const isLocked = this.fileLockManager.isLocked(path);
                if (!isLocked) {
                  trashItem(path);
                }
              }
            }
            resolve(task.output);
          });
          task.on("task-error", () => {
            reject();
          });
          task.on("task-cancel", () => {
            reject();
          });
        })
        .catch(() => {
          reject();
        });
    });
  };

  handleLive = async (live: Live, type?: "handled" | "raw") => {
    /**
     * @param type 区分是弹幕版还是原始版
     * raw: 非弹幕版
     * handled: 弹幕版
     */
    const uploadVideo = async (type: "raw" | "handled") => {
      const updateStatusField = type === "handled" ? "uploadStatus" : "rawUploadStatus";
      const filePathField = type === "handled" ? "filePath" : "rawFilePath";
      const aidField = type === "handled" ? "aid" : "rawAid";

      // 不要有两个任务同时上传
      const isUploading = live.parts.some((item) => item[updateStatusField] === "uploading");
      if (isUploading) return;

      // 过滤掉错误的视频
      const filterParts = live.parts.filter((item) => item[updateStatusField] !== "error");
      if (filterParts.length === 0) return;

      const {
        uploadPresetId,
        uid,
        useLiveCover,
        limitUploadTime,
        uploadHandleTime,
        title,
        uploadNoDanmu,
        noDanmuVideoPreset,
        partTitleTemplate,
        afterUploadDeletAction,
      } = this.getConfig(live.roomId);

      let cover: string | undefined;
      let indexMap: {
        handled: number;
        raw: number;
      } = {
        handled: 1,
        raw: 1,
      };
      // 需要上传的视频列表
      const filePaths: {
        part: Part;
        path: string;
        title: string;
      }[] = [];
      // 找到前几个为handled的part
      for (let i = 0; i < filterParts.length; i++) {
        const part = filterParts[i];
        if (part[updateStatusField] === "uploaded") {
          indexMap[type] = indexMap[type] + 1;
          continue;
        }
        const filename = path.parse(part[filePathField]).name;
        const title = formatPartTitle(
          {
            title: part.title,
            username: live.username,
            roomId: live.roomId,
            time: part?.startTime
              ? new Date(part.startTime).toISOString()
              : new Date().toISOString(),
            filename,
            index: indexMap[type],
          },
          partTitleTemplate ?? "{{filename}}",
        );

        if (type === "handled") {
          if (part.recordStatus === "handled") {
            filePaths.push({ path: part[filePathField], title, part });
          } else {
            break;
          }
        } else if (type === "raw") {
          if (part.recordStatus == "prehandled" || part.recordStatus === "handled") {
            filePaths.push({ path: part[filePathField], title, part });
          } else {
            break;
          }
        } else {
          throw new Error("type error");
        }

        if (!cover) cover = part.cover;
        indexMap[type] = indexMap[type] + 1;
      }
      if (filePaths.length === 0) return;

      if (!uid) {
        for (let i = 0; i < filePaths.length; i++) {
          filePaths[i].part[updateStatusField] = "error";
        }
        return;
      }

      // 如果是非弹幕版，但是不允许上传无弹幕视频，那么直接设置为error
      if (type === "raw" && !uploadNoDanmu) {
        for (let i = 0; i < filePaths.length; i++) {
          filePaths[i].part[updateStatusField] = "error";
        }
        return;
      }

      const limitedUploadTime: [] | [string, string] = limitUploadTime ? uploadHandleTime : [];

      let uploadPreset = DEFAULT_BILIUP_CONFIG;
      const presetId = type === "handled" ? uploadPresetId : noDanmuVideoPreset;
      const preset = await this.videoPreset.get(presetId);
      uploadPreset = { ...uploadPreset, ...(preset?.config ?? {}) };
      if (useLiveCover) {
        uploadPreset.cover = cover;
      }

      try {
        filePaths.map((item) => {
          item.part[updateStatusField] = "uploading";
        });
        if (live[aidField]) {
          log.info("续传", filePaths);
          await this.addEditMediaTask(
            uid,
            live[aidField],
            filePaths.map((item) => {
              return {
                path: item.path,
                title: item.title,
              };
            }),
            limitedUploadTime,
            type === "raw" ? "none" : afterUploadDeletAction,
          );
          filePaths.map((item) => {
            item.part[updateStatusField] = "uploaded";
          });
        } else {
          const part = filePaths[0].part;
          const filename = path.parse(part[filePathField]).name;

          let template = uploadPreset.title;
          if (type === "handled") {
            const list = [
              "{{title}}",
              "{{user}}",
              "{{roomId}}",
              "{{now}}",
              "{{yyyy}}",
              "{{MM}}",
              "{{dd}}",
              "{{HH}}",
              "{{mm}}",
              "{{ss}}",
              "{{filename}}",
            ];
            // 目前如果预设标题中不存在占位符，为了兼容性考虑，依然使用webhook配置，预计后续版本中会移除此字段
            if (!list.some((item) => template.includes(item))) {
              template = title;
            }
          }
          const videoTitle = formatTitle(
            {
              title: live.title,
              username: live.username,
              roomId: live.roomId,
              time: part?.startTime
                ? new Date(part.startTime).toISOString()
                : new Date().toISOString(),
              filename,
            },
            template,
          );
          uploadPreset.title = videoTitle;

          log.info("上传", afterUploadDeletAction);

          const aid = (await this.addUploadTask(
            uid,
            filePaths.map((item) => {
              return {
                path: item.path,
                title: item.title,
              };
            }),
            uploadPreset,
            limitedUploadTime,
            type === "raw" ? "none" : afterUploadDeletAction,
          )) as number;
          live[aidField] = Number(aid);

          // 设置状态为成功
          filePaths.map((item) => {
            item.part[updateStatusField] = "uploaded";
          });
        }
      } catch (error) {
        log.error(error);
        // 设置状态为失败
        filePaths.map((item) => {
          item.part[updateStatusField] = "error";
        });
      }
    };

    if (type) {
      if (type === "handled") {
        await uploadVideo("handled");
      } else if (type === "raw") {
        await uploadVideo("raw");
      } else {
        throw new Error("type error");
      }
    } else {
      await Promise.all([uploadVideo("handled"), uploadVideo("raw")]);
    }
  };

  /**
   * 获取同步配置
   */
  getSyncConfig(roomId: number) {
    const { syncId } = this.getConfig(roomId);
    if (!syncId) return null;
    const config = this.appConfig.getAll();
    const syncConfig = config.sync.syncConfigs.find((cfg) => cfg.id === syncId);
    if (!syncConfig) return null;
    return syncConfig;
  }

  /**
   * 同步中是否存在对应类型
   */
  async hasTypeInSync(roomId: number, type: "source" | "danmaku" | "xml" | "cover") {
    const syncConfig = this.getSyncConfig(roomId);
    if (!syncConfig) return false;

    // raw对应mp4,handled对应flv
    return syncConfig.targetFiles.includes(type);
  }

  /**
   * 处理弹幕文件同步和删除
   * @param roomId 房间ID
   * @param xmlFilePath 弹幕文件路径
   * @param partId 分段ID
   * @param shouldRemoveAfterSync 是否在同步后删除源文件
   */
  async handleDanmuSync(
    roomId: number,
    xmlFilePath: string,
    partId: string,
    shouldRemoveAfterSync: boolean,
  ) {
    // 检查文件是否存在
    if (!xmlFilePath) return;
    if (!(await fs.pathExists(xmlFilePath))) {
      log.error(`弹幕文件不存在: ${xmlFilePath}`);
      return;
    }

    try {
      const shouldSync = await this.hasTypeInSync(roomId, "xml");
      if (!shouldSync) {
        if (shouldRemoveAfterSync) {
          await trashItem(xmlFilePath);
        }
        return;
      }
      await sleep(2000);
      // 首先同步弹幕文件
      await this.handleFileSync(roomId, xmlFilePath, "xml", partId, shouldRemoveAfterSync);
    } catch (error) {
      log.error(`处理弹幕同步失败: ${xmlFilePath}`, error);
    }
  }

  /**
   * 处理原始视频文件删除和同步
   * @param roomId 房间ID
   * @param filePath 视频文件路径
   * @param partId 分段ID
   * @param shouldRemove 是否在操作后删除源文件
   */
  async handleVideoSync(roomId: number, filePath: string, partId: string, shouldRemove: boolean) {
    // 检查文件是否存在
    if (!filePath) return;
    if (!(await fs.pathExists(filePath))) {
      log.error(`视频文件不存在: ${filePath}`);
      return;
    }

    try {
      let fileType: "source" | "danmaku" = "source";
      if (filePath.includes("-弹幕版") || filePath.includes("-后处理")) {
        fileType = "danmaku";
      }

      const shouldSync = await this.hasTypeInSync(roomId, fileType);
      if (!shouldSync) {
        if (shouldRemove && fileType === "source" && !this.fileLockManager.isLocked(filePath)) {
          await trashItem(filePath);
        }
        return;
      }

      await sleep(2000);
      // 首先同步视频文件
      await this.handleFileSync(roomId, filePath, fileType, partId, shouldRemove);
    } catch (error) {
      log.error(`处理视频同步失败: ${filePath}`, error);
    }
  }
}
