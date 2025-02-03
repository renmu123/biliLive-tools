import path from "node:path";
import os from "node:os";
import fs from "fs-extra";

import { FFmpegPreset, VideoPreset, DanmuPreset } from "@biliLive-tools/shared";
import { DEFAULT_BILIUP_CONFIG } from "@biliLive-tools/shared/presets/videoPreset.js";
import { biliApi } from "@biliLive-tools/shared/task/bili.js";
import { convertXml2Ass, genHotProgress, isEmptyDanmu } from "@biliLive-tools/shared/task/danmu.js";
import {
  mergeAssMp4,
  readVideoMeta,
  transcode,
  readXmlTimestamp,
} from "@biliLive-tools/shared/task/video.js";
import log from "@biliLive-tools/shared/utils/log.js";
import {
  getFileSize,
  uuid,
  sleep,
  trashItem,
  formatTitle,
  replaceExtName,
} from "@biliLive-tools/shared/utils/index.js";

import { config } from "../index.js";

import type {
  BiliupConfig,
  FfmpegOptions,
  DanmuConfig,
  AppRoomConfig,
  CommonRoomConfig,
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
  startTime?: number;
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
    startTime?: number;
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
      removeOriginAfterConvert,
      noConvertHandleVideo,
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
        const part = currentLive.findPartByFilePath(options.filePath);
        if (part) {
          currentLive.removePart(part.partId);
        }
      }
      return;
    }

    log.debug(this.liveData);

    // TODO:重构
    if (useLiveCover) {
      const cover = await this.handleCover(options);
      if (cover) {
        currentPart.cover = cover;
      } else {
        log.error(`${cover} can not be found`);
      }
    }

    if (convert2Mp4Option) {
      const file = await this.convert2Mp4(options.filePath);
      log.debug("convert2Mp4 output", file);
      options.filePath = file;
      currentPart.filePath = file;
      currentPart.rawFilePath = file;
    }

    if (danmu) {
      try {
        let xmlFilePath: string;
        if (options.danmuPath) {
          xmlFilePath = options.danmuPath;
        } else {
          xmlFilePath = replaceExtName(options.filePath, ".xml");
        }
        await sleep(10000);
        if (!(await fs.pathExists(xmlFilePath)) || (await isEmptyDanmu(xmlFilePath))) {
          log.info("没有找到弹幕文件", xmlFilePath);
          currentPart.recordStatus = "handled";
          return;
        }
        let hotProgressFile: string | undefined;
        if (hotProgress) {
          // 生成高能进度条文件
          hotProgressFile = await this.genHotProgressTask(xmlFilePath, options.filePath, {
            internal: hotProgressSample || 30,
            color: hotProgressColor || "#f9f5f3",
            fillColor: hotProgressFillColor || "#333333",
            height: hotProgressHeight || 60,
          });
        }

        const danmuConfig = (await this.danmuPreset.get(danmuPresetId))?.config;
        if (!danmuConfig) {
          log.error("danmuPreset not found", danmuPresetId);
          currentPart.uploadStatus = "error";
          return;
        }

        const assFilePath = await this.addDanmuTask(xmlFilePath, options.filePath, danmuConfig);

        const ffmpegPreset = await this.ffmpegPreset.get(videoPresetId);
        if (!ffmpegPreset) {
          log.error("ffmpegPreset not found", videoPresetId);
          currentPart.uploadStatus = "error";
          return;
        }
        let startTimestamp = 0;
        try {
          if (ffmpegPreset.config?.addTimestamp) {
            startTimestamp = await readXmlTimestamp(xmlFilePath);
          }
        } catch {
          log.error("readXmlTimestamp error: ", xmlFilePath);
        }

        const output = await this.addMergeAssMp4Task(
          options.filePath,
          assFilePath,
          hotProgressFile,
          ffmpegPreset?.config,
          {
            removeVideo: removeOriginAfterConvert,
            suffix: "弹幕版",
            startTimestamp: startTimestamp || Math.floor((currentPart.startTime ?? 0) / 1000),
            timestampFont: danmuConfig.fontname,
          },
        );
        if (removeOriginAfterConvert) {
          trashItem(xmlFilePath);
        }
        currentPart.filePath = output;
        currentPart.recordStatus = "handled";
      } catch (error) {
        log.error(error);
        currentPart.uploadStatus = "error";
      }
    } else {
      if (noConvertHandleVideo) {
        const preset = await this.ffmpegPreset.get(videoPresetId);
        if (!preset) {
          log.error("ffmpegPreset not found", videoPresetId);
          currentPart.uploadStatus = "error";
          return;
        }
        const output = await this.addMergeAssMp4Task(
          options.filePath,
          undefined,
          undefined,
          preset?.config,
          { removeVideo: removeOriginAfterConvert, suffix: "后处理" },
        );
        currentPart.filePath = output;
      }
      currentPart.recordStatus = "handled";
    }
  }

  /**
   * 根据filePath查找live，并非rawFilePath
   * @param filePath 文件路径
   */
  findLiveByFilePath(filePath: string) {
    return this.liveData.find((live) => live.parts.some((part) => part.filePath === filePath));
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
    /** 使用视频文件名做标题 */
    useVideoAsTitle?: boolean;
    /* 弹幕preset */
    danmuPresetId: string;
    /* 视频压制preset */
    videoPresetId: string;
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
    /** 压制完成后删除文件 */
    removeOriginAfterConvert: boolean;
    /** 上传完成后删除文件 */
    removeOriginAfterUpload: boolean;
    /** 不压制后处理 */
    noConvertHandleVideo?: boolean;
    /** 限制只在某一段时间上传 */
    limitUploadTime?: boolean;
    /** 允许上传处理时间 */
    uploadHandleTime: [string, string];
    /** 同时上传无弹幕视频 */
    uploadNoDanmu: boolean;
    /** 同时上传无弹幕视频预设 */
    noDanmuVideoPreset: string;
  } {
    const config = this.appConfig.getAll();
    const roomSetting: AppRoomConfig | undefined = config.webhook?.rooms?.[roomId];
    // log.debug("room setting", roomId, roomSetting);

    const danmu = getRoomSetting("danmu");
    const mergePart = getRoomSetting("autoPartMerge");
    const minSize = getRoomSetting("minSize") ?? 10;
    const uploadPresetId = getRoomSetting("uploadPresetId") || "default";
    const title = getRoomSetting("title") || "";
    const danmuPresetId = getRoomSetting("danmuPreset") || "default";
    const videoPresetId = getRoomSetting("ffmpegPreset") || "default";
    const uid = getRoomSetting("uid");
    let partMergeMinute = getRoomSetting("partMergeMinute") ?? 10;
    const hotProgress = getRoomSetting("hotProgress");
    const useLiveCover = getRoomSetting("useLiveCover");
    const hotProgressSample = getRoomSetting("hotProgressSample");
    const hotProgressHeight = getRoomSetting("hotProgressHeight");
    const hotProgressColor = getRoomSetting("hotProgressColor");
    const hotProgressFillColor = getRoomSetting("hotProgressFillColor");
    const convert2Mp4 = getRoomSetting("convert2Mp4");
    const useVideoAsTitle = getRoomSetting("useVideoAsTitle");
    const removeOriginAfterConvert = getRoomSetting("removeOriginAfterConvert") ?? false;
    const removeOriginAfterUpload = getRoomSetting("removeOriginAfterUpload") ?? false;
    const noConvertHandleVideo = getRoomSetting("noConvertHandleVideo") ?? false;
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
      useVideoAsTitle,
      removeOriginAfterConvert,
      removeOriginAfterUpload,
      noConvertHandleVideo,
      limitUploadTime,
      uploadHandleTime,
      uploadNoDanmu: !!(uid && uploadNoDanmu && !removeOriginAfterConvert),
      noDanmuVideoPreset,
    };
    // log.debug("final config", options);

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
      }
    } else {
      const liveEventId = uuid();
      const live = new Live({
        eventId: liveEventId,
        platform: options.platform,
        roomId: options.roomId,
        title: options.title,
        username: options.username,
      });
      live.addPart({
        partId: uuid(),
        filePath: options.filePath,
        endTime: timestamp,
        recordStatus: "recorded",
        uploadStatus: "pending",
        rawFilePath: options.filePath,
        rawUploadStatus: "pending",
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
  async convert2Mp4(videoFile: string): Promise<string> {
    const formatFile = (filePath: string) => {
      const formatFile = path.parse(filePath);
      return { ...formatFile, path: filePath, filename: formatFile.base };
    };
    const { dir, name } = formatFile(videoFile);
    const output = path.join(dir, `${name}.mp4`);
    if (await fs.pathExists(output)) return output;

    return new Promise((resolve, reject) => {
      transcode(
        videoFile,
        `${name}.mp4`,
        {
          encoder: "copy",
          audioCodec: "copy",
        },
        {
          saveType: 1,
          savePath: ".",
          override: false,
          removeOrigin: true,
        },
      ).then((task) => {
        task.on("task-end", () => {
          resolve(output);
        });
        task.on("task-error", () => {
          reject();
        });
      });
    });
  }
  // 生成高能进度条
  async genHotProgressTask(
    xmlFile: string,
    videoFile: string,
    options: {
      internal: number;
      color: string;
      fillColor: string;
      height: number;
    },
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      genHotProgress(xmlFile, {
        videoPath: videoFile,
        ...options,
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

  // xml转ass
  addDanmuTask = (input: string, videoFile: string, danmuConfig: DanmuConfig): Promise<string> => {
    return new Promise((resolve, reject) => {
      readVideoMeta(videoFile)
        .then((videoMeta) => {
          const videoStream = videoMeta.streams.find((stream) => stream.codec_type === "video");
          const { width, height } = videoStream || {};
          if (danmuConfig.resolutionResponsive) {
            danmuConfig.resolution[0] = width!;
            danmuConfig.resolution[1] = height!;
          }

          return convertXml2Ass(
            {
              input: input,
              output: uuid(),
            },
            danmuConfig,
            {
              copyInput: true,
              removeOrigin: false,
              saveRadio: 2,
              savePath: os.tmpdir(),
            },
          );
        })
        .then((task) => {
          task.on("task-end", () => {
            resolve(task.output as string);
          });
          task.on("task-error", () => {
            reject();
          });
        });
    });
  };

  addMergeAssMp4Task = (
    videoInput: string,
    assInput: string | undefined,
    hotProgressFile: string | undefined,
    preset: FfmpegOptions,
    options: {
      removeVideo: boolean;
      suffix: string;
      startTimestamp?: number;
      timestampFont?: string;
    } = {
      removeVideo: false,
      suffix: "弹幕版",
    },
  ): Promise<string> => {
    const suffix = options.suffix || "弹幕版";
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
          mergeAssMp4(
            {
              videoFilePath: videoInput,
              assFilePath: assInput,
              outputPath: output,
              hotProgressFilePath: hotProgressFile,
            },
            {
              removeOrigin: false,
              startTimestamp: options.startTimestamp,
              override: true,
              timestampFont: options.timestampFont,
            },
            preset,
          ).then((task) => {
            task.on("task-end", () => {
              if (assInput) fs.unlink(assInput);
              if (options?.removeVideo || false) trashItem(videoInput);
              resolve(output);
            });
            task.on("task-error", () => {
              if (assInput) fs.unlink(assInput);
              reject();
            });
          });
        });
    });
  };

  addUploadTask = async (
    uid: number,
    pathArray: string[],
    options: BiliupConfig,
    removeOrigin: boolean,
    limitedUploadTime: [] | [string, string],
  ) => {
    return new Promise((resolve, reject) => {
      biliApi
        .addMedia(pathArray, options, uid, {
          limitedUploadTime,
        })
        .then((task) => {
          task.on("task-end", () => {
            if (removeOrigin) {
              pathArray.map((item) => {
                trashItem(item);
              });
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
    pathArray: string[],
    removeOrigin?: boolean,
    limitedUploadTime?: [string, string] | [],
  ) => {
    return new Promise((resolve, reject) => {
      biliApi
        .editMedia(aid, pathArray, {}, uid, {
          limitedUploadTime: limitedUploadTime,
        })
        .then((task) => {
          task.on("task-end", () => {
            if (removeOrigin) {
              pathArray.map((item) => {
                trashItem(item);
              });
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

  handleLive = async (live: Live) => {
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

      // 需要上传的视频列表
      const filePaths: string[] = [];
      // 过滤掉已经上传的part
      const filterParts = live.parts.filter(
        (item) => item[updateStatusField] !== "uploaded" && item[updateStatusField] !== "error",
      );

      let cover: string | undefined;
      // 找到前几个为handled的part
      for (let i = 0; i < filterParts.length; i++) {
        const part = filterParts[i];
        if (type === "handled") {
          if (part.recordStatus === "handled") {
            filePaths.push(part[filePathField]);
            if (!cover) cover = part.cover;
          } else {
            break;
          }
        } else if (type === "raw") {
          if (part.recordStatus !== "recording") {
            filePaths.push(part[filePathField]);
            if (!cover) cover = part.cover;
          } else {
            break;
          }
        } else {
          throw new Error("type error");
        }
      }

      if (filePaths.length === 0) return;

      const {
        uploadPresetId,
        uid,
        removeOriginAfterUpload,
        useLiveCover,
        limitUploadTime,
        uploadHandleTime,
        useVideoAsTitle,
        title,
        uploadNoDanmu,
        noDanmuVideoPreset,
      } = this.getConfig(live.roomId);

      if (!uid) {
        for (let i = 0; i < filePaths.length; i++) {
          const part = live.findPartByFilePath(filePaths[i], type);
          if (part) part[updateStatusField] = "error";
        }
        return;
      }

      // 如果是非弹幕版，但是不允许上传无弹幕视频，那么直接设置为error
      if (type === "raw" && !uploadNoDanmu) {
        for (let i = 0; i < filePaths.length; i++) {
          const part = live.findPartByFilePath(filePaths[i], type);
          if (part) part[updateStatusField] = "error";
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

      if (live[aidField]) {
        log.info("续传", filePaths);
        try {
          live.parts.map((item) => {
            if (filePaths.includes(item[filePathField])) item[updateStatusField] = "uploading";
          });
          await this.addEditMediaTask(
            uid,
            live[aidField],
            filePaths,
            removeOriginAfterUpload,
            limitedUploadTime,
          );
          live.parts.map((item) => {
            if (filePaths.includes(item[filePathField])) item[updateStatusField] = "uploaded";
          });
        } catch (error) {
          log.error(error);
          live.parts.map((item) => {
            if (filePaths.includes(item[filePathField])) item[updateStatusField] = "error";
          });
        }
      } else {
        try {
          const part = live.findPartByFilePath(filePaths[0], type);

          if (part && useVideoAsTitle) {
            uploadPreset.title = path.parse(part[filePathField]).name.slice(0, 80);
          } else {
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
              },
              template,
            );
            // console.log("template111", template, part, filePaths, videoTitle, type, presetId);

            uploadPreset.title = videoTitle;
          }

          live.parts.map((item) => {
            if (filePaths.includes(item[filePathField])) item[updateStatusField] = "uploading";
          });
          log.info("上传", live, filePaths, uploadPreset);

          const aid = (await this.addUploadTask(
            uid,
            filePaths,
            uploadPreset,
            type === "raw" ? false : removeOriginAfterUpload,
            limitedUploadTime,
          )) as number;
          live[aidField] = Number(aid);

          // 设置状态为成功
          live.parts.map((item) => {
            if (filePaths.includes(item[filePathField])) item[updateStatusField] = "uploaded";
          });
        } catch (error) {
          log.error(error);
          // 设置状态为失败
          live.parts.map((item) => {
            if (filePaths.includes(item[filePathField])) item[updateStatusField] = "error";
          });
        }
      }
    };

    await Promise.all([uploadVideo("handled"), uploadVideo("raw")]);
  };
}
