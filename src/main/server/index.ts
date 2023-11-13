import { getAppConfig } from "../config/app";

import express from "express";
const app = express();

app.use(express.json());

// 使用内置的中间件处理表单数据
app.use(express.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.send("Hello World111");
});

app.post("/webhook", function (req, res) {
  const appConfig = getAppConfig();
  console.log(req.body);
  const data = req.body;
  if (
    appConfig.webhook.open &&
    appConfig.webhook.recoderFolder &&
    appConfig.webhook.autoUpload &&
    data.EventType === "FileClosed"
  ) {
    // data.EventData.RelativePath;
    // data.EventData.FileSize;
    // data.EventData.Duration;
  }
  res.send("Hello World111");
});

export default app;
