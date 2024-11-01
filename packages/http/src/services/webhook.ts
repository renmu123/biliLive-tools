import path from "node:path";
import os from "node:os";
import fs from "fs-extra";

import { FFmpegPreset, VideoPreset, DanmuPreset } from "@biliLive-tools/shared";
import { DEFAULT_BILIUP_CONFIG } from "@biliLive-tools/shared/presets/videoPreset.js";
import { biliApi } from "@biliLive-tools/shared/task/bili.js";
import { convertXml2Ass, genHotProgress, isEmptyDanmu } from "@biliLive-tools/shared/task/danmu.js";
import { mergeAssMp4, readVideoMeta, convertVideo2Mp4 } from "@biliLive-tools/shared/task/video.js";
import log from "@biliLive-tools/shared/utils/log.js";
import {
  getFileSize,
  uuid,
  sleep,
  trashItem,
  foramtTitle,
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

type Platform = "bili-recorder" | "blrec" | "ddtv" | "custom";

export type UploadStatus = "pending" | "uploading" | "uploaded" | "error";
type PickPartial<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>> & Partial<Pick<T, K>>;

export interface Part {
  partId: string;
  startTime?: number;
  endTime?: number;
  // 录制状态
  recordStatus: "recording" | "recorded" | "handled";
  // 处理后的文件路径，可能是弹幕版的
  filePath: string;
  // 处理后的文件路径上传状态
  uploadStatus: UploadStatus;
  cover?: string; // 封面
  // 原始文件路径
  rawFilePath: string;
  // 原始文件路径上传状态
  rawUploadStatus: UploadStatus;
}

export interface Options {
  event: "FileOpening" | "FileClosed" | "VideoFileCompletedEvent" | "VideoFileCreatedEvent";
  filePath: string;
  roomId: number;
  time: string;
  username: string;
  title: string;
  coverPath?: string;
  danmuPath?: string;
  platform: Platform;
}

export class Live {
  eventId: string;
  platform: Platform;
  startTime?: number;
  roomId: number;
  videoName: string;
  aid?: number;
  parts: Part[];

  constructor(
    eventId: string,
    platform: Platform,
    roomId: number,
    videoName: string,
    startTime?: number,
    aid?: number,
  ) {
    this.eventId = eventId;
    this.platform = platform;
    this.roomId = roomId;
    this.videoName = videoName;
    this.startTime = startTime;
    this.aid = aid;
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

  findPartByFilePath(filePath: string): Part | undefined {
    return this.parts.find((part) => part.filePath === filePath);
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
      // uploadPresetId,
      title,
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
      useVideoAsTitle,
      removeOriginAfterConvert,
      noConvertHandleVideo,
    } = this.getConfig(options.roomId);
    if (!open) {
      log.info(`${options.roomId} is not open`);
      return;
    }

    let videoTitle = title;
    // let config = DEFAULT_BILIUP_CONFIG;
    // if (uploadPresetId) {
    //   const preset = await this.videoPreset.get(uploadPresetId);
    //   config = { ...config, ...(preset?.config ?? {}) };
    // }
    if (useVideoAsTitle) {
      videoTitle = path.parse(options.filePath).name.slice(0, 80);
    } else {
      videoTitle = foramtTitle(options, videoTitle);
    }
    options.title = videoTitle;
    if (!options.title) {
      log.error("webhook title is empty", options);
      return;
    }

    // 计算live
    const currentLiveIndex = await this.handleLiveData(options, partMergeMinute);
    const currentLive = this.liveData[currentLiveIndex];
    console.log("all live data", this.liveData);

    if (options.event === "FileOpening" || options.event === "VideoFileCreatedEvent") {
      return;
    }

    // 需要在录制结束时判断大小
    const fileSize = await getFileSize(options.filePath);
    if (fileSize / 1024 / 1024 < minSize) {
      log.warn(`${options.filePath}: file size is too small`);
      if (currentLive) {
        const part = currentLive.findPartByFilePath(options.filePath);
        if (part) {
          currentLive.parts.splice(currentLive.parts.indexOf(part), 1);
        }
      }
      return;
    }

    log.debug("currentLive-end", currentLive);

    const currentPart = currentLive.findPartByFilePath(options.filePath);
    if (!currentPart) return;

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
    }

    if (danmu) {
      try {
        let xmlFilePath: string;
        if (options.danmuPath) {
          xmlFilePath = options.danmuPath;
        } else {
          // 压制弹幕后上传
          const xmlFile = path.parse(options.filePath);
          xmlFilePath = path.join(xmlFile.dir, `${xmlFile.name}.xml`);
        }
        await sleep(10000);
        if (!(await fs.pathExists(xmlFilePath)) || (await isEmptyDanmu(xmlFilePath))) {
          log.info("没有找到弹幕文件，直接上传", xmlFilePath);
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
        const output = await this.addMergeAssMp4Task(
          options.filePath,
          assFilePath,
          hotProgressFile,
          ffmpegPreset?.config,
          {
            removeVideo: removeOriginAfterConvert,
            suffix: "弹幕版",
            startTimestamp: Math.floor((currentPart.startTime ?? 0) / 1000),
          },
        );
        if (removeOriginAfterConvert) {
          trashItem(xmlFilePath);
        }
        if (hotProgressFile) fs.remove(hotProgressFile);

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
  async handleCover(options: { coverPath?: string; filePath: string }) {
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
    };
    // log.debug("final config", options);

    return options;
  }
  async handleLiveData(options: Options, partMergeMinute: number) {
    // 计算live
    const timestamp = new Date(options.time).getTime();
    let currentIndex = -1;
    log.debug("liveData-start", JSON.stringify(this.liveData, null, 2));
    if (options.event === "FileOpening" || options.event === "VideoFileCreatedEvent") {
      // 为了处理 下一个"文件打开"请求时间可能早于上一个"文件结束"请求时间
      await sleep(1000);
      currentIndex = this.liveData.findIndex((live) => {
        // 找到上一个文件结束时间与当前时间差小于10分钟的直播，认为是同一个直播
        // 找到part中最大的结束时间
        const endTime = Math.max(...live.parts.map((item) => item.endTime || 0));
        return (
          live.roomId === options.roomId &&
          live.platform === options.platform &&
          (timestamp - endTime) / (1000 * 60) < (partMergeMinute || 10)
        );
      });
      if (currentIndex === -1) {
        // 下一个"文件打开"请求时间可能早于上一个"文件结束"请求时间，如果出现这种情况，尝试特殊处理
        // 如果live的任何一个part有endTime，说明不会出现特殊情况，不需要特殊处理
        // 然后去遍历liveData，找到roomId、platform、title都相同的直播，认为是同一场直播
        currentIndex = this.liveData.findLastIndex((live) => {
          const hasEndTime = (live.parts || []).some((item) => item.endTime);
          if (hasEndTime) {
            return false;
          } else {
            return (
              live.roomId === options.roomId &&
              live.platform === options.platform &&
              live.videoName === options.title
            );
          }
        });
        if (currentIndex !== -1) {
          log.info("下一个文件的开始时间可能早于上一个文件的结束时间", this.liveData);
          return currentIndex;
        }
      }
      let currentLive = this.liveData[currentIndex];
      log.debug("currentLive", JSON.stringify(currentLive, null, 2));

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
        this.liveData[currentIndex] = currentLive;
      } else {
        // 新建Live数据
        currentLive = new Live(uuid(), options.platform, options.roomId, options.title, timestamp);
        currentLive.addPart({
          partId: uuid(),
          startTime: timestamp,
          filePath: options.filePath,
          recordStatus: "recording",
          uploadStatus: "pending",
          rawFilePath: options.filePath,
          rawUploadStatus: "pending",
        });
        this.liveData.push(currentLive);
        currentIndex = this.liveData.length - 1;
      }
    } else {
      currentIndex = this.liveData.findIndex((live) => {
        return live.findPartByFilePath(options.filePath) !== undefined;
      });
      let currentLive = this.liveData[currentIndex];
      if (currentLive) {
        const currentPart = currentLive.findPartByFilePath(options.filePath);
        if (currentPart) {
          currentLive.updatePartValue(currentPart.partId, "endTime", timestamp);
          currentLive.updatePartValue(currentPart.partId, "recordStatus", "recorded");
        }
        this.liveData[currentIndex] = currentLive;
      } else {
        currentLive = new Live(uuid(), options.platform, options.roomId, options.title);
        currentLive.addPart({
          partId: uuid(),
          filePath: options.filePath,
          endTime: timestamp,
          recordStatus: "recorded",
          uploadStatus: "pending",
          rawFilePath: options.filePath,
          rawUploadStatus: "pending",
        });
        this.liveData.push(currentLive);
        currentIndex = this.liveData.length - 1;
      }
    }

    return currentIndex;
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
      convertVideo2Mp4(
        {
          input: videoFile,
        },
        {
          saveRadio: 1,
          saveOriginPath: true,
          savePath: "",
          override: false,
          removeOrigin: true,
        },
        {
          encoder: "copy",
          audioCodec: "copy",
        },
        false,
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
    options: { removeVideo: boolean; suffix: string; startTimestamp?: number } = {
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
    removeOrigin?: boolean,
  ) => {
    return new Promise((resolve, reject) => {
      log.debug("addUploadTask", uid, pathArray, options, removeOrigin);
      biliApi
        .addMedia(pathArray, options, uid)
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
  ) => {
    return new Promise((resolve, reject) => {
      log.debug("editUploadTask", uid, pathArray, removeOrigin);
      biliApi
        .editMedia(aid, pathArray, {}, uid)
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
     * raw: 原始版
     * handled: 弹幕版
     */
    const uploadVideo = async (type: "raw" | "handled") => {
      const updateStatusField = type === "handled" ? "uploadStatus" : "rawUploadStatus";
      const filePathField = type === "handled" ? "filePath" : "rawFilePath";

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
        if (part.recordStatus === "handled" && part.endTime) {
          filePaths.push(part[filePathField]);
          if (!cover) cover = part.cover;
        } else {
          break;
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
      } = this.getConfig(live.roomId);
      if (!uid) {
        for (let i = 0; i < filePaths.length; i++) {
          const part = live.findPartByFilePath(filePaths[i]);
          if (part) part[updateStatusField] = "error";
        }
        return;
      }
      if (limitUploadTime && !this.isBetweenTime(new Date(), uploadHandleTime)) return;

      let uploadPreset = DEFAULT_BILIUP_CONFIG;
      if (uploadPresetId) {
        const preset = await this.videoPreset.get(uploadPresetId);
        uploadPreset = { ...uploadPreset, ...(preset?.config ?? {}) };
      }
      uploadPreset.title = live.videoName;
      if (useLiveCover) {
        uploadPreset.cover = cover;
      }

      console.log(live);
      if (live.aid) {
        log.info("续传", filePaths);
        try {
          live.parts.map((item) => {
            if (filePaths.includes(item[filePathField])) item[updateStatusField] = "uploading";
          });
          await this.addEditMediaTask(uid, live.aid, filePaths, removeOriginAfterUpload);
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
          live.parts.map((item) => {
            if (filePaths.includes(item[filePathField])) item[updateStatusField] = "uploading";
          });
          log.info("上传", live, filePaths);

          const aid = (await this.addUploadTask(
            uid,
            filePaths,
            uploadPreset,
            removeOriginAfterUpload,
          )) as number;
          live.aid = Number(aid);

          // 设置状态为成功
          live.parts.map((item) => {
            if (filePaths.includes(item[filePathField])) item[updateStatusField] = "uploaded";
          });
          log.info("上传成功", live, filePaths);
        } catch (error) {
          log.error(error);
          // 设置状态为失败
          live.parts.map((item) => {
            if (filePaths.includes(item[filePathField])) item[updateStatusField] = "error";
          });
        }
      }
    };

    await uploadVideo("handled");
  };
  /**
   * 当前时间是否在两个时间'HH:mm:ss'之间，如果是["22:00:00","05:00:00"]，当前时间是凌晨3点，返回true
   * @param {string} currentTime 当前时间
   * @param {string[]} timeRange 时间范围
   */
  isBetweenTime(currentTime: Date, timeRange: [string, string]): boolean {
    const [startTime, endTime] = timeRange;
    if (!startTime || !endTime) return true;

    const [startHour, startMinute, startSecond] = startTime.split(":").map(Number);
    const [endHour, endMinute, endSecond] = endTime.split(":").map(Number);
    const [currentHour, currentMinute, currentSecond] = [
      currentTime.getHours(),
      currentTime.getMinutes(),
      currentTime.getSeconds(),
    ];

    const start = startHour * 3600 + startMinute * 60 + startSecond;
    let end = endHour * 3600 + endMinute * 60 + endSecond;
    let current = currentHour * 3600 + currentMinute * 60 + currentSecond;

    // 如果结束时间小于开始时间，说明跨越了午夜
    if (end < start) {
      end += 24 * 3600; // 将结束时间加上24小时
      if (current < start) {
        current += 24 * 3600; // 如果当前时间小于开始时间，也加上24小时
      }
    }

    return start <= current && current <= end;
  }
}
