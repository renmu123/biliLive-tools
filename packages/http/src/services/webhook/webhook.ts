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
  sleep,
  trashItem,
  formatTitle,
  formatPartTitle,
  replaceExtName,
} from "@biliLive-tools/shared/utils/index.js";

import { config } from "../../index.js";
import FileLockManager from "./fileLockManager.js";
import { ConfigManager } from "./ConfigManager.js";
import { PathResolver } from "./PathResolver.js";
import { Live } from "./Live.js";

import type {
  BiliupConfig,
  FfmpegOptions,
  DanmuConfig,
  HotProgressOptions,
} from "@biliLive-tools/types";
import type { AppConfig } from "@biliLive-tools/shared/config.js";
import type { Options, Platform, Part } from "../../types/webhook.js";

export const enum EventType {
  OpenEvent = "FileOpening",
  CloseEvent = "FileClosed",
  ErrorEvent = "FileError",
}

export class WebhookHandler {
  liveData: Live[] = [];
  ffmpegPreset: FFmpegPreset;
  videoPreset: VideoPreset;
  danmuPreset: DanmuPreset;
  appConfig: AppConfig;
  configManager: ConfigManager;
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
    this.configManager = new ConfigManager(appConfig);

    // 定期清理过期的锁
    setInterval(() => this.fileLockManager.cleanup(), 60 * 60 * 1000); // 每小时清理一次
  }

  async handle(options: Options) {
    const config = this.configManager.getConfig(options.roomId);

    if (!config.open) {
      log.info(`${options.roomId} is not open`);
      return;
    }

    // 1. 处理直播数据
    const currentLiveIndex = await this.handleLiveData(options, config.partMergeMinute);

    // 2. 如果是开始或错误事件,直接返回
    if (this.shouldSkipProcessing(options.event)) {
      return;
    }

    // 3. 获取当前直播和分段
    const context = this.getCurrentContext(currentLiveIndex, options.filePath);
    if (!context) return;

    // 4. 验证和准备文件
    await this.prepareFiles(context, options);

    // 5. 检查文件大小
    if (!(await this.validateFileSize(context, config, options))) {
      return;
    }

    log.debug(context.live);

    // 6. 处理封面
    await this.processCover(context, options, config);

    // 7. 转封装处理
    await this.processConversion(context, options, config);

    // 8. 设置预处理状态
    context.part.recordStatus = "prehandled";

    // 9. 处理弹幕和视频压制
    const processingResult = await this.processMediaFiles(context, options, config);

    // 10. 处理文件同步和锁定
    await this.handlePostProcessing(context, options, config, processingResult);
  }

  /**
   * 判断是否应该跳过后续处理
   */
  private shouldSkipProcessing(event: string): boolean {
    return event === EventType.OpenEvent || event === EventType.ErrorEvent;
  }

  /**
   * 获取当前处理上下文
   */
  private getCurrentContext(liveIndex: number, filePath: string) {
    if (liveIndex === -1) return null;

    const currentLive = this.liveData[liveIndex];
    const currentPart = currentLive.findPartByFilePath(filePath);

    if (!currentPart) return null;

    return { live: currentLive, part: currentPart };
  }

  /**
   * 准备和验证文件路径
   */
  private async prepareFiles(context: { live: Live; part: Part }, options: Options) {
    const { part } = context;

    // 检查文件是否存在,尝试替换扩展名
    const file = await PathResolver.tryMp4Fallback(options.filePath);
    options.filePath = file;
    part.filePath = file;
    part.rawFilePath = file;
    // if (!(await fs.pathExists(options.filePath))) {
    //   const mp4FilePath = replaceExtName(options.filePath, ".mp4");
    //   if (await fs.pathExists(mp4FilePath)) {
    //     options.filePath = mp4FilePath;
    //     part.filePath = mp4FilePath;
    //     part.rawFilePath = mp4FilePath;
    //   }
    // }
  }

  /**
   * 验证文件大小
   */
  private async validateFileSize(
    context: { live: Live; part: Part },
    config: any,
    options: Options,
  ): Promise<boolean> {
    const fileSize = await getFileSize(options.filePath);
    const fileSizeMB = fileSize / 1024 / 1024;

    if (fileSizeMB >= config.minSize) {
      return true;
    }

    log.warn(`${options.filePath}: file size is too small (${fileSizeMB}MB)`);

    if (config.removeSmallFile) {
      log.warn("small file should be deleted", options.filePath);
      await trashItem(options.filePath);
    }

    this.removePartAndCleanupLive(context);
    return false;
  }

  /**
   * 删除part并清理空的live
   */
  private removePartAndCleanupLive(context: { live: Live; part: Part }) {
    const { live, part } = context;

    log.warn("remove part", live, part.filePath);
    live.removePart(part.partId);

    if (live.parts.length === 0) {
      const liveIndex = this.liveData.findIndex((l) => l.eventId === live.eventId);
      if (liveIndex !== -1) {
        this.liveData.splice(liveIndex, 1);
        log.warn(`Removed empty live: ${live.eventId}`);
      }
    }
  }

  /**
   * 处理封面
   */
  private async processCover(context: { live: Live; part: Part }, options: Options, config: any) {
    if (!config.useLiveCover) return;

    const cover = await PathResolver.getCoverPath(options.filePath, options.coverPath);

    if (cover) {
      context.part.cover = cover;
    } else {
      log.error(`cover can not be found`);
    }
  }

  /**
   * 转封装处理
   */
  private async processConversion(
    context: { live: Live; part: Part },
    options: Options,
    config: any,
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

      log.debug("convert2Mp4 output", file);
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
    config: any,
  ): Promise<{ conversionSuccessful: boolean; danmuConversionSuccessful: boolean }> {
    const xmlFilePath = PathResolver.getDanmuPath(options.filePath, options.danmuPath);

    if (config.danmu) {
      return await this.processDanmuVideo(context, options, config, xmlFilePath);
    } else {
      return await this.processRegularVideo(context, options, config, xmlFilePath);
    }
  }

  /**
   * 处理弹幕压制视频
   */
  private async processDanmuVideo(
    context: { live: Live; part: Part },
    options: Options,
    config: any,
    xmlFilePath: string,
  ): Promise<{ conversionSuccessful: boolean; danmuConversionSuccessful: boolean }> {
    try {
      await sleep(10000);

      // 验证弹幕文件
      if (!(await fs.pathExists(xmlFilePath)) || (await isEmptyDanmu(xmlFilePath))) {
        context.part.recordStatus = "handled";
        setTimeout(() => {
          context.part.uploadStatus = "pending";
        }, 1000);
        throw new Error(`没有找到弹幕文件：${xmlFilePath}`);
      }

      // 验证预设
      if (!config.danmuPresetId || !config.videoPresetId) {
        context.part.uploadStatus = "error";
        throw new Error(`没有找到预设${config.danmuPresetId}或${config.videoPresetId}`);
      }

      // 获取配置
      const danmuConfig = (await this.danmuPreset.get(config.danmuPresetId))!.config;
      const ffmpegPreset = await this.ffmpegPreset.get(config.videoPresetId);

      // 压制视频
      const output = await this.burn(
        {
          videoFilePath: options.filePath,
          subtitleFilePath: xmlFilePath,
        },
        {
          danmaOptions: danmuConfig,
          ffmpegOptions: ffmpegPreset!.config,
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
    config: any,
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
        await this.convertDanmu(xmlFilePath, preset!.config);
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
  private async handlePostProcessing(
    context: { live: Live; part: Part },
    options: Options,
    config: any,
    processingResult: { conversionSuccessful: boolean; danmuConversionSuccessful: boolean },
  ) {
    const { conversionSuccessful, danmuConversionSuccessful } = processingResult;
    const { part } = context;

    // 计算是否应该删除文件
    const shouldRemoveVideo = this.shouldRemoveFile(
      conversionSuccessful,
      config.afterConvertRemoveVideo,
      "转换失败,已取消删除原始视频文件的操作",
    );

    const shouldRemoveXml = this.shouldRemoveFile(
      danmuConversionSuccessful,
      config.afterConvertRemoveXml,
      "弹幕转换失败,已取消删除XML弹幕文件的操作",
    );

    // 处理封面同步
    if (part.cover) {
      await this.handleCoverSync(options.roomId, part.cover, part.partId).catch((error) => {
        log.error("handleCoverSync", error);
      });
    }

    // 处理弹幕同步
    const xmlFilePath = PathResolver.getDanmuPath(options.filePath, options.danmuPath);
    if (xmlFilePath) {
      await this.handleDanmuSync(options.roomId, xmlFilePath, part.partId, shouldRemoveXml).catch(
        (error) => {
          log.error("handleDanmuSync", error);
        },
      );
    }

    // 处理上传锁
    if (config.uid) {
      this.fileLockManager.acquireLock(part.filePath, "upload");

      if (config.uploadNoDanmu && config.noDanmuVideoPreset) {
        this.fileLockManager.acquireLock(part.rawFilePath, "upload");
      }
    }

    // 处理视频同步
    await this.handleVideoSync(
      options.roomId,
      part.rawFilePath,
      part.partId,
      shouldRemoveVideo,
    ).catch((error) => {
      log.error("handleVideoSync", error);
    });

    await this.handleVideoSync(
      options.roomId,
      part.filePath,
      part.partId,
      config.afterUploadDeletAction && config.afterUploadDeletAction !== "none",
    ).catch((error) => {
      log.error("handleVideoSync", error);
    });
  }

  /**
   * 判断是否应该删除文件
   */
  private shouldRemoveFile(
    operationSuccessful: boolean,
    removeConfig: boolean,
    warningMessage: string,
  ): boolean {
    if (!operationSuccessful && removeConfig) {
      log.warn(warningMessage);
      return false;
    }
    return operationSuccessful && removeConfig;
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
    roomId: string,
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

    const syncConfig = this.configManager.getSyncConfig(roomId);
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

    // 格式化文件夹结构
    const folderStructure = PathResolver.formatFolderStructure(syncConfig.folderStructure, {
      platform,
      user: username,
      liveStartTime,
      partId: livePart?.part?.partId,
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
  async handleCoverSync(roomId: string, coverPath: string, partId: string) {
    return this.handleFileSync(roomId, coverPath, "cover", partId);
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
            // TODO: 应该被设置为error，但是目前其实没有error状态
            currentLive.updatePartValue(part.partId, "recordStatus", "handled");
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
   * 处理error事件
   */
  handleErrorEvent = (options: Options) => {
    const currentLive = this.findLiveByFilePath(options.filePath);
    if (currentLive) {
      const currentPart = currentLive.findPartByFilePath(options.filePath);
      if (currentPart) {
        currentLive.removePart(currentPart.partId);
        if (currentLive.parts.length === 0) {
          const liveIndex = this.liveData.findIndex((live) => live.eventId === currentLive.eventId);
          if (liveIndex !== -1) {
            this.liveData.splice(liveIndex, 1);
            log.warn(`error event: removed empty live: ${currentLive.eventId}`);
          }
        }
      }
    }
  };

  /**
   * 处理FileOpening和FileClosed事件
   */
  async handleLiveData(options: Options, partMergeMinute: number): Promise<number> {
    if (options.event === EventType.OpenEvent) {
      this.handleOpenEvent(options, partMergeMinute);
      return -1;
    } else if (options.event === EventType.CloseEvent) {
      const liveId = this.handleCloseEvent(options);
      const index = this.liveData.findIndex((live) => live.eventId === liveId);
      return index;
    } else if (options.event === EventType.ErrorEvent) {
      this.handleErrorEvent(options);
      log.error(`接收到错误指令，${options.filePath} 置为错误状态`);

      return -1;
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
        autoRun: true,
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

  // 转封装为mp4
  async flvRepair(
    videoFile: string,
    options: {
      removeVideo: boolean;
      suffix?: string;
      limitTime?: [string, string];
    },
  ): Promise<string> {
    // const output = path.join(dir, outputName);
    // if (await fs.pathExists(output)) return output;

    return new Promise((resolve, reject) => {
      flvRepair(videoFile, videoFile, {
        saveRadio: 1,
        savePath: "",
        type: "bililive",
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
      } = this.configManager.getConfig(live.roomId);

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
   * 同步中是否存在对应类型
   */
  async hasTypeInSync(roomId: string, type: "source" | "danmaku" | "xml" | "cover") {
    const syncConfig = this.configManager.getSyncConfig(roomId);
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
    roomId: string,
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
  async handleVideoSync(roomId: string, filePath: string, partId: string, shouldRemove: boolean) {
    // 检查文件是否存在
    if (!filePath) return;
    if (!(await fs.pathExists(filePath))) {
      log.error(`视频文件不存在: ${filePath}`);
      return;
    }

    try {
      const fileType = PathResolver.getFileType(filePath);

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
