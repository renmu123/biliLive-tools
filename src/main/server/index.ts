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
import type { BiliupConfig, FfmpegOptions, DanmuConfig } from "../../types";

const app = express();

app.use(express.json());

interface Part {
  startTime?: number;
  endTime?: number;
  filePath: string;
  status: "pending" | "uploading" | "uploaded" | "error";
}
interface Live {
  eventId: string;
  platform: "bili-recoder" | "blrec";
  startTime?: number;
  roomId: number;
  uploadName?: string;
  aid?: number;
  parts: Part[];
}

const liveData: Live[] = [];
// const evenetData: {
//   biliRecoder: any[];
//   blrec: BlrecEventType[];
// } = {
//   biliRecoder: [],
//   blrec: [],
// };

// 使用内置的中间件处理表单数据
app.use(express.urlencoded({ extended: true }));

app.get("/", function (_req, res) {
  res.send("Hello World");
});

app.post("/webhook", async function (req, res) {
  const appConfig = getAppConfig();
  log.info("录播姬：", req.body);

  const event = req.body;

  if (
    (appConfig.webhook.open &&
      appConfig.webhook.recoderFolder &&
      event.EventType === "FileOpening") ||
    event.EventType === "FileClosed"
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
      platform: "bili-recoder",
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
    const roomId = event.data.room_id as unknown as number;

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

async function handle(options: {
  event: "FileOpening" | "FileClosed" | "VideoFileCompletedEvent" | "VideoFileCreatedEvent";
  filePath: string;
  roomId: number;
  time: string;
  username: string;
  title: string;
  platform: "bili-recoder" | "blrec";
}) {
  log.debug("options", options);
  const fileSize = await getFileSize(options.filePath);

  const timestamp = new Date(options.time).getTime();
  let currentIndex = -1;
  log.debug("liveData-start", JSON.stringify(liveData, null, 2));
  if (options.event === "FileOpening" || options.event === "VideoFileCreatedEvent") {
    currentIndex = liveData.findIndex((live) => {
      // 找到上一个文件结束时间与当前时间差小于10分钟的直播，认为是同一个直播
      const endTime = live.parts.at(-1)?.endTime || 0;
      return (
        live.roomId === options.roomId &&
        live.platform === options.platform &&
        (timestamp - endTime) / (1000 * 60) < 10
      );
    });
    let currentLive = liveData[currentIndex];
    if (currentLive) {
      const part: Part = {
        startTime: timestamp,
        filePath: options.filePath,
        status: "pending",
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
        parts: [
          {
            startTime: timestamp,
            filePath: options.filePath,
            status: "pending",
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
      currentLive.parts[currentPartIndex] = currentPart;
      liveData[currentIndex] = currentLive;
    } else {
      currentLive = {
        eventId: uuid(),
        platform: options.platform,
        roomId: options.roomId,
        parts: [
          {
            filePath: options.filePath,
            endTime: timestamp,
            status: "pending",
          },
        ],
      };
      liveData.push(currentLive);
      currentIndex = liveData.length - 1;
    }
  }
  const currentLive = liveData[currentIndex];
  log.debug("liveData-end", currentIndex, currentLive, JSON.stringify(liveData, null, 2));
  log.debug("currentLive", currentLive);

  if (options.event === "FileOpening" || options.event === "VideoFileCreatedEvent") {
    return;
  }

  const appConfig = getAppConfig();
  const roomSetting = appConfig.webhook.rooms[options.roomId];
  log.info("room setting", options.roomId, roomSetting);
  const danmu = roomSetting?.danmu !== undefined ? roomSetting.danmu : appConfig.webhook.danmu;
  const mergePart =
    roomSetting.autoPartMerge !== undefined
      ? roomSetting.autoPartMerge
      : appConfig.webhook.autoPartMerge;

  const data = {
    time: options.time,
    title: options.title,
    name: options.username,
  };

  const minSize = roomSetting?.minSize || appConfig.webhook.minSize || 0;
  if (fileSize / 1024 / 1024 < minSize) {
    log.info("file size too small");
    liveData.splice(currentIndex, 1);
    return;
  }
  if (appConfig.webhook.blacklist.includes(String(options.roomId))) {
    log.info(`${options.roomId} is in blacklist`);
    liveData.splice(currentIndex, 1);
    return;
  }

  let config = DEFAULT_BILIUP_CONFIG;
  const uploadPresetId =
    roomSetting?.uploadPresetId || appConfig.webhook.uploadPresetId || "default";
  if (appConfig.webhook.uploadPresetId) {
    const preset = await readBiliupPreset(undefined, uploadPresetId);
    config = { ...config, ...preset.config };
  }

  const title = roomSetting?.title || appConfig.webhook.title || "";
  config.title = title
    .replaceAll("{{title}}", data.title)
    .replaceAll("{{user}}", data.name)
    .replaceAll("{{now}}", formatTime(data.time))
    .trim()
    .slice(0, 80);
  if (!config.title) config.title = path.parse(options.filePath).name;

  log.info("upload config", config);
  log.info("appConfig: ", appConfig.webhook);
  log.debug("currentLive-end", currentLive);

  if (danmu) {
    // 压制弹幕后上传
    const danmuPresetId = roomSetting?.danmuPreset || appConfig.webhook.danmuPreset || "default";
    const videoPresetId = roomSetting?.ffmpegPreset || appConfig.webhook.ffmpegPreset || "default";
    console.log(danmuPresetId, videoPresetId);
    const xmlFile = path.parse(options.filePath);
    const xmlFilePath = path.join(xmlFile.dir, `${xmlFile.name}.xml`);
    await sleep(10000);

    if (!(await fs.pathExists(xmlFilePath))) {
      log.info("没有找到弹幕文件，直接上传", xmlFilePath);
      uploadVideo(mainWin.webContents, [options.filePath], config);
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
    const part = currentLive.parts.find((part) => part.filePath === options.filePath);
    if (part) {
      part.filePath = output;
    }
    addUploadTask(currentLive, output, config, mergePart);
  } else {
    addUploadTask(currentLive, options.filePath, config, mergePart);
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

const addUploadTask = async (
  live: Live,
  filePath: string,
  config: BiliupConfig,
  mergePart: boolean,
) => {
  if (mergePart) {
    log.info("live:aid: ", live);
    // 如果有还在上传中的，不进行上传
    if (live.parts.filter((item) => item.status === "uploading").length > 0) return;

    const filePaths = live.parts
      .filter((item) => item.status === "pending" && item.endTime)
      .map((item) => item.filePath);
    let biliup: any;

    if (live.aid) {
      log.info("续传", filePaths);
      biliup = await appendVideo(mainWin.webContents, filePaths, {
        vid: live.aid,
      });
    } else {
      log.info("上传", filePaths);
      biliup = await uploadVideo(mainWin.webContents, filePaths, config);
    }

    // 设置状态为上传中
    biliup.once("close", async (code: 0 | 1) => {
      if (code === 0) {
        await runWithMaxIterations(
          async (count: number) => {
            // TODO:接完上传后重构
            const res = await bili.client.platform.getArchives();
            log.debug("count", count);
            for (let i = 0; i < Math.min(5, res.data.arc_audits.length); i++) {
              const item = res.data.arc_audits[i];
              log.debug("getArchives", item.Archive, config.title);
              if (item.Archive.title === config.title) {
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
          if (filePaths.includes(item.filePath)) item.status === "uploaded";
        });
      } else {
        // 设置状态为失败
        live.parts.map((item) => {
          if (filePaths.includes(item.filePath)) item.status === "error";
        });
      }
    });
  } else {
    uploadVideo(mainWin.webContents, [filePath], config);
  }
};

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
