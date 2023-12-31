import path from "node:path";
import os from "node:os";

import fs from "fs-extra";
import { getAppConfig } from "../config/app";
import { uploadVideo, appendVideo, DEFAULT_BILIUP_CONFIG, readBiliupPreset } from "../biliup";
import { mainWin } from "../index";
import { convertXml2Ass, readDanmuPreset } from "../danmu";
import { taskQueue } from "../task";
import { mergeAssMp4 } from "../video";
import bili from "../bili";
import { getFfmpegPreset } from "../ffmpegPreset";
import log from "../utils/log";
import { getFileSize, uuid, runWithMaxIterations } from "../../utils/index";
import express from "express";

import type { BlrecEventType } from "./brelcEvent.d.ts";
import type {
  BiliupConfig,
  FfmpegOptions,
  DanmuConfig,
  AppRoomConfig,
  AppConfig,
} from "../../types";

const app = express();
app.use(express.json());

export interface Part {
  partId: string;
  startTime?: number;
  endTime?: number;
  filePath: string;
  status: "recording" | "recorded" | "handled" | "uploading" | "uploaded" | "error";
}
export interface Live {
  eventId: string;
  platform: "bili-recorder" | "blrec";
  startTime?: number;
  roomId: number;
  videoName: string;
  aid?: number;
  parts: Part[];
}

const liveData: Live[] = [];

app.use(express.urlencoded({ extended: true }));

app.get("/", function (_req, res) {
  res.send("Hello World");
});

app.post("/webhook", async function (req, res) {
  const appConfig = getAppConfig();
  log.info("录播姬：", req.body);

  const event = req.body;
  if (
    appConfig.webhook.open &&
    appConfig.webhook.recoderFolder &&
    (event.EventType === "FileOpening" || event.EventType === "FileClosed")
  ) {
    const roomId = event.EventData.RoomId;
    const filePath = path.join(appConfig.webhook.recoderFolder, event.EventData.RelativePath);

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
  res.send("ok");
});

app.post("/blrec", async function (req, res) {
  const appConfig = getAppConfig();
  log.info("blrec: webhook", req.body);
  const event: BlrecEventType = req.body;

  if (
    appConfig.webhook.open &&
    (event.type === "VideoFileCompletedEvent" || event.type === "VideoFileCreatedEvent")
  ) {
    const roomId = event.data.room_id;

    const masterRes = await bili.client.live.getRoomInfo(event.data.room_id);
    const userRes = await bili.client.live.getMasterInfo(masterRes.data.uid);

    handle({
      event: event.type,
      filePath: event.data.path,
      roomId: roomId,
      time: event.date,
      title: masterRes.data.title,
      username: userRes.data.info.uname,
      platform: "blrec",
    });
  }
  res.send("ok");
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
  /* 弹幕preset */
  danmuPresetId: string;
  /* 视频preset */
  videoPresetId: string;
  /* 黑名单 */
  blacklist: string[];
} {
  const appConfig = getAppConfig();
  const roomSetting: AppRoomConfig | undefined = appConfig.webhook.rooms[roomId];
  log.debug("room setting", roomId, roomSetting);
  const danmu = roomSetting?.danmu !== undefined ? roomSetting.danmu : appConfig.webhook.danmu;
  const mergePart =
    roomSetting?.autoPartMerge !== undefined
      ? roomSetting.autoPartMerge
      : appConfig.webhook.autoPartMerge;
  const minSize = roomSetting?.minSize || appConfig.webhook.minSize || 0;
  const uploadPresetId =
    roomSetting?.uploadPresetId || appConfig.webhook.uploadPresetId || "default";
  const title = roomSetting?.title || appConfig.webhook.title || "";
  const danmuPresetId = roomSetting?.danmuPreset || appConfig.webhook.danmuPreset || "default";
  const videoPresetId = roomSetting?.ffmpegPreset || appConfig.webhook.ffmpegPreset || "default";
  const blacklist = appConfig.webhook.blacklist.split(",");

  return {
    danmu,
    mergePart,
    minSize,
    uploadPresetId,
    title,
    danmuPresetId,
    videoPresetId,
    blacklist,
  };
}

export interface Options {
  event: "FileOpening" | "FileClosed" | "VideoFileCompletedEvent" | "VideoFileCreatedEvent";
  filePath: string;
  roomId: number;
  time: string;
  username: string;
  title: string;
  platform: "bili-recorder" | "blrec";
}

export async function handleLiveData(options: Options) {
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
        (timestamp - endTime) / (1000 * 60) < 10
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
      console.log(
        "currentLive",
        currentIndex,
        currentPartIndex,
        currentLive.parts,
        options.filePath,
      );
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

async function handle(options: Options) {
  const {
    danmu,
    mergePart,
    minSize,
    uploadPresetId,
    title,
    danmuPresetId,
    videoPresetId,
    blacklist,
  } = getConfig(options.roomId);
  if (blacklist.includes(String(options.roomId))) {
    log.info(`${options.roomId} is in blacklist`);
    return;
  }

  let config = DEFAULT_BILIUP_CONFIG;
  if (uploadPresetId) {
    const preset = await readBiliupPreset(undefined, uploadPresetId);
    config = { ...config, ...preset.config };
  }
  config.title = title
    .replaceAll("{{title}}", options.title)
    .replaceAll("{{user}}", options.username)
    .replaceAll("{{now}}", formatTime(options.time))
    .trim()
    .slice(0, 80);
  if (!config.title) config.title = path.parse(options.filePath).name;
  options.title = config.title;

  // 计算live
  const currentLiveIndex = await handleLiveData(options);
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

  if (danmu) {
    // 压制弹幕后上传
    const xmlFile = path.parse(options.filePath);
    const xmlFilePath = path.join(xmlFile.dir, `${xmlFile.name}.xml`);
    await sleep(10000);

    if (!(await fs.pathExists(xmlFilePath))) {
      log.info("没有找到弹幕文件，直接上传", xmlFilePath);
      currentPart.status = "handled";
      newUploadTask(mergePart, currentPart, config);
      return;
    }

    const danmuConfig = (await readDanmuPreset(undefined, danmuPresetId)).config;
    const assFilePath = await addDanmuTask(xmlFilePath, danmuConfig);

    const ffmpegPreset = await getFfmpegPreset(undefined, videoPresetId);
    if (!ffmpegPreset) {
      log.error("ffmpegPreset not found", videoPresetId);
      return;
    }
    const output = await addMergeAssMp4Task(options.filePath, assFilePath, ffmpegPreset?.config);
    fs.remove(assFilePath);
    currentPart.filePath = output;
    currentPart.status = "handled";
    newUploadTask(mergePart, currentPart, config);
  } else {
    currentPart.status = "handled";
    newUploadTask(mergePart, currentPart, config);
  }
}

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// 添加压制任务
const addDanmuTask = (input: string, danmuConfig: DanmuConfig): Promise<string> => {
  return new Promise((resolve, reject) => {
    const assFilePath = `${path.join(os.tmpdir(), uuid())}.ass`;
    convertXml2Ass(
      // @ts-ignore
      {
        sender: mainWin.webContents,
      },
      [
        {
          input: input,
          output: assFilePath,
        },
      ],
      danmuConfig,
    ).then((tasks) => {
      const currentTaskId = tasks[0].taskId;
      taskQueue.on("task-end", ({ taskId }) => {
        if (taskId === currentTaskId) {
          resolve(assFilePath);
        }
      });
      taskQueue.on("task-error", ({ taskId }) => {
        if (taskId === currentTaskId) {
          reject();
        }
      });
    });
  });
};

const addMergeAssMp4Task = (
  videoInput: string,
  assInput: string,
  preset: FfmpegOptions,
): Promise<string> => {
  const file = path.parse(videoInput);
  return new Promise((resolve, reject) => {
    let output = path.join(file.dir, `${file.name}-弹幕版.mp4`);
    fs.pathExists(output)
      .then((exists) => {
        if (exists) {
          output = path.join(file.dir, `${file.name}-弹幕版-${uuid()}.mp4`);
        }
      })
      .then(() => {
        mergeAssMp4(
          // @ts-ignore
          {
            sender: mainWin.webContents,
          },
          {
            videoFilePath: videoInput,
            assFilePath: assInput,
            outputPath: output,
          },
          {
            removeOrigin: false,
          },
          preset,
        ).then((task) => {
          if (!task) reject("文件不存在");
          const currentTaskId = task!.taskId;
          taskQueue.on("task-end", ({ taskId }) => {
            if (taskId === currentTaskId) {
              resolve(output);
            }
          });
          taskQueue.on("task-error", ({ taskId }) => {
            if (taskId === currentTaskId) {
              reject();
            }
          });
        });
      });
  });
};

const newUploadTask = async (mergePart: boolean, part: Part, config: BiliupConfig) => {
  if (mergePart) return;
  const biliup = await uploadVideo(mainWin.webContents, [part.filePath], config);
  part.status = "uploading";
  biliup.once("close", async (code: 0 | 1) => {
    if (code === 0) {
      part.status = "uploaded";
    } else {
      part.status = "error";
    }
  });
};

async function checkFileInterval() {
  setInterval(async () => {
    const appConfig = getAppConfig();

    for (let i = 0; i < liveData.length; i++) {
      const live = liveData[i];
      handleLive(live, appConfig);
    }
  }, 1000 * 60);
}

const handleLive = async (live: Live, appConfig: AppConfig) => {
  const { mergePart, uploadPresetId } = getConfig(live.roomId);
  if (!mergePart) return;

  let config = DEFAULT_BILIUP_CONFIG;
  if (appConfig.webhook.uploadPresetId) {
    const preset = await readBiliupPreset(undefined, uploadPresetId);
    config = { ...config, ...preset.config };
  }
  config.title = live.videoName;

  // 不要有两个任务同时上传
  const isUploading = live.parts.some((item) => item.status === "uploading");
  if (isUploading) return;

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

  let biliup: any;
  if (live.aid) {
    log.info("续传", filePaths);
    biliup = await appendVideo(mainWin.webContents, filePaths, {
      vid: live.aid,
    });
    live.parts.map((item) => {
      if (filePaths.includes(item.filePath)) item.status = "uploading";
    });
    biliup.once("close", async (code: 0 | 1) => {
      if (code === 0) {
        // 设置状态为成功
        live.parts.map((item) => {
          if (filePaths.includes(item.filePath)) item.status = "uploaded";
        });
      } else {
        // 设置状态为失败
        live.parts.map((item) => {
          if (filePaths.includes(item.filePath)) item.status = "error";
        });
      }
    });
  } else {
    biliup = await uploadVideo(mainWin.webContents, filePaths, config);
    live.parts.map((item) => {
      if (filePaths.includes(item.filePath)) item.status = "uploading";
    });

    log.info("上传", live, filePaths);

    biliup.once("close", async (code: 0 | 1) => {
      if (code === 0) {
        await runWithMaxIterations(
          async () => {
            // TODO:接完上传后重构
            const res = await bili.client.platform.getArchives();
            for (let i = 0; i < Math.min(10, res.data.arc_audits.length); i++) {
              const item = res.data.arc_audits[i];
              if (item.Archive.title === live.videoName) {
                live.aid = item.Archive.aid;
                return false;
              }
            }
            return true;
          },
          6000,
          5,
        );

        // 设置状态为成功
        live.parts.map((item) => {
          if (filePaths.includes(item.filePath)) item.status = "uploaded";
        });
        log.info("上传成功", live, filePaths);
      } else {
        // 设置状态为失败
        live.parts.map((item) => {
          if (filePaths.includes(item.filePath)) item.status = "error";
        });
      }
    });
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

  // 格式化为"YYYY.MM.DD"的形式
  const formattedDate = `${year}.${month}.${day}`;
  return formattedDate;
};

export default app;
