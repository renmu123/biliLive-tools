import path from "node:path";
import os from "node:os";

import Router from "koa-router";
import fs from "fs-extra";
import { appConfig, ffmpegPreset, videoPreset, danmuPreset } from "@biliLive-tools/shared";
import { DEFAULT_BILIUP_CONFIG } from "@biliLive-tools/shared/lib/presets/videoPreset.js";
import { biliApi, client as bili } from "@biliLive-tools/shared/lib/task/bili.js";
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
import type { BlrecEventType } from "../types/blrecEvent.js";

type Platform = "bili-recorder" | "blrec" | "custom";

export interface Part {
  partId: string;
  startTime?: number;
  endTime?: number;
  filePath: string;
  status: "recording" | "recorded" | "handled" | "uploading" | "uploaded" | "error";
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

interface CustomEvent {
  /** 如果你想使用断播续传功能，请在上一个`FileClosed`事件后在时间间隔内发送`FileOpening`事件 */
  event: "FileOpening" | "FileClosed";
  /** 视频文件的绝对路径 */
  filePath: string;
  /** 房间号，用于断播续传需要 */
  roomId: number;
  /** 用于标题格式化的时间，示例："2021-05-14T17:52:54.946" */
  time: string;
  /** 标题，用于格式化视频标题 */
  title: string;
  /** 主播名称，用于格式化视频标题 */
  username: string;
  /** 封面路径 */
  coverPath?: string;
  /** 弹幕路径 */
  danmuPath?: string;
}

const liveData: Live[] = [];

const router = new Router();

router.get("/webhook", async (ctx) => {
  ctx.body = "webhook 服务器已启动";
});

router.post("/webhook/bililiverecorder", async (ctx) => {
  const config = appConfig.getAll();
  log.info("录播姬：", ctx.request.body);

  const event: any = ctx.request.body;
  if (
    config.webhook.open &&
    config.webhook.recoderFolder &&
    (event.EventType === "FileOpening" || event.EventType === "FileClosed")
  ) {
    const roomId = event.EventData.RoomId;
    const filePath = path.join(config.webhook.recoderFolder, event.EventData.RelativePath);

    handle({
      event: event.EventType,
      filePath: filePath,
      roomId: roomId,
      time: event.EventTimestamp,
      title: event.EventData.Title,
      username: event.EventData.Name,
      platform: "bili-recorder",
    });
  }
  ctx.body = "ok";
});

router.post("/webhook/blrec", async (ctx) => {
  const webhook = appConfig.get("webhook");
  log.info("blrec: webhook", ctx.request.body);
  const event = ctx.request.body as BlrecEventType;

  if (
    webhook?.open &&
    (event.type === "VideoFileCompletedEvent" || event.type === "VideoFileCreatedEvent")
  ) {
    const roomId = event.data.room_id;
    const masterRes = await bili.live.getRoomInfo(event.data.room_id);
    const userRes = await bili.live.getMasterInfo(masterRes.uid);

    handle({
      event: event.type,
      filePath: event.data.path,
      roomId: roomId,
      time: event.date,
      title: masterRes.title,
      username: userRes.info.uname,
      platform: "blrec",
    });
  }
  ctx.body = "ok";
});

router.post("/webhook/custom", async (ctx) => {
  const webhook = appConfig.get("webhook");
  log.info("custom: webhook", ctx.request.body);
  const event = ctx.request.body as CustomEvent;

  if (!event.filePath) {
    throw new Error("filePath is required");
  }
  if (!event.roomId) {
    throw new Error("roomId is required");
  }
  if (!event.time) {
    throw new Error("time is required");
  }
  if (!event.title) {
    throw new Error("title is required");
  }
  if (!event.username) {
    throw new Error("username is required");
  }
  if (["FileOpening", "FileClosed"].includes(event.event) === false) {
    throw new Error("event should be FileOpening or FileClosed");
  }
  if (webhook?.open && (event.event === "FileOpening" || event.event === "FileClosed")) {
    handle({
      event: event.event,
      filePath: event.filePath,
      roomId: event.roomId,
      time: event.time,
      title: event.title,
      username: event.username,
      coverPath: event?.coverPath,
      danmuPath: event?.danmuPath,
      platform: "custom",
    });
  }
  ctx.body = "ok";
});

function getConfig(roomId: number): {
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
  removeOriginAfterConvert?: boolean;
  /** 上传完成后删除文件 */
  removeOriginAfterUpload?: boolean;
  /** 不压制后处理 */
  noConvertHandleVideo?: boolean;
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
  const removeOriginAfterConvert = getRoomSetting("removeOriginAfterConvert");
  const removeOriginAfterUpload = getRoomSetting("removeOriginAfterUpload");
  const noConvertHandleVideo = getRoomSetting("noConvertHandleVideo") ?? false;

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

  /**
   * 判断房间是否开启
   */
  function canHandle() {
    if (roomSetting) {
      // 如果配置了房间，那么以房间设置为准
      return roomSetting.open;
    } else {
      // 如果没有配置房间，那么以黑名单为准
      const blacklist = (config?.webhook?.blacklist || "").split(",");
      if (blacklist.includes("*")) return false;
      if (blacklist.includes(String(roomId))) return false;

      return true;
    }
  }

  const open = canHandle();

  return {
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
  };
}

export async function handleLiveData(options: Options, partMergeMinute: number) {
  // 计算live
  const timestamp = new Date(options.time).getTime();
  let currentIndex = -1;
  log.debug("liveData-start", JSON.stringify(liveData, null, 2));
  if (options.event === "FileOpening" || options.event === "VideoFileCreatedEvent") {
    // 为了处理 下一个"文件打开"请求时间可能早于上一个"文件结束"请求时间
    await sleep(1000);
    currentIndex = liveData.findIndex((live) => {
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
      currentIndex = liveData.toReversed().findIndex((live) => {
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
        log.info("下一个文件的开始时间可能早于上一个文件的结束时间", liveData);
        return currentIndex;
      }
    }
    let currentLive = liveData[currentIndex];
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
      liveData[currentIndex] = currentLive;
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
      liveData.push(currentLive);
      currentIndex = liveData.length - 1;
    }
  } else {
    currentIndex = liveData.findIndex((live) => {
      return live.parts.findIndex((part) => part.filePath === options.filePath) !== -1;
    });
    let currentLive = liveData[currentIndex];
    if (currentLive) {
      const currentPartIndex = currentLive.parts.findIndex((item) => {
        return item.filePath === options.filePath;
      });
      const currentPart = currentLive.parts[currentPartIndex];
      currentPart.endTime = timestamp;
      currentPart.status = "recorded";
      currentLive.parts[currentPartIndex] = currentPart;
      liveData[currentIndex] = currentLive;
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
      liveData.push(currentLive);
      currentIndex = liveData.length - 1;
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
function foramtTitle(
  options: {
    title: string;
    username: string;
    time: string;
  },
  template: string,
) {
  const { year, month, day, hours, minutes, seconds, now } = formatTime(options.time);

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

async function handle(options: Options) {
  const {
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
    convert2Mp4Option,
    useVideoAsTitle,
    removeOriginAfterConvert,
    removeOriginAfterUpload,
    noConvertHandleVideo,
  } = getConfig(options.roomId);
  log.debug("config", getConfig(options.roomId));
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
    config.title = foramtTitle(options, title);
  }
  if (!config.title) config.title = path.parse(options.filePath).name;
  options.title = config.title;

  // 计算live
  const currentLiveIndex = await handleLiveData(options, partMergeMinute);
  const currentLive = liveData[currentLiveIndex];

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
    const { name, dir } = path.parse(options.filePath);
    let cover: string;
    if (options.coverPath) {
      cover = options.coverPath;
    } else {
      cover = path.join(dir, `${name}.cover.jpg`);
    }
    if (await fs.pathExists(cover)) {
      config.cover = cover;
    } else {
      const cover = path.join(dir, `${name}.jpg`);
      if (await fs.pathExists(cover)) {
        config.cover = cover;
      } else {
        log.error(`${cover} can not be found`);
      }
    }
  }

  if (convert2Mp4Option) {
    const file = await convert2Mp4(options.filePath);
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
      newUploadTask(uid, mergePart, currentPart, config, removeOriginAfterUpload);
      return;
    }
    let hotProgressFile: string | undefined;
    if (hotProgress) {
      // 生成高能进度条文件
      hotProgressFile = await genHotProgressTask(xmlFilePath, options.filePath, {
        internal: hotProgressSample || 30,
        color: hotProgressColor || "#f9f5f3",
        fillColor: hotProgressFillColor || "#333333",
        height: hotProgressHeight || 60,
      });
    }

    const danmuConfig = (await danmuPreset.get(danmuPresetId)).config;
    const assFilePath = await addDanmuTask(xmlFilePath, options.filePath, danmuConfig);

    const preset = await ffmpegPreset.get(videoPresetId);
    if (!preset) {
      log.error("ffmpegPreset not found", videoPresetId);
      currentPart.status = "error";
      return;
    }
    try {
      const output = await addMergeAssMp4Task(
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
      newUploadTask(uid, mergePart, currentPart, config, removeOriginAfterUpload);
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
      const output = await addMergeAssMp4Task(
        options.filePath,
        undefined,
        undefined,
        preset?.config,
        { removeVideo: removeOriginAfterConvert, suffix: "后处理" },
      );
      currentPart.filePath = output;
    }
    currentPart.status = "handled";
    newUploadTask(uid, mergePart, currentPart, config, removeOriginAfterUpload);
  }
}

// 转封装为mp4
const convert2Mp4 = async (videoFile: string): Promise<string> => {
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
};

// 生成高能进度条
const genHotProgressTask = async (
  xmlFile: string,
  videoFile: string,
  options: {
    internal: number;
    color: string;
    fillColor: string;
    height: number;
  },
): Promise<string> => {
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
};

// xml转ass
const addDanmuTask = (
  input: string,
  videoFile: string,
  danmuConfig: DanmuConfig,
): Promise<string> => {
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

const addMergeAssMp4Task = (
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

/**
 * 上传任务，如果mergePart为true，会有定时任务进行处理
 */
const newUploadTask = async (
  uid: number | undefined,
  mergePart: boolean,
  part: Part,
  config: BiliupConfig,
  removeOrigin?: boolean,
) => {
  if (!uid) {
    log.info(`uid is not set`);
    part.status = "error";
    return;
  }
  if (mergePart) return;
  part.status = "uploading";
  try {
    await addUploadTask(uid, [part.filePath], config, removeOrigin);
    part.status = "uploaded";
  } catch (error) {
    log.error(error);
    part.status = "error";
  }
};

const addUploadTask = async (
  uid: number,
  pathArray: string[],
  options: BiliupConfig,
  removeOrigin?: boolean,
) => {
  return new Promise((resolve, reject) => {
    log.debug("addUploadTask", pathArray, options, removeOrigin);
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

const addEditMediaTask = async (
  uid: number,
  aid: number,
  pathArray: string[],
  removeOrigin?: boolean,
) => {
  return new Promise((resolve, reject) => {
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

async function checkFileInterval() {
  setInterval(async () => {
    for (let i = 0; i < liveData.length; i++) {
      const live = liveData[i];
      handleLive(live);
    }
  }, 1000 * 60);
}

const handleLive = async (live: Live) => {
  // 不要有两个任务同时上传
  const isUploading = live.parts.some((item) => item.status === "uploading");
  if (isUploading) return;

  const { mergePart, uploadPresetId, uid, removeOriginAfterUpload } = getConfig(live.roomId);
  if (!mergePart) return;
  if (!uid) return;

  let config = DEFAULT_BILIUP_CONFIG;
  if (uploadPresetId) {
    const preset = await videoPreset.get(uploadPresetId);
    config = { ...config, ...preset.config };
  }
  config.title = live.videoName;

  const filePaths: string[] = [];
  // 过滤掉已经上传的part
  const filterParts = live.parts.filter(
    (item) => item.status !== "uploaded" && item.status !== "error",
  );
  // 找到前几个为handled的part
  for (let i = 0; i < filterParts.length; i++) {
    const part = filterParts[i];
    if (part.status === "handled" && part.endTime) {
      filePaths.push(part.filePath);
    } else {
      break;
    }
  }
  log.debug("interval", live, filePaths);
  if (filePaths.length === 0) return;

  if (live.aid) {
    log.info("续传", filePaths);
    try {
      live.parts.map((item) => {
        if (filePaths.includes(item.filePath)) item.status = "uploading";
      });
      await addEditMediaTask(uid, live.aid, filePaths, removeOriginAfterUpload);
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

      const aid = (await addUploadTask(uid, filePaths, config, removeOriginAfterUpload)) as number;
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

checkFileInterval();

const formatTime = (time: string) => {
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
};

export default router;
