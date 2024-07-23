import path from "node:path";
import os from "node:os";
import fs from "fs-extra";

import { appConfig, ffmpegPreset, videoPreset, danmuPreset } from "@biliLive-tools/shared";
import { DEFAULT_BILIUP_CONFIG } from "@biliLive-tools/shared/lib/presets/videoPreset.js";
import { biliApi } from "@biliLive-tools/shared/lib/task/bili.js";
import {
  convertXml2Ass,
  genHotProgress,
  isEmptyDanmu,
} from "@biliLive-tools/shared/lib/task/danmu.js";
import {
  mergeAssMp4,
  readVideoMeta,
  convertVideo2Mp4,
} from "@biliLive-tools/shared/lib/task/video.js";
import log from "@biliLive-tools/shared/lib/utils/log.js";
import { getFileSize, uuid, sleep, trashItem } from "@biliLive-tools/shared/lib/utils/index.js";

import type {
  BiliupConfig,
  FfmpegOptions,
  DanmuConfig,
  AppRoomConfig,
  CommonRoomConfig,
} from "@biliLive-tools/types";

type Platform = "bili-recorder" | "blrec" | "custom";

export interface Part {
  partId: string;
  startTime?: number;
  endTime?: number;
  filePath: string;
  status: "recording" | "recorded" | "handled" | "uploading" | "uploaded" | "error";
  cover?: string; // 封面
}
export interface Live {
  eventId: string;
  platform: Platform;
  startTime?: number;
  roomId: number;
  videoName: string;
  aid?: number;
  parts: Part[];
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

export class WebhookHandler {
  liveData: Live[] = [];

  async handle(options: Options) {
    const {
      danmu,
      minSize,
      uploadPresetId,
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

    let config = DEFAULT_BILIUP_CONFIG;
    if (uploadPresetId) {
      const preset = await videoPreset.get(uploadPresetId);
      config = { ...config, ...preset.config };
    }
    if (useVideoAsTitle) {
      config.title = path.parse(options.filePath).name;
    } else {
      config.title = this.foramtTitle(options, title);
    }
    if (!config.title) config.title = path.parse(options.filePath).name;
    options.title = config.title;

    // 计算live
    const currentLiveIndex = await this.handleLiveData(options, partMergeMinute);
    const currentLive = this.liveData[currentLiveIndex];

    if (options.event === "FileOpening" || options.event === "VideoFileCreatedEvent") {
      return;
    }

    // 需要在录制结束时判断大小
    const fileSize = await getFileSize(options.filePath);
    if (fileSize / 1024 / 1024 < minSize) {
      log.info(`${options.filePath}: file size is too small`);
      if (currentLive) {
        const index = currentLive.parts.findIndex((part) => part.filePath === options.filePath);
        currentLive.parts.splice(index, 1);
      }
      return;
    }

    log.debug("currentLive-end", currentLive);

    const currentPart = currentLive.parts.find((part) => part.filePath === options.filePath);
    if (!currentPart) return;

    if (useLiveCover) {
      const cover = await this.handleCover(options);
      if (cover) {
        config.cover = cover;
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
        currentPart.status = "handled";
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

      const danmuConfig = (await danmuPreset.get(danmuPresetId)).config;
      const assFilePath = await this.addDanmuTask(xmlFilePath, options.filePath, danmuConfig);

      const preset = await ffmpegPreset.get(videoPresetId);
      if (!preset) {
        log.error("ffmpegPreset not found", videoPresetId);
        currentPart.status = "error";
        return;
      }
      try {
        const output = await this.addMergeAssMp4Task(
          options.filePath,
          assFilePath,
          hotProgressFile,
          preset?.config,
          { removeVideo: removeOriginAfterConvert, suffix: "弹幕版" },
        );
        if (removeOriginAfterConvert) {
          trashItem(xmlFilePath);
        }
        if (hotProgressFile) fs.remove(hotProgressFile);

        currentPart.filePath = output;
        currentPart.status = "handled";
      } catch (error) {
        log.error(error);
        currentPart.status = "error";
      }
    } else {
      if (noConvertHandleVideo) {
        const preset = await ffmpegPreset.get(videoPresetId);
        if (!preset) {
          log.error("ffmpegPreset not found", videoPresetId);
          currentPart.status = "error";
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
      currentPart.status = "handled";
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
    if (await fs.pathExists(cover)) {
      return cover;
    } else {
      return undefined;
    }
  }
  static formatTime(time: string) {
    // 创建一个Date对象
    const timestamp = new Date(time);

    // 提取年、月、日部分
    const year = timestamp.getFullYear();
    const month = String(timestamp.getMonth() + 1).padStart(2, "0");
    const day = String(timestamp.getDate()).padStart(2, "0");
    const hours = String(timestamp.getHours()).padStart(2, "0");
    const minutes = String(timestamp.getMinutes()).padStart(2, "0");
    const seconds = String(timestamp.getSeconds()).padStart(2, "0");

    // 格式化为"YYYY.MM.DD"的形式
    const formattedDate = `${year}.${month}.${day}`;
    return {
      year: String(year),
      month,
      day,
      hours,
      minutes,
      seconds,
      now: formattedDate,
    };
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
    /* 视频preset */
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
    const config = appConfig.getAll();
    const roomSetting: AppRoomConfig | undefined = config.webhook.rooms[roomId];
    log.debug("room setting", roomId, roomSetting);

    const danmu = getRoomSetting("danmu");
    const mergePart = getRoomSetting("autoPartMerge");
    const minSize = getRoomSetting("minSize") ?? 10;
    const uploadPresetId = getRoomSetting("uploadPresetId") || "default";
    const title = getRoomSetting("title") || "";
    const danmuPresetId = getRoomSetting("danmuPreset") || "default";
    const videoPresetId = getRoomSetting("ffmpegPreset") || "default";
    const uid = getRoomSetting("uid");
    const partMergeMinute = getRoomSetting("partMergeMinute") ?? 10;
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
    log.debug("final config", options);

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
        currentIndex = this.liveData.toReversed().findIndex((live) => {
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
          status: "recording",
        };
        if (currentLive.parts) {
          currentLive.parts.push(part);
        } else {
          currentLive.parts = [part];
        }
        this.liveData[currentIndex] = currentLive;
      } else {
        // 新建Live数据
        currentLive = {
          eventId: uuid(),
          platform: options.platform,
          startTime: timestamp,
          roomId: options.roomId,
          videoName: options.title,
          parts: [
            {
              partId: uuid(),
              startTime: timestamp,
              filePath: options.filePath,
              status: "recording",
            },
          ],
        };
        this.liveData.push(currentLive);
        currentIndex = this.liveData.length - 1;
      }
    } else {
      currentIndex = this.liveData.findIndex((live) => {
        return live.parts.findIndex((part) => part.filePath === options.filePath) !== -1;
      });
      let currentLive = this.liveData[currentIndex];
      if (currentLive) {
        const currentPartIndex = currentLive.parts.findIndex((item) => {
          return item.filePath === options.filePath;
        });
        const currentPart = currentLive.parts[currentPartIndex];
        currentPart.endTime = timestamp;
        currentPart.status = "recorded";
        currentLive.parts[currentPartIndex] = currentPart;
        this.liveData[currentIndex] = currentLive;
      } else {
        currentLive = {
          eventId: uuid(),
          platform: options.platform,
          roomId: options.roomId,
          videoName: options.title,
          parts: [
            {
              partId: uuid(),
              filePath: options.filePath,
              endTime: timestamp,
              status: "recorded",
            },
          ],
        };
        this.liveData.push(currentLive);
        currentIndex = this.liveData.length - 1;
      }
    }

    return currentIndex;
  }
  /**
   * 支持{{title}},{{user}},{{now}}等占位符，会覆盖预设中的标题，如【{{user}}】{{title}}-{{now}}<br/>
   * 直播标题：{{title}}<br/>
   * 主播名：{{user}}<br/>
   * 当前时间（快速）：{{now}}，示例：2024.01.24<br/>
   * 年：{{yyyy}}<br/>
   * 月（补零）：{{MM}}<br/>
   * 日（补零）：{{dd}}<br/>
   * 时（补零）：{{HH}}<br/>
   * 分（补零）：{{mm}}<br/>
   * 秒（补零）：{{ss}}<br/>
   *
   * @param {object} options 格式化参数
   * @param {string} options.title 直播标题
   * @param {string} options.username 主播名
   * @param {string} options.time 直播时间
   * @param {string} template 格式化模板
   */
  foramtTitle(
    options: {
      title: string;
      username: string;
      time: string;
    },
    template: string,
  ) {
    const { year, month, day, hours, minutes, seconds, now } = WebhookHandler.formatTime(
      options.time,
    );

    const title = template
      .replaceAll("{{title}}", options.title)
      .replaceAll("{{user}}", options.username)
      .replaceAll("{{now}}", now)
      .replaceAll("{{yyyy}}", year)
      .replaceAll("{{MM}}", month)
      .replaceAll("{{dd}}", day)
      .replaceAll("{{HH}}", hours)
      .replaceAll("{{mm}}", minutes)
      .replaceAll("{{ss}}", seconds)
      .trim()
      .slice(0, 80);

    return title;
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
    const videoMeta = await readVideoMeta(videoFile);
    const videoStream = videoMeta.streams.find((stream) => stream.codec_type === "video");
    const { width } = videoStream || {};
    const output = `${path.join(os.tmpdir(), uuid())}.mp4`;

    return new Promise((resolve, reject) => {
      genHotProgress(xmlFile, output, {
        width: width,
        duration: videoMeta.format.duration!,
        ...options,
      }).then((task) => {
        task.on("task-end", () => {
          resolve(output);
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
    options: { removeVideo: boolean; suffix: string } = { removeVideo: false, suffix: "弹幕版" },
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
      biliApi.addMedia(pathArray, options, uid).then((task) => {
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
      biliApi.editMedia(aid, pathArray, {}, uid).then((task) => {
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
      });
    });
  };

  handleLive = async (live: Live) => {
    // 不要有两个任务同时上传
    const isUploading = live.parts.some((item) => item.status === "uploading");
    if (isUploading) return;

    const filePaths: string[] = [];
    // 过滤掉已经上传的part
    const filterParts = live.parts.filter(
      (item) => item.status !== "uploaded" && item.status !== "error",
    );

    let cover: string | undefined;
    // 找到前几个为handled的part
    for (let i = 0; i < filterParts.length; i++) {
      const part = filterParts[i];
      if (part.status === "handled" && part.endTime) {
        filePaths.push(part.filePath);
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
    if (!uid) return;
    if (limitUploadTime && !this.isBetweenTime(new Date(), uploadHandleTime)) return;

    let config = DEFAULT_BILIUP_CONFIG;
    if (uploadPresetId) {
      const preset = await videoPreset.get(uploadPresetId);
      config = { ...config, ...preset.config };
    }
    config.title = live.videoName;
    if (useLiveCover) {
      config.cover = cover;
    }

    if (live.aid) {
      log.info("续传", filePaths);
      try {
        live.parts.map((item) => {
          if (filePaths.includes(item.filePath)) item.status = "uploading";
        });
        await this.addEditMediaTask(uid, live.aid, filePaths, removeOriginAfterUpload);
        live.parts.map((item) => {
          if (filePaths.includes(item.filePath)) item.status = "uploaded";
        });
      } catch (error) {
        log.error(error);
        live.parts.map((item) => {
          if (filePaths.includes(item.filePath)) item.status = "error";
        });
      }
    } else {
      try {
        live.parts.map((item) => {
          if (filePaths.includes(item.filePath)) item.status = "uploading";
        });
        log.info("上传", live, filePaths);

        const aid = (await this.addUploadTask(
          uid,
          filePaths,
          config,
          removeOriginAfterUpload,
        )) as number;
        live.aid = aid;

        // 设置状态为成功
        live.parts.map((item) => {
          if (filePaths.includes(item.filePath)) item.status = "uploaded";
        });
        log.info("上传成功", live, filePaths);
      } catch (error) {
        log.error(error);
        // 设置状态为失败
        live.parts.map((item) => {
          if (filePaths.includes(item.filePath)) item.status = "error";
        });
      }
    }
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
