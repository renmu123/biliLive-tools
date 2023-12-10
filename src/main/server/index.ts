import type { BlrecEventType } from "./brelcEvent.d.ts";

import { getAppConfig } from "../config/app";
import { _uploadVideo, DEFAULT_BILIUP_CONFIG, readBiliupPreset } from "../biliup";
import bili from "../bili";
import path from "path";
import log from "../utils/log";
import { getFileSize } from "../../utils/index";

import express from "express";
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
  log.info("appConfig: ", appConfig.webhook);

  const event = req.body;
  // evenetData.biliRecoder.push(event);

  if (
    appConfig.webhook.open &&
    appConfig.webhook.recoderFolder &&
    event.EventType === "FileClosed"
  ) {
    const roomId = event.EventData.RoomId;

    handle({
      filePath: event.data.path,
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
  log.info("appConfig: ", appConfig.webhook);
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
  const danmu = roomSetting?.danmu || appConfig.webhook.danmu || false;

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

  if (danmu) {
    // 压制弹幕后上传
    // TODO:检测弹幕文件是否存在
    // const danmuPreset = ""
    // const videoPreset = ""
  } else {
    _uploadVideo([options.filePath], config);
  }
}

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
