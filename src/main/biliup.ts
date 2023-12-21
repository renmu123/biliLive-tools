import fs from "fs-extra";

import Biliup from "./biliup/index";
import log from "./utils/log";
import Config from "./utils/config";
import CommonPreset from "./utils/preset";
import { biliApi } from "./bili";

import { BILIUP_PATH, BILIUP_COOKIE_PATH, UPLOAD_PRESET_PATH } from "./appConstant";

import type { IpcMainInvokeEvent, WebContents } from "electron";
import type { BiliupConfig, BiliupConfigAppend, BiliupPreset, BiliUser } from "../types/index";

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

// 上传视频
export const uploadVideo = async (
  webContents: WebContents,
  pathArray: string[],
  options: BiliupConfig,
) => {
  const biliup = await _uploadVideo(pathArray, options);

  biliup.on("close", (code) => {
    webContents.send("upload-close", code, pathArray);
  });
  return biliup;
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

export const _appendVideo = async (pathArray: string[], options: BiliupConfigAppend) => {
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
  return biliup;
};

// 追加视频
export const appendVideo = async (
  webContents: WebContents,
  pathArray: string[],
  options: BiliupConfigAppend,
) => {
  const biliup = await _appendVideo(pathArray, options);
  biliup.on("close", (code) => {
    webContents.send("upload-close", code, pathArray);
  });
  return biliup;
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

// 检查bili登录的cookie是否存在
export const checkBiliCookie = async () => {
  const cookiePath = BILIUP_COOKIE_PATH;
  return fs.pathExists(cookiePath);
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

const uploadPreset = new CommonPreset(UPLOAD_PRESET_PATH, DEFAULT_BILIUP_CONFIG);
// 读取biliup预设
export const readBiliupPresets = async (): Promise<BiliupPreset[]> => {
  return uploadPreset.list();
};
// 保存biliup预设
export const saveBiliupPreset = async (_event: IpcMainInvokeEvent, presets: BiliupPreset) => {
  return uploadPreset.save(presets);
};
// 删除biliup预设
export const deleteBiliupPreset = async (_event: IpcMainInvokeEvent, id: string) => {
  return uploadPreset.delete(id);
};
// 读取biliup预设
export const readBiliupPreset = async (_event: IpcMainInvokeEvent | undefined, id: string) => {
  return uploadPreset.get(id);
};
// 删除bili登录的cookie
export const deleteBiliCookie = async () => {
  return await fs.remove(BILIUP_COOKIE_PATH);
};

// 写入用户数据
export const writeUser = async (data: BiliUser) => {
  const config = new Config("app.json");
  const users = config.get("biliUser") || {};
  users[data.mid] = data;
  config.set("biliUser", users);
};

// 读取用户数据
export const readUser = async (mid: number): Promise<BiliUser | undefined> => {
  const config = new Config("app.json");
  const users = config.get("biliUser") || {};
  return users[mid];
};

// 读取用户列表
export const readUserList = async (): Promise<BiliUser[]> => {
  const config = new Config("app.json");
  const users = config.get("biliUser") || {};
  return Object.values(users);
};

const format = (data: any) => {
  const result: BiliUser = {
    mid: data.mid,
    rawAuth: JSON.stringify(data),
    cookie: data.cookie,
    expires: data.expires_in,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    platform: "TV",
  };
  return result;
};

export const handlers = {
  "bili:validUploadParams": validateBiliupConfig,
  "bili:getPreset": readBiliupPreset,
  "bili:savePreset": saveBiliupPreset,
  "bili:deletePreset": deleteBiliupPreset,
  "bili:getPresets": readBiliupPresets,
  "bili:checkCookie": checkBiliCookie,
  "bili:deleteCookie": deleteBiliCookie,
  "bili:removeUser": async (_event: IpcMainInvokeEvent, mid: number) => {
    const config = new Config("app.json");
    const users = config.get("biliUser") || {};
    delete users[mid];
    config.set("biliUser", users);
  },
  "bili:readUserList": () => {
    return readUserList();
  },
  "bili:checkOldCookie": async () => {
    const cookiePath = BILIUP_COOKIE_PATH;
    return fs.pathExists(cookiePath);
  },
  "bili:migrateCookie": async () => {
    const data: unknown = await fs.readJSON(BILIUP_COOKIE_PATH);
    const user = format(data);
    const biliUser = (await biliApi.getUserInfo(user.mid)).data;
    user.name = biliUser.name;
    user.avavtar = biliUser.face;

    await writeUser(user);
    await fs.remove(BILIUP_COOKIE_PATH);
  },
  "bili:uploadVideo": async (
    _event: IpcMainInvokeEvent,
    pathArray: string[],
    options: BiliupConfig,
  ) => {
    uploadVideo(_event.sender, pathArray, options);
  },
  "bili:appendVideo": async (
    _event: IpcMainInvokeEvent,
    pathArray: string[],
    options: BiliupConfigAppend,
  ) => {
    appendVideo(_event.sender, pathArray, options);
  },
};
