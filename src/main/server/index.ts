import path from "node:path";
import os from "node:os";

import fs from "fs-extra";
import { getAppConfig } from "../config/app";
import { _uploadVideo, DEFAULT_BILIUP_CONFIG, readBiliupPreset } from "../biliup";
import { mainWin } from "../index";
import { convertDanmu2Ass } from "../danmu";
import { taskQueue } from "../task";
import { mergeAssMp4 } from "../video";
import bili from "../bili";
import { getFfmpegPreset } from "../ffmpegPreset";
import log from "../utils/log";
import { getFileSize, uuid } from "../../utils/index";
import express from "express";

import type { BlrecEventType } from "./brelcEvent.d.ts";
import type { FfmpegOptions } from "../../types";

const app = express();

app.use(express.json());

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
  // evenetData.biliRecoder.push(event);

  if (
    appConfig.webhook.open &&
    appConfig.webhook.recoderFolder &&
    event.EventType === "FileClosed"
  ) {
    const roomId = event.EventData.RoomId;
    const filePath = path.join(appConfig.webhook.recoderFolder, event.EventData.RelativePath);

    handle({
      filePath: filePath,
      roomId: roomId,
      time: event.EventData.FileOpenTime,
      title: event.EventData.Title,
      username: event.EventData.Name,
    });
  }
  res.send("ok");
});

app.post("/blrec", async function (req, res) {
  const appConfig = getAppConfig();
  log.info("blrec: webhook", req.body);
  const event: BlrecEventType = req.body;
  // evenetData.blrec.push(event);

  if (appConfig.webhook.open && event.type === "VideoFileCompletedEvent") {
    const roomId = event.data.room_id as unknown as number;

    const masterRes = await bili.client.live.getRoomInfo(event.data.room_id);
    const userRes = await bili.client.live.getMasterInfo(masterRes.data.uid);

    handle({
      filePath: event.data.path,
      roomId: roomId,
      time: masterRes.data.live_time,
      title: masterRes.data.title,
      username: userRes.data.info.uname,
    });
  }
  res.send("ok");
});

async function handle(options: {
  filePath: string;
  roomId: number;
  time: string;
  username: string;
  title: string;
}) {
  const appConfig = getAppConfig();
  const roomSetting = appConfig.webhook.rooms[options.roomId];
  log.info("room setting", options.roomId, roomSetting);
  let danmu = appConfig.webhook.danmu;
  if (roomSetting?.danmu !== undefined) danmu = roomSetting.danmu;

  const data = {
    time: options.time,
    title: options.title,
    name: options.username,
  };

  const fileSize = await getFileSize(options.filePath);

  const minSize = roomSetting?.minSize || appConfig.webhook.minSize || 0;
  if (fileSize / 1024 / 1024 < minSize) {
    log.info("blrec: file size too small");
    return;
  }
  if (appConfig.webhook.blacklist.includes(String(options.roomId))) {
    log.info(`blrec: ${options.roomId} is in blacklist`);
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
      _uploadVideo([options.filePath], config);
      return;
    }

    const assFilePath = await addDanmuTask(xmlFilePath, danmuPresetId);

    const ffmpegPreset = await getFfmpegPreset(undefined, videoPresetId);
    if (!ffmpegPreset) {
      log.error("ffmpegPreset not found", videoPresetId);
      return;
    }
    const output = await addMergeAssMp4Task(options.filePath, assFilePath, ffmpegPreset?.config);
    fs.remove(assFilePath);
    _uploadVideo([output], config);
  } else {
    _uploadVideo([options.filePath], config);
  }
}

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// 添加压制任务
const addDanmuTask = (input: string, presetId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const assFilePath = `${path.join(os.tmpdir(), uuid())}.ass`;
    convertDanmu2Ass(
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
      presetId,
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
