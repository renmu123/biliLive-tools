import { getAppConfig } from "../config/app";
import { _uploadVideo, DEFAULT_BILIUP_CONFIG, _readBiliupPreset } from "../biliup";
import path from "path";
import log from "../utils/log";
import { getFileSize } from "../../utils/index";

import express from "express";
const app = express();

app.use(express.json());

// 使用内置的中间件处理表单数据
app.use(express.urlencoded({ extended: true }));

app.get("/", function (_req, res) {
  res.send("Hello World");
});

app.post("/webhook", async function (req, res) {
  const appConfig = getAppConfig();
  log.info("录播姬：", req.body);
  const data = req.body;

  if (
    appConfig.webhook.open &&
    appConfig.webhook.recoderFolder &&
    appConfig.webhook.autoUpload &&
    data.EventType === "FileClosed"
  ) {
    const roomId = data.EventData.RoomId;
    const roomSetting = appConfig.webhook.rooms[roomId];
    log.info("room setting", roomId, roomSetting);

    console.log(data.EventData.FileOpenTime, formatTime(data.EventData.FileOpenTime));

    const minSize = roomSetting?.minSize || appConfig.webhook.minSize || 0;
    if (data.EventData.FileSize / 1024 / 1024 < minSize) {
      log.info("录播姬：file size too small");
      res.send("录播姬：file size too small");
      return;
    }
    if (appConfig.webhook.blacklist.includes(roomId)) {
      log.info(`录播姬：${roomId} is in blacklist`);
      res.send(`录播姬：${roomId} is in blacklist`);
      return;
    }

    const filePath = path.join(appConfig.webhook.recoderFolder, data.EventData.RelativePath);

    let config = DEFAULT_BILIUP_CONFIG;

    const uploadPresetId =
      roomSetting?.uploadPresetId || appConfig.webhook.uploadPresetId || "default";
    if (uploadPresetId) {
      const preset = await _readBiliupPreset(uploadPresetId);
      config = { ...config, ...preset.config };
    }

    const title = roomSetting?.title || appConfig.webhook.title || "";
    config.title = title
      .replaceAll("{{title}}", data.EventData.Title)
      .replaceAll("{{user}}", data.EventData.Name)
      .replaceAll("{{now}}", formatTime(data.EventData.FileOpenTime))
      .trim()
      .slice(0, 80);
    if (!config.title) config.title = path.parse(filePath).name;

    log.info("录播姬：upload config", config);

    _uploadVideo([filePath], config);
  }
  res.send("ok");
});

app.post("/blrec", async function (req, res) {
  const appConfig = getAppConfig();
  log.info("blrec: webhook", req.body);
  const data = req.body;

  if (
    appConfig.webhook.open &&
    appConfig.webhook.recoderFolder &&
    appConfig.webhook.autoUpload &&
    data.type === "VideoFileCompletedEvent"
  ) {
    const roomId = data.EventData.room_id;
    const roomSetting = appConfig.webhook.rooms[roomId];

    console.log(data.date, formatTime(data.date));
    const fileSize = await getFileSize(data.data.path);

    const minSize = roomSetting?.minSize || appConfig.webhook.minSize || 0;
    if (fileSize / 1024 / 1024 < minSize) {
      log.info("blrec: file size too small");
      res.send("file size too small");
      return;
    }
    if (appConfig.webhook.blacklist.includes(roomId)) {
      log.info(`blrec: ${roomId} is in blacklist`);
      res.send(`${roomId} is in blacklist`);
      return;
    }

    let config = DEFAULT_BILIUP_CONFIG;
    const uploadPresetId =
      roomSetting?.uploadPresetId || appConfig.webhook.uploadPresetId || "default";
    if (appConfig.webhook.uploadPresetId) {
      const preset = await _readBiliupPreset(uploadPresetId);
      config = { ...config, ...preset.config };
    }

    const filePath = data.data.path;
    const title = roomSetting?.title || appConfig.webhook.title || "";
    config.title = title
      .replaceAll("{{title}}", data.data.Title)
      .replaceAll("{{user}}", data.data.Name)
      .replaceAll("{{now}}", formatTime(data.data.FileOpenTime))
      .trim()
      .slice(0, 80);
    if (!config.title) config.title = path.parse(filePath).name;

    log.info("upload config", config);

    _uploadVideo([filePath], config);
  }
  res.send("ok");
});

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
