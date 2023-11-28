import { app } from "electron";
import { join, dirname } from "path";
import fs from "fs-extra";

import Biliup from "./biliup/index";
import log from "./utils/log";
import { BILIUP_PATH, BILIUP_COOKIE_PATH, UPLOAD_PRESET_PATH } from "./appConstant";
import { UploadPreset } from "../core/upload";

import type { IpcMainInvokeEvent } from "electron";
import type { BiliupConfig, BiliupConfigAppend, BiliupPreset } from "../types/index";

export const DEFAULT_BILIUP_CONFIG: BiliupConfig = {
  title: "",
  desc: "",
  dolby: 0,
  hires: 0,
  copyright: 1,
  tag: ["biliLive-tools"], // tag应该为""以,分割的字符串
  tid: 138,
  source: "",
  dynamic: "",
  cover: "",
};

const uploadPreset = new UploadPreset(UPLOAD_PRESET_PATH);

// 上传视频
export const uploadVideo = async (
  _event: IpcMainInvokeEvent,
  pathArray: string[],
  options: BiliupConfig,
) => {
  const biliup = await _uploadVideo(pathArray, options);

  biliup.on("close", (code) => {
    _event.sender.send("upload-close", code);
  });
};

// 上传视频
export const _uploadVideo = async (pathArray: string[], options: BiliupConfig) => {
  const hasLogin = await checkBiliCookie();
  if (!hasLogin) {
    throw new Error("你还没有登录");
  }
  log.info("BILIUP_COOKIE_PATH", BILIUP_COOKIE_PATH);
  log.info("BILIUP_PATH", BILIUP_PATH);

  const BILIUP_COOKIE = BILIUP_COOKIE_PATH;
  const biliup = new Biliup();
  biliup.setBiliUpPath(BILIUP_PATH);
  biliup.setCookiePath(BILIUP_COOKIE);
  const args = genBiliupOPtions(options);
  biliup.uploadVideo(pathArray, args);
  return biliup;
};

// 追加视频
export const appendVideo = async (
  _event: IpcMainInvokeEvent,
  pathArray: string[],
  options: BiliupConfigAppend,
) => {
  const hasLogin = await checkBiliCookie();
  if (!hasLogin) {
    throw new Error("你还没有登录");
  }
  log.info("BILIUP_COOKIE_PATH", BILIUP_COOKIE_PATH);
  log.info("BILIUP_PATH", BILIUP_PATH);

  const BILIUP_COOKIE = BILIUP_COOKIE_PATH;
  const biliup = new Biliup();
  biliup.setBiliUpPath(BILIUP_PATH);
  biliup.setCookiePath(BILIUP_COOKIE);
  biliup.appendVideo(pathArray, [`--vid ${options.vid}`]);
  biliup.on("close", (code) => {
    _event.sender.send("append-close", code);
  });
};

const genBiliupOPtions = (options: BiliupConfig) => {
  return Object.entries(options).map(([key, value]) => {
    if (DEFAULT_BILIUP_CONFIG[key] === undefined) {
      return "";
    }

    if (key === "tag") {
      return `--${key} "${value.join(",")}"`;
    } else if (["title", "desc"].includes(key)) {
      return `--${key} "${value.trim().replaceAll("\n", "\\n")}"`;
    } else if (key === "copyright") {
      if (value === 1) {
        return `--${key} ${value}`;
      } else if (value === 2) {
        return `--${key} ${value} --source "${options.source}"`;
      } else {
        return "";
      }
    } else if (key === "source") {
      // do nothing
      return "";
    } else if (key === "dynamic") {
      if (value) {
        return `--${key} "${value}"`;
      } else {
        return "";
      }
    } else if (key === "cover") {
      if (value) {
        return `--${key} "${value}"`;
      } else {
        return "";
      }
    } else {
      return `--${key} ${value}`;
    }
  });
};

// 调用bili登录窗口
export const biliLogin = (_event: IpcMainInvokeEvent) => {
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
  const cookiePath = BILIUP_COOKIE_PATH;
  return await fs.pathExists(cookiePath);
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
  return false;
};

// 读取biliup预设
export const readBiliupPresets = async (): Promise<BiliupPreset[]> => {
  return uploadPreset.readBiliupPresets();
};
// 保存biliup预设
export const saveBiliupPreset = async (_event: IpcMainInvokeEvent, presets: BiliupPreset) => {
  return uploadPreset.saveBiliupPreset(presets);
};
// 删除biliup预设
export const deleteBiliupPreset = async (_event: IpcMainInvokeEvent, id: string) => {
  return uploadPreset.deleteBiliupPreset(id);
};

// 读取biliup预设
export const readBiliupPreset = async (_event: IpcMainInvokeEvent, id: string) => {
  return uploadPreset.readBiliupPreset(id);
};

// 读取biliup预设
export const _readBiliupPreset = async (id: string) => {
  return uploadPreset.readBiliupPreset(id);
};

// 删除bili登录的cookie
export const deleteBiliCookie = async () => {
  return await fs.remove(BILIUP_COOKIE_PATH);
};
