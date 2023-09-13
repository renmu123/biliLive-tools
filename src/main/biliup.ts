import { app } from "electron";
import { join, dirname } from "path";
import fs from "fs-extra";

import Biliup from "./biliup/index";

import type { IpcMainInvokeEvent } from "electron";

// 上传视频
export const uploadVideo = (_event: IpcMainInvokeEvent, path: string) => {
  const BILIUP_PATH = join(__dirname, "../../resources/bin/biliup.exe").replace(
    "app.asar",
    "app.asar.unpacked",
  );
  const BILIUP_COOKIE = join(app.getPath("userData"), "cookies.json");
  const biliup = new Biliup();
  biliup.setBiliUpPath(BILIUP_PATH);
  biliup.setCookiePath(BILIUP_COOKIE);
  biliup.uploadVideo(path);
};

// 调用bili登录窗口
export const biliLogin = (_event: IpcMainInvokeEvent) => {
  const BILIUP_PATH = join(__dirname, "../../resources/bin/biliup.exe").replace(
    "app.asar",
    "app.asar.unpacked",
  );
  const biliup = new Biliup();
  biliup.setBiliUpPath(BILIUP_PATH);
  biliup.login();

  biliup.on("login-close", (code) => {
    _event.sender.send("login-win-close", code);
  });
};

// 读取登录验证码
export const readQrCode = () => {
  let imagePath = join(dirname(app.getPath("exe")), "qrcode.png");
  if (import.meta.env.DEV) {
    imagePath = join(__dirname, "../../qrcode.png");
  }
  return fs.readFileSync(imagePath).toString("base64");
};

// 保存登录cookie到用户文件夹
export const saveBiliCookie = async () => {
  let cookiePtah = join(dirname(app.getPath("exe")), "cookies.json");
  if (import.meta.env.DEV) {
    cookiePtah = join(__dirname, "../../cookies.json");
  }
  const savePath = app.getPath("userData");
  return await fs.move(cookiePtah, join(savePath, "cookies.json"), { overwrite: true });
};

// 检查bili登录的cookie是否存在
export const checkBiliCookie = async () => {
  const cookiePath = join(app.getPath("userData"), "cookies.json");
  return await fs.pathExists(cookiePath);
};
