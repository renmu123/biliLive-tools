import { getAppConfig } from "../config/app";
import { _uploadVideo, DEFAULT_BILIUP_CONFIG } from "../biliup";
import path from "path";
import log from "../utils/log";

import express from "express";
const app = express();

app.use(express.json());

// 使用内置的中间件处理表单数据
app.use(express.urlencoded({ extended: true }));

app.get("/", function (_req, res) {
  res.send("Hello World111");
});

app.post("/webhook", function (req, res) {
  const appConfig = getAppConfig();
  log.info("webhook", req.body);
  const data = req.body;
  if (
    appConfig.webhook.open &&
    appConfig.webhook.recoderFolder &&
    appConfig.webhook.autoUpload &&
    data.EventType === "FileClosed"
  ) {
    if (data.EventData.FileSize / 1024 / 1024 < appConfig.webhook.minSize) {
      res.send("file size too small");
    }
    const filePath = path.join(appConfig.webhook.recoderFolder, data.EventData.RelativePath);
    console.log(filePath);
    const { name } = path.parse(filePath);

    const config = DEFAULT_BILIUP_CONFIG;
    config.title = name;
    config.desc = name;

    _uploadVideo([filePath], config);

    // data.EventData.RelativePath;
    // data.EventData.FileSize;
    // data.EventData.Duration;
  }
  res.send("ok");
});

export default app;
