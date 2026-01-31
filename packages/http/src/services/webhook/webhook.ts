import path from "node:path";
import fs from "fs-extra";

import { FFmpegPreset, VideoPreset, DanmuPreset } from "@biliLive-tools/shared";
import { DEFAULT_BILIUP_CONFIG } from "@biliLive-tools/shared/presets/videoPreset.js";
import { biliApi } from "@biliLive-tools/shared/task/bili.js";
import { isEmptyDanmu, convertXml2Ass } from "@biliLive-tools/shared/task/danmu.js";
import { transcode, burn, analyzeResolutionChanges } from "@biliLive-tools/shared/task/video.js";
import { flvRepair } from "@biliLive-tools/shared/task/flvRepair.js";
import log from "@biliLive-tools/shared/utils/log.js";
import {
  getFileSize,
  uuid,
  trashItem,
  formatTitle,
  formatPartTitle,
} from "@biliLive-tools/shared/utils/index.js";

import { config } from "../../index.js";
import FileRefManager from "./fileRefManager.js";
import { ConfigManager } from "./ConfigManager.js";
import { PathResolver } from "./PathResolver.js";
import { Live, Part, LiveManager } from "./Live.js";
import { buildRoomLink } from "./utils.js";
import { EventBufferManager } from "./EventBufferManager.js";
import type { MatchedEventPair } from "./EventBufferManager.js";

import type {
  BiliupConfig,
  FfmpegOptions,
  DanmuConfig,
  HotProgressOptions,
} from "@biliLive-tools/types";
import type { AppConfig } from "@biliLive-tools/shared/config.js";
import type { Options, Platform } from "../../types/webhook.js";
import type { RoomConfig } from "./ConfigManager.js";

export const enum EventType {
  OpenEvent = "FileOpening",
  CloseEvent = "FileClosed",
  ErrorEvent = "FileError",
}

export class WebhookHandler {
  liveManager: LiveManager = new LiveManager();
  ffmpegPreset: FFmpegPreset;
  videoPreset: VideoPreset;
  danmuPreset: DanmuPreset;
  appConfig: AppConfig;
  configManager: ConfigManager;
  private processedFiles: Set<string> = new Set();
  private fileRefManager: FileRefManager = new FileRefManager();
  eventBufferManager: EventBufferManager = new EventBufferManager();

  /**
   * 获取 liveData 数组（向后兼容）
   */
  get liveData(): Live[] {
    return this.liveManager.liveData;
  }

  /**
   * 设置 liveData 数组（向后兼容）
   */
  set liveData(lives: Live[]) {
    this.liveManager.liveData = lives;
  }

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
    this.configManager = new ConfigManager(appConfig);

    // 监听事件缓冲管理器的匹配事件
    this.eventBufferManager.on("process", (pair: MatchedEventPair) => {
      this.handleMatchedPair(pair);
    });
  }

  async handle(options: Options) {
    const config = this.configManager.getConfig(options.roomId);

    if (!config.open) {
      log.info(`${options.roomId} is not open`);
      return;
    }

    // 则将事件添加到缓冲区
    if (options.event === EventType.OpenEvent || options.event === EventType.CloseEvent) {
      this.eventBufferManager.addEvent(options);
      return;
    } else if (options.event === EventType.ErrorEvent) {
      // 直接处理错误事件
      this.handleLiveData(options, config);
      return;
    } else {
      log.warn(`[WebhookHandler] 未知事件类型: ${options.event}`);
      throw new Error(`未知事件类型: ${options.event}`);
    }
  }

  /**
   * 处理匹配的事件对
   */
  private async handleMatchedPair(pair: MatchedEventPair) {
    log.info(`[EventBuffer] 处理匹配的事件对: ${pair.open.filePath}`);

    const config = this.configManager.getConfig(pair.open.roomId);
    if (!config.open) {
      log.info(`${pair.open.roomId} is not open`);
      return;
    }
    // 检查文件大小
    if (!(await this.validateFileSize(config, pair.close))) {
      return;
    }

    // 先处理 open 事件
    this.handleOpenEvent(pair.open, config.partMergeMinute);
    // 处理 close 事件
    const partId = this.handleCloseEvent(pair.close);

    await this.processEvent(partId, pair.close, config);
  }

  collectTasks(
    filePath: string,
    fileType: "originVideo" | "xml" | "ass" | "cover" | "handledVideo",
    config: RoomConfig,
  ) {
    const syncConfig = this.configManager.getSyncConfig(config.roomId);
    if (fileType === "originVideo") {
      // 原始视频，可能被转码、同步、上传非弹幕版
      const shouldRemove = config.afterConvertRemoveVideoRaw;
      if (config.videoPresetId) {
        this.fileRefManager.addRef(filePath, shouldRemove);
      }
      if (syncConfig?.targetFiles.includes("source")) {
        this.fileRefManager.addRef(filePath, shouldRemove);
      }
      if (config.uid) {
        const shouldRemove =
          config.afterUploadDeletAction === "delete" ||
          config.afterUploadDeletAction === "deleteAfterCheck";

        if (config.uploadNoDanmu) {
          this.fileRefManager.addRef(filePath, shouldRemove);
          if (config.afterUploadDeletAction === "deleteAfterCheck") {
            this.fileRefManager.addRef(filePath, shouldRemove);
          }
        }
      }
    } else if (fileType === "xml") {
      // xml弹幕文件，可能被转换或者同步
      const shouldRemove = config.afterConvertRemoveXmlRaw;
      if (config.danmuPresetId) {
        this.fileRefManager.addRef(filePath, shouldRemove);
      }
      if (syncConfig?.targetFiles.includes("xml")) {
        this.fileRefManager.addRef(filePath, shouldRemove);
      }
    } else if (fileType === "ass") {
      // ass文件，可能被转换
      const shouldRemove = config.afterConvertRemoveVideoRaw;
      if (config.videoPresetId) {
        this.fileRefManager.addRef(filePath, shouldRemove);
      }
    } else if (fileType === "cover") {
      // 封面文件，可能被上传、非弹幕上传、同步
      const shouldRemove =
        config.afterUploadDeletAction === "delete" ||
        config.afterUploadDeletAction === "deleteAfterCheck";
      if (syncConfig?.targetFiles.includes("cover")) {
        this.fileRefManager.addRef(filePath, shouldRemove);

        if (config.afterUploadDeletAction === "deleteAfterCheck") {
          this.fileRefManager.addRef(filePath, shouldRemove);
        }
      }
      if (config.uid) {
        if (config.uploadNoDanmu) {
          this.fileRefManager.addRef(filePath, shouldRemove);
        }
        if (config.uploadPresetId) {
          this.fileRefManager.addRef(filePath, shouldRemove);
        }
      }
    } else if (fileType === "handledVideo") {
      // 处理后的视频文件，可能被上传、非弹幕上传、同步
      if (syncConfig?.targetFiles.includes("danmaku")) {
        const shouldRemove = config.afterConvertRemoveVideoRaw;
        this.fileRefManager.addRef(filePath, shouldRemove);
      }
      if (config.uid) {
        const shouldRemove =
          config.afterUploadDeletAction === "delete" ||
          config.afterUploadDeletAction === "deleteAfterCheck";

        this.fileRefManager.addRef(filePath, shouldRemove);
        if (config.afterUploadDeletAction === "deleteAfterCheck") {
          this.fileRefManager.addRef(filePath, shouldRemove);
        }
      }
    } else {
      log.warn(`[collectTasks] 未知文件类型: ${fileType}`);
    }
  }

  /**
   * 处理单个事件（从原 handle 方法提取）
   */
  private async processEvent(partId: string, options: Options, config: RoomConfig) {
    // 1. 如果是开始或错误事件,直接返回
    if (this.shouldSkipProcessing(options.event)) return;

    // 2. 获取当前直播和分段
    const context = this.liveManager.findBy({ partId });
    if (!context) return;

    log.debug(context.live);

    // 3. 转封装处理
    await this.processConversion(context, options, config);

    // 4. 设置预处理状态
    context.part.recordStatus = "prehandled";

    // 收集需要执行的操作并添加计数
    const xmlFilePath = PathResolver.getDanmuPath(options.filePath, options.danmuPath);
    this.collectTasks(options.filePath, "originVideo", config);
    this.collectTasks(xmlFilePath, "xml", config);
    if (context.part.cover) {
      this.collectTasks(context.part.cover, "cover", config);
    }

    // 5. 处理弹幕和视频压制
    const processingResult = await this.processMediaFiles(context, options, config, xmlFilePath);
    log.debug("processingResult", processingResult, options.filePath, context.part.filePath);
    this.collectTasks(context.part.filePath, "handledVideo", config);
    if (processingResult.conversionSuccessful) {
      this.fileRefManager.releaseRef(options.filePath);
    }
    if (xmlFilePath && processingResult.danmuConversionSuccessful) {
      this.fileRefManager.releaseRef(xmlFilePath);
    }

    // 6. 处理文件同步和锁定
    await this.handlePostProcessing(context, options);
  }

  /**
   * 判断是否应该跳过后续处理
   */
  private shouldSkipProcessing(event: string): boolean {
    return event === EventType.OpenEvent || event === EventType.ErrorEvent;
  }

  /**
   * 验证文件大小
   */
  private async validateFileSize(config: RoomConfig, options: Options): Promise<boolean> {
    const fileSize = await getFileSize(options.filePath);
    const fileSizeMB = fileSize / 1024 / 1024;

    if (fileSizeMB >= config.minSize) {
      return true;
    }

    log.warn(`${options.filePath}: file size is too small (${fileSizeMB}MB)`);

    if (config.removeSmallFile) {
      try {
        log.warn("small file should be deleted", options.filePath);
        trashItem(options.filePath);

        const cover = PathResolver.getCoverPath(options.filePath, options.coverPath);
        if (cover) {
          trashItem(cover);
        }
        const xmlFilePath = PathResolver.getDanmuPath(options.filePath, options.danmuPath);
        if (xmlFilePath) {
          trashItem(xmlFilePath);
        }
      } catch (error) {
        log.error("small file deletion error", error);
      }
    }

    return false;
  }

  /**
   * 转封装处理
   */
  private async processConversion(
    context: { live: Live; part: Part },
    options: Options,
    config: RoomConfig,
  ) {
    if (!config.convert2Mp4Option) return;

    try {
      const file = await this.transcode(
        options.filePath,
        {
          encoder: "copy",
          audioCodec: "copy",
        },
        {
          removeVideo: config.removeSourceAferrConvert2Mp4 ?? true,
        },
      );

      options.filePath = file;
      context.part.filePath = file;
      context.part.rawFilePath = file;
    } catch (error) {
      log.error("convert2Mp4 error", error);
    }
  }

  /**
   * 处理媒体文件(弹幕压制或视频处理)
   */
  private async processMediaFiles(
    context: { live: Live; part: Part },
    options: Options,
    config: RoomConfig,
    xmlFilePath: string,
  ): Promise<{ conversionSuccessful: boolean; danmuConversionSuccessful: boolean }> {
    if (config.danmu) {
      return this.processDanmuVideo(context, options, config, xmlFilePath);
    } else {
      return this.processRegularVideo(context, options, config, xmlFilePath);
    }
  }

  /**
   * 处理弹幕压制视频
   */
  private async processDanmuVideo(
    context: { live: Live; part: Part },
    options: Options,
    config: RoomConfig,
    xmlFilePath: string,
  ): Promise<{ conversionSuccessful: boolean; danmuConversionSuccessful: boolean }> {
    try {
      // 验证弹幕文件
      if (!(await fs.pathExists(xmlFilePath)) || (await isEmptyDanmu(xmlFilePath))) {
        context.part.recordStatus = "handled";
        context.part.uploadStatus = "pending";
        log.warn(`弹幕文件不存在或为空，跳过弹幕压制: ${xmlFilePath}`);
        return { conversionSuccessful: true, danmuConversionSuccessful: true };
      }

      // 验证预设
      if (!config.danmuPresetId || !config.videoPresetId) {
        context.part.uploadStatus = "error";
        throw new Error(`没有找到预设${config.danmuPresetId}或${config.videoPresetId}`);
      }

      // 获取配置
      const danmuConfig = await this.danmuPreset.get(config.danmuPresetId);
      const ffmpegPreset = await this.ffmpegPreset.get(config.videoPresetId);

      if (!danmuConfig || !ffmpegPreset) {
        throw new Error(`无法获取预设配置 ${config.danmuPresetId} 或 ${config.videoPresetId}`);
      }

      // 压制视频
      const output = await this.burn(
        {
          videoFilePath: options.filePath,
          subtitleFilePath: xmlFilePath,
        },
        {
          danmaOptions: danmuConfig.config,
          ffmpegOptions: ffmpegPreset.config,
          hasHotProgress: config.hotProgress,
          hotProgressOptions: {
            interval: config.hotProgressSample || 30,
            color: config.hotProgressColor || "#f9f5f3",
            fillColor: config.hotProgressFillColor || "#333333",
            height: config.hotProgressHeight || 60,
          },
          removeVideo: false,
          removeDanmu: false,
          limitTime: config.videoHandleTime,
        },
      );

      context.part.filePath = output;
      context.part.recordStatus = "handled";

      return { conversionSuccessful: true, danmuConversionSuccessful: true };
    } catch (error) {
      log.error(error);
      context.part.uploadStatus = "error";
      return { conversionSuccessful: false, danmuConversionSuccessful: false };
    }
  }

  /**
   * 处理常规视频(无弹幕压制)
   */
  private async processRegularVideo(
    context: { live: Live; part: Part },
    options: Options,
    config: RoomConfig,
    xmlFilePath: string,
  ): Promise<{ conversionSuccessful: boolean; danmuConversionSuccessful: boolean }> {
    let conversionSuccessful = true;
    let danmuConversionSuccessful = true;

    // 处理视频转码
    if (config.videoPresetId) {
      try {
        const preset = await this.ffmpegPreset.get(config.videoPresetId);
        if (!preset) {
          throw new Error(`ffmpegPreset not found ${config.videoPresetId}`);
        }
        const output = await this.transcode(options.filePath, preset.config, {
          removeVideo: false,
          suffix: "-后处理",
          limitTime: config.videoHandleTime,
        });
        context.part.filePath = output;
      } catch (error) {
        log.error(error);
        context.part.uploadStatus = "error";
        conversionSuccessful = false;
      }
    }

    context.part.recordStatus = "handled";

    // 处理弹幕转换
    if (config.danmuPresetId) {
      try {
        const preset = await this.danmuPreset.get(config.danmuPresetId);
        if (!preset) {
          throw new Error(`danmuPreset not found ${config.danmuPresetId}`);
        }
        await this.convertDanmu(xmlFilePath, preset.config);
      } catch (error) {
        log.error(error);
        danmuConversionSuccessful = false;
      }
    }

    return { conversionSuccessful, danmuConversionSuccessful };
  }

  /**
   * 处理后续操作(同步、锁定等)
   */
  private async handlePostProcessing(context: { live: Live; part: Part }, options: Options) {
    const { part } = context;

    // 处理封面同步
    if (part.cover) {
      await this.handleFileSync(options.roomId, part.cover, "cover", part.partId).catch((error) => {
        log.error("handleCoverSync", error);
      });
    }

    // 处理弹幕同步
    const xmlFilePath = PathResolver.getDanmuPath(options.filePath, options.danmuPath);
    if (xmlFilePath) {
      await this.handleFileSync(options.roomId, xmlFilePath, "xml", part.partId).catch((error) => {
        log.error("handleFileSync", error);
      });
    }

    // 处理视频同步1
    const fileType = PathResolver.getFileType(part.rawFilePath);
    await this.handleFileSync(options.roomId, part.rawFilePath, fileType, part.partId).catch(
      (error) => {
        log.error("handleFileSync", error);
      },
    );

    // 处理视频同步2
    const fileType2 = PathResolver.getFileType(part.filePath);
    await this.handleFileSync(options.roomId, part.filePath, fileType2, part.partId).catch(
      (error) => {
        log.error("handleFileSync", error);
      },
    );
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
    roomId: string,
    filePath: string,
    fileType: "source" | "danmaku" | "xml" | "cover",
    partId: string,
  ) {
    if (!(await fs.pathExists(filePath))) return;

    // 检查文件是否已经处理过
    if (this.processedFiles.has(filePath)) {
      log.info(`文件已处理过，跳过同步: ${filePath}`);
      return;
    }

    const syncConfig = this.configManager.getSyncConfig(roomId);
    if (!syncConfig) return;

    // 检查是否需要同步该类型的文件
    if (!syncConfig.targetFiles.includes(fileType)) return;

    // 准备直播信息和分段信息
    const livePart = this.liveManager.findBy({ partId });
    if (!livePart) return;

    // 将文件添加到已处理集合中
    this.processedFiles.add(filePath);

    // 提取基本信息
    let platform: Platform = "blrec";
    // let title = "unknown";
    let username = "unknown";

    const { live } = livePart;
    platform = live.platform;
    // title = live.title;
    username = live.username;

    const liveStartTime = new Date(live.startTime);

    // 格式化文件夹结构
    const folderStructure = PathResolver.formatFolderStructure(syncConfig.folderStructure, {
      platform,
      user: username,
      software: live.software,
      liveStartTime,
    });

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
        log.info(`同步 ${filePath} 文件成功`);
        await this.fileRefManager.releaseRef(filePath);
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
  async handleCoverSync(roomId: string, coverPath: string, partId: string) {
    return this.handleFileSync(roomId, coverPath, "cover", partId);
  }

  /**
   * 处理open事件
   * @param options
   * @param partMergeMinute 断播续传时间戳
   */
  handleOpenEvent = (options: Options, partMergeMinute: number) => {
    const timestamp = new Date(options.time).getTime();

    // 找到上一个文件结束时间与当前时间差小于一段时间的直播，认为是同一个直播
    let currentLive = this.liveManager.findRecentLive(
      options.roomId,
      options.software,
      partMergeMinute || 10,
      timestamp,
    );

    // if (partMergeMinute !== -1 && currentLive === undefined) {
    //   // 下一个"文件打开"请求时间可能早于上一个"文件结束"请求时间，如果出现这种情况，尝试特殊处理
    //   // 如果live的任何一个part有endTime，说明不会出现特殊情况，不需要特殊处理
    //   // 然后去遍历liveData，找到roomId、software、title都相同的直播，认为是同一场直播
    //   currentLive = this.liveManager.findLastLiveByRoomAndPlatform(
    //     options.roomId,
    //     options.software,
    //   );
    // }

    if (currentLive) {
      currentLive.addPart({
        startTime: timestamp,
        filePath: options.filePath,
        recordStatus: "recording",
        title: options.title,
      });
    } else {
      // 新建Live数据
      const live = new Live({
        platform: options.platform,
        software: options.software,
        roomId: options.roomId,
        startTime: timestamp,
        title: options.title,
        username: options.username,
      });
      live.addPart({
        startTime: timestamp,
        filePath: options.filePath,
        recordStatus: "recording",
        uploadStatus: "pending",
        rawFilePath: options.filePath,
        rawUploadStatus: "pending",
        title: options.title,
      });
      this.liveManager.addLive(live);
    }
  };

  /**
   * 处理close事件
   * @param options
   * @param partMergeMinute 断播续传时间戳
   * @returns 当前part的partId
   */
  handleCloseEvent = (options: Options): string => {
    const timestamp = new Date(options.time).getTime();
    const data = this.liveManager.findBy({ filePath: options.filePath });

    // 检查文件是否存在,尝试替换扩展名
    const file = PathResolver.tryMp4Fallback(options.filePath);
    options.filePath = file;

    let cover: string;
    try {
      cover = PathResolver.getCoverPath(options.filePath, options.coverPath);
    } catch (error) {
      log.error("获取封面失败", error);
      cover = "";
    }

    if (data?.live) {
      const currentLive = data.live;
      const currentPart = data.part;
      currentLive.updatePartValue(currentPart.partId, "endTime", timestamp);
      currentLive.updatePartValue(currentPart.partId, "recordStatus", "recorded");
      currentLive.updatePartValue(currentPart.partId, "cover", cover);
      // 更新文件路径
      currentLive.updatePartValue(currentPart.partId, "filePath", file);
      currentLive.updatePartValue(currentPart.partId, "rawFilePath", file);
      // const partIndex = currentLive.parts.findIndex((part) => part.partId === currentPart.partId);
      // for (let i = 0; i < partIndex; i++) {
      //   const part = currentLive.parts[i];
      //   if (part.recordStatus === "recording") {
      //     // TODO: 之后要移除这个处理
      //     log.error("下一个录制完成时，上一个录制仍在录制中，设置为错误", part);
      //     currentLive.updatePartValue(part.partId, "recordStatus", "error");
      //   }
      // }

      return currentPart.partId;
    } else {
      const live = new Live({
        platform: options.platform,
        software: options.software,
        roomId: options.roomId,
        title: options.title,
        username: options.username,
        startTime: timestamp,
      });
      const part = live.addPart({
        filePath: file,
        endTime: timestamp,
        recordStatus: "recorded",
        uploadStatus: "pending",
        rawFilePath: file,
        rawUploadStatus: "pending",
        title: options.title,
        cover: cover,
      });
      this.liveManager.addLive(live);

      return part.partId;
    }
  };

  /**
   * 处理error事件
   */
  handleErrorEvent = (options: Options) => {
    const data = this.liveManager.findLiveByFilePath(options.filePath);
    if (data?.live) {
      const currentPart = data.part;
      if (currentPart) {
        currentPart.recordStatus = "error";
        log.warn(`error event: set part ${currentPart.partId} status to error`);
      }
    }
  };

  /**
   * 处理FileOpening和FileClosed事件
   */
  private handleLiveData(options: Options, config: RoomConfig): string | null {
    if (options.event === EventType.OpenEvent) {
      this.handleOpenEvent(options, config.partMergeMinute);
      return null;
    } else if (options.event === EventType.CloseEvent) {
      const partId = this.handleCloseEvent(options);
      return partId;
    } else if (options.event === EventType.ErrorEvent) {
      this.handleErrorEvent(options);
      log.error(`接收到错误指令，${options.filePath} 置为错误状态`);
      return null;
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

    const task = await transcode(videoFile, outputName, preset, {
      saveType: 2,
      savePath: dir,
      override: false,
      removeOrigin: options.removeVideo,
      autoRun: true,
    });

    return new Promise((resolve, reject) => {
      task.on("task-end", () => {
        resolve(task.output as string);
      });
      task.on("task-error", () => {
        reject(new Error("Transcode task failed"));
      });
    });
  }

  // FLV修复
  async flvRepair(
    videoFile: string,
    // options: {
    //   removeVideo: boolean;
    //   suffix?: string;
    //   limitTime?: [string, string];
    // },
  ): Promise<string> {
    const task = await flvRepair(videoFile, videoFile, {
      saveRadio: 1,
      savePath: "",
      type: "bililive",
    });

    return new Promise((resolve, reject) => {
      task.on("task-end", () => {
        resolve(task.output as string);
      });
      task.on("task-error", () => {
        reject(new Error("FLV repair task failed"));
      });
    });
  }

  burn = async (
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

    let output = path.join(file.dir, `${file.name}-${suffix}.mp4`);
    const exists = await fs.pathExists(output);
    if (exists) {
      output = path.join(file.dir, `${file.name}-${suffix}-${uuid()}.mp4`);
    }

    const task = await burn(files, output, {
      ...options,
      removeOrigin: false,
      override: false,
    });

    return new Promise((resolve, reject) => {
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
  };

  convertDanmu = async (
    xmlFilePath: string,
    danmuConfig: DanmuConfig,
    options: {
      removeXml?: boolean;
    } = {},
  ): Promise<string> => {
    const file = path.parse(xmlFilePath);
    const outputName = path.basename(xmlFilePath, ".xml");
    const outputPath = path.join(file.dir, `${outputName}.ass`);

    const task = await convertXml2Ass({ input: xmlFilePath, output: outputName }, danmuConfig, {
      saveRadio: 1,
      savePath: file.dir,
      removeOrigin: false,
    });

    return new Promise((resolve, reject) => {
      task.on("task-end", () => {
        if (options.removeXml) {
          trashItem(xmlFilePath);
        }
        resolve(outputPath);
      });
      task.on("task-error", ({ error }) => {
        reject(new Error(error));
      });
    });
  };

  /**
   * 通用上传任务处理逻辑
   * @private
   */
  private async handleUploadTask(task: any, pathArray: { path: string; title: string }[]) {
    return new Promise((resolve, reject) => {
      task.on("task-end", async () => {
        // 释放所有文件的引用
        for (const { path } of pathArray) {
          await this.fileRefManager.releaseRef(path);
        }
        resolve(task.output);
      });

      task.on("task-error", () => {
        reject(new Error("Upload task failed"));
      });

      task.on("task-cancel", () => {
        reject(new Error("Upload task cancelled"));
      });
    });
  }

  /**
   * 处理审核后删除的引用计数和回调
   * @private
   */
  private setupDeleteAfterCheckLock(pathArray: { path: string; title: string }[]) {
    // 返回 checkCallback
    return async (status: string) => {
      console.log(`审核状态: ${status}`, pathArray);
      if (status === "completed") {
        // 审核通过，释放引用（会自动删除）
        for (const { path } of pathArray) {
          await this.fileRefManager.releaseRef(path);
        }
      }
    };
  }

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
    const checkCallback = this.setupDeleteAfterCheckLock(pathArray);

    const task = await biliApi.addMedia(pathArray, options, uid, {
      limitedUploadTime,
      afterUploadDeletAction: "none",
      forceCheck: afterUploadDeletAction === "deleteAfterCheck",
      checkCallback,
    });

    return this.handleUploadTask(task, pathArray);
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
    const checkCallback = this.setupDeleteAfterCheckLock(pathArray);

    const task = await biliApi.editMedia(aid, pathArray, {}, uid, {
      limitedUploadTime,
      afterUploadDeletAction: "none",
      forceCheck: afterUploadDeletAction === "deleteAfterCheck",
      checkCallback,
    });

    return this.handleUploadTask(task, pathArray);
  };

  /**
   * 构建上传文件列表
   * @private
   */
  private buildUploadFileList(
    live: Live,
    uploadableParts: Part[],
    type: "raw" | "handled",
    config: RoomConfig,
  ): { filePaths: { part: Part; path: string; title: string }[]; cover?: string } {
    const updateStatusField = type === "handled" ? "uploadStatus" : "rawUploadStatus";
    const filePathField = type === "handled" ? "filePath" : "rawFilePath";

    let cover: string | undefined;
    const filePaths: {
      part: Part;
      path: string;
      title: string;
    }[] = [];

    // 计算已上传分段的数量，用于生成正确的索引
    const uploadedCount = live
      .getNonErrorParts(type)
      .filter((part) => part[updateStatusField] === "uploaded").length;

    let currentIndex = uploadedCount + 1;

    // 构建上传文件列表
    for (const part of uploadableParts) {
      const filename = path.parse(part[filePathField]).name;
      const title = formatPartTitle(
        {
          title: part.title,
          username: live.username,
          roomId: live.roomId,
          time: part?.startTime ? new Date(part.startTime).toISOString() : new Date().toISOString(),
          filename,
          index: currentIndex,
        },
        config.partTitleTemplate ?? "{{filename}}",
      );

      filePaths.push({ path: part[filePathField], title, part });

      if (!cover) cover = part.cover;
      currentIndex++;
    }

    return { filePaths, cover };
  }

  /**
   * 验证上传配置
   * @private
   */
  private validateUploadConfig(
    live: Live,
    filePaths: { part: Part; path: string; title: string }[],
    type: "raw" | "handled",
    config: RoomConfig,
  ): boolean {
    // 检查 uid
    if (!config.uid) {
      live.batchUpdateUploadStatus(
        filePaths.map((item) => item.part),
        "error",
        type,
      );
      log.error("无须上传，uid未配置");
      return false;
    }

    // 如果是非弹幕版，但是不允许上传无弹幕视频
    if (type === "raw" && !config.uploadNoDanmu) {
      live.batchUpdateUploadStatus(
        filePaths.map((item) => item.part),
        "error",
        type,
      );
      return false;
    }

    return true;
  }

  /**
   * 准备上传预设配置
   * @private
   */
  private async prepareUploadPreset(
    type: "raw" | "handled",
    config: RoomConfig,
    live: Live,
    cover?: string,
  ): Promise<BiliupConfig> {
    let uploadPreset = DEFAULT_BILIUP_CONFIG;
    const presetId = type === "handled" ? config.uploadPresetId : config.noDanmuVideoPreset;
    const preset = await this.videoPreset.get(presetId);
    uploadPreset = { ...uploadPreset, ...(preset?.config ?? {}) };

    if (config.useLiveCover && cover) {
      uploadPreset.cover = cover;
    }

    // 处理转载来源：当设置为转载类型且转载来源为空时，自动生成直播间链接
    if (
      uploadPreset.copyright === 2 &&
      (!uploadPreset.source || uploadPreset.source.trim() === "")
    ) {
      const roomLink = buildRoomLink(live.platform, live.roomId);
      if (roomLink) {
        uploadPreset.source = roomLink;
      } else {
        uploadPreset.source = live.roomId;
        log.warn(
          `无法为平台 ${live.platform} 生成直播间链接，使用房间号 ${live.roomId} 作为转载来源`,
        );
      }
    }

    return uploadPreset;
  }

  /**
   * 格式化上传视频标题
   * @private
   */
  private formatUploadTitle(
    live: Live,
    part: Part,
    type: "raw" | "handled",
    uploadPreset: BiliupConfig,
    config: RoomConfig,
  ): string {
    const filePathField = type === "handled" ? "filePath" : "rawFilePath";
    const filename = path.parse(part[filePathField]).name;

    let template = uploadPreset.title;
    if (type === "handled") {
      const placeholders = [
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
      // 目前如果预设标题中不存在占位符，为了兼容性考虑，依然使用webhook配置
      if (!placeholders.some((item) => template.includes(item))) {
        template = config.title;
      }
    }

    return formatTitle(
      {
        title: live.title,
        username: live.username,
        roomId: live.roomId,
        time: part?.startTime ? new Date(part.startTime).toISOString() : new Date().toISOString(),
        filename,
      },
      template,
    );
  }

  /**
   * 执行续传操作
   * @private
   */
  private async performContinueUpload(
    live: Live,
    aid: number,
    filePaths: { part: Part; path: string; title: string }[],
    type: "raw" | "handled",
    config: RoomConfig,
    limitedUploadTime: [] | [string, string],
  ) {
    log.info("续传", filePaths);

    live.batchUpdateUploadStatus(
      filePaths.map((item) => item.part),
      "uploading",
      type,
    );

    await this.addEditMediaTask(
      config.uid!,
      aid,
      filePaths.map((item) => ({
        path: item.path,
        title: item.title,
      })),
      limitedUploadTime,
      type === "raw" ? "none" : config.afterUploadDeletAction,
    );

    live.batchUpdateUploadStatus(
      filePaths.map((item) => item.part),
      "uploaded",
      type,
    );
  }

  /**
   * 执行新上传操作
   * @private
   */
  private async performNewUpload(
    live: Live,
    filePaths: { part: Part; path: string; title: string }[],
    type: "raw" | "handled",
    config: RoomConfig,
    uploadPreset: BiliupConfig,
    limitedUploadTime: [] | [string, string],
  ) {
    const aidField = type === "handled" ? "aid" : "rawAid";

    live.batchUpdateUploadStatus(
      filePaths.map((item) => item.part),
      "uploading",
      type,
    );

    // 格式化标题
    const videoTitle = this.formatUploadTitle(live, filePaths[0].part, type, uploadPreset, config);
    uploadPreset.title = videoTitle;

    const aid = (await this.addUploadTask(
      config.uid!,
      filePaths.map((item) => ({
        path: item.path,
        title: item.title,
      })),
      uploadPreset,
      limitedUploadTime,
      type === "raw" ? "none" : config.afterUploadDeletAction,
    )) as number;

    live[aidField] = Number(aid);

    live.batchUpdateUploadStatus(
      filePaths.map((item) => item.part),
      "uploaded",
      type,
    );
  }

  /**
   * 上传单个类型的视频（弹幕版或原始版）
   * @private
   */
  private async uploadVideoByType(live: Live, type: "raw" | "handled") {
    const aidField = type === "handled" ? "aid" : "rawAid";

    // 1. 检查是否有正在上传的分段
    if (live.hasUploadingParts(type)) return;

    // 2. 获取可上传的分段列表
    const uploadableParts = live.getUploadableParts(type);
    if (uploadableParts.length === 0) return;

    // 3. 获取配置
    const config = this.configManager.getConfig(live.roomId);

    // 4. 构建上传文件列表
    const { filePaths, cover } = this.buildUploadFileList(live, uploadableParts, type, config);

    // 5. 验证上传配置
    if (!this.validateUploadConfig(live, filePaths, type, config)) {
      return;
    }

    // 6. 准备上传预设
    const uploadPreset = await this.prepareUploadPreset(type, config, live, cover);

    // 7. 计算限制时间
    const limitedUploadTime: [] | [string, string] = config.limitUploadTime
      ? config.uploadHandleTime
      : [];

    try {
      // 8. 执行上传（续传或新上传）
      if (live[aidField]) {
        await this.performContinueUpload(
          live,
          live[aidField],
          filePaths,
          type,
          config,
          limitedUploadTime,
        );
      } else {
        await this.performNewUpload(live, filePaths, type, config, uploadPreset, limitedUploadTime);
      }
    } catch (error) {
      log.error(error);
      // 设置状态为失败
      live.batchUpdateUploadStatus(
        filePaths.map((item) => item.part),
        "error",
        type,
      );
    }
  }

  /**
   * 处理直播上传
   * @param live 直播数据
   * @param type 上传类型：handled-弹幕版，raw-原始版，undefined-两者都上传
   */
  handleLive = async (live: Live, type?: "handled" | "raw") => {
    if (type) {
      if (type === "handled") {
        await this.uploadVideoByType(live, "handled");
      } else if (type === "raw") {
        await this.uploadVideoByType(live, "raw");
      } else {
        throw new Error("type error");
      }
    } else {
      await Promise.all([
        this.uploadVideoByType(live, "handled"),
        this.uploadVideoByType(live, "raw"),
      ]);
    }
  };
}
