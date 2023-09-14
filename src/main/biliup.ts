import { app } from "electron";
import { join, dirname } from "path";
import fs from "fs-extra";

import Biliup from "./biliup/index";
import BiliApi from "./biliApi";

import type { IpcMainInvokeEvent } from "electron";
import type { BiliupConfig, BiliupPreset } from "../types/index";

export const DEFAULT_BILIUP_CONFIG: BiliupConfig = {
  title: "",
  desc: "",
  dolby: 0,
  lossless_music: 0,
  copyright: 1,
  tag: ["biliLive-tools"], // tag应该为""以,分割的字符串
  tid: 138,
  source: "",
};

const BILIUP_PATH = join(__dirname, "../../resources/bin/biliup.exe").replace(
  "app.asar",
  "app.asar.unpacked",
);

// 上传视频
export const uploadVideo = (_event: IpcMainInvokeEvent, path: string) => {
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

// 读取biliup预设
export const readBiliupPresets = async (): Promise<BiliupPreset[]> => {
  const presetsPath = join(app.getPath("userData"), "presets.json");
  if (await fs.pathExists(presetsPath)) {
    const presets: BiliupPreset[] = await fs.readJSON(presetsPath);
    presets.map((preset) => {
      preset.config = { ...DEFAULT_BILIUP_CONFIG, ...preset.config };
      return preset;
    });
    return presets;
  }
  return [{ id: "default", name: "默认配置", config: DEFAULT_BILIUP_CONFIG }];
};

// 验证配置
export const validateBiliupConfig = async (_event: IpcMainInvokeEvent, config: BiliupConfig) => {
  let msg: string | undefined = undefined;
  if (!config.title) {
    msg = "标题不能为空";
  }
  if (config.title.length > 80) {
    msg = "标题不能超过80个字符";
  }
  if (config.desc && config.desc.length > 250) {
    msg = "简介不能超过250个字符";
  }
  if (config.copyright === 2) {
    if (!config.source) {
      msg = "转载来源不能为空";
    } else {
      if (config.source.length > 200) {
        msg = "转载来源不能超过200个字符";
      }
    }
  }
  if (config.tag.length === 0) {
    msg = "标签不能为空";
  }
  if (config.tag.length > 12) {
    msg = "标签不能超过12个";
  }

  if (msg) {
    return msg;
  }
  return true;
};

// 保存biliup预设
export const saveBiliupPreset = async (_event: IpcMainInvokeEvent, presets: BiliupPreset) => {
  const allPresets = await readBiliupPresets();
  const presetIndex = allPresets.findIndex((item) => item.id === presets.id);
  const msg = await validateBiliupConfig(_event, presets.config);

  if (msg !== true) {
    return msg;
  }

  if (presetIndex === -1) {
    allPresets.push(presets);
  } else {
    allPresets[presetIndex] = presets;
  }
  const presetsPath = join(app.getPath("userData"), "presets.json");
  await fs.writeJSON(presetsPath, allPresets);
};

// 标签验证
export const validateBiliupTag = async (_event: IpcMainInvokeEvent, tag: string) => {
  const cookieList = (await fs.readJSON(join(app.getPath("userData"), "cookies.json"))).cookie_info
    .cookies;
  const api = new BiliApi(convertCookie(cookieList));

  const res = await api.checkTag(tag);
  return res;
  console.log(res);
};

const convertCookie = (cookie: { name: string; value: string }[]) => {
  return cookie.map((item) => `${item.name}=${item.value}`).join("; ");
};
