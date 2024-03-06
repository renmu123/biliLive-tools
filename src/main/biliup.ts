import path from "node:path";
import os from "node:os";
import fs from "fs-extra";

import Biliup from "./biliup/index";
import log from "./utils/log";
import { appConfig } from "./config";
import { uuid } from "./utils/index";
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
  noReprint: 0,
  openElec: 0,
  closeDanmu: 0,
  closeReply: 0,
  selectiionReply: 0,
  recreate: -1,
  no_disturbance: 0,
};

// 上传视频
export const uploadVideo = async (
  webContents: WebContents,
  uid: number,
  pathArray: string[],
  options: BiliupConfig,
) => {
  const user = await readUser(uid);
  if (!user) {
    throw new Error("用户不存在");
  }
  const temp = os.tmpdir();
  const cookiePath = path.join(temp, `${uid}-${uuid()}.json`);
  console.log("cookiePath", cookiePath);
  console.log("BILIUP_PATH", user.cookie);
  await fs.writeFile(cookiePath, user.rawAuth);

  const biliup = await _uploadVideo(cookiePath, pathArray, options);

  biliup.on("close", (code) => {
    fs.remove(cookiePath);
    webContents.send("upload-close", code, pathArray);
  });
  return biliup;
};

// 上传视频
export const _uploadVideo = async (
  cookiePath: string,
  pathArray: string[],
  options: BiliupConfig,
) => {
  log.info("cookiePath", cookiePath);
  log.info("BILIUP_PATH", BILIUP_PATH);

  const biliup = new Biliup();
  biliup.setBiliUpPath(BILIUP_PATH);
  biliup.setCookiePath(cookiePath);
  const args = genBiliupOPtions(options);
  biliup.uploadVideo(pathArray, args);
  return biliup;
};

export const _appendVideo = async (
  cookiePath: string,
  pathArray: string[],
  options: BiliupConfigAppend,
) => {
  log.info("cookiePath", cookiePath);
  log.info("BILIUP_PATH", BILIUP_PATH);

  const biliup = new Biliup();
  biliup.setBiliUpPath(BILIUP_PATH);
  biliup.setCookiePath(cookiePath);
  biliup.appendVideo(pathArray, [`--vid ${options.vid}`]);
  return biliup;
};

// 追加视频
export const appendVideo = async (
  webContents: WebContents,
  uid: number,
  pathArray: string[],
  options: BiliupConfigAppend,
) => {
  const user = await readUser(uid);
  if (!user) {
    throw new Error("用户不存在");
  }
  const temp = os.tmpdir();
  const cookiePath = path.join(temp, `${uid}-${uuid()}.json`);
  await fs.writeFile(cookiePath, user.rawAuth);

  const biliup = await _appendVideo(cookiePath, pathArray, options);
  biliup.on("close", (code) => {
    fs.remove(cookiePath);
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
    } else if (key === "noReprint") {
      return `--no-reprint ${value}`;
    } else if (key === "openElec") {
      return `--open-elec ${value}`;
    } else if (key === "closeDanmu") {
      if (value === 1) {
        return `--up-close-danmu`;
      } else {
        return "";
      }
    } else if (key === "closeReply") {
      if (value === 1) {
        return `--up-close-reply`;
      } else {
        return "";
      }
    } else if (key === "selectiionReply") {
      if (value === 1) {
        return `--up-selection-reply`;
      } else {
        return "";
      }
    } else {
      return `--${key} ${value}`;
    }
  });
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
    throw new Error(msg);
  }
  return true;
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
export const deleteUser = async (uid: number) => {
  const users = appConfig.get("biliUser") || {};
  delete users[uid];
  appConfig.set("biliUser", users);
  return true;
};

// 写入用户数据
export const writeUser = async (data: BiliUser) => {
  const users = appConfig.get("biliUser") || {};
  users[data.mid] = data;
  appConfig.set("biliUser", users);
};

// 读取用户数据
export const readUser = async (mid: number): Promise<BiliUser | undefined> => {
  const users = appConfig.get("biliUser") || {};
  return users[mid];
};

// 读取用户列表
export const readUserList = async (): Promise<BiliUser[]> => {
  const users = appConfig.get("biliUser") || {};
  return Object.values(users) as unknown as BiliUser[];
};

export const format = async (data: any) => {
  const cookieObj = {};
  (data?.cookie_info?.cookies || []).map((item: any) => (cookieObj[item.name] = item.value));

  const result: BiliUser = {
    mid: data.mid,
    rawAuth: JSON.stringify(data),
    cookie: cookieObj as any,
    expires: data.expires_in,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    platform: "TV",
  };

  try {
    const biliUser = await biliApi.getUserInfo(data.mid);
    result.name = biliUser.name;
    result.avatar = biliUser.face;
  } catch (e) {
    log.error(e);
  }

  return result;
};

export const handlers = {
  "bili:validUploadParams": validateBiliupConfig,
  "bili:getPreset": readBiliupPreset,
  "bili:savePreset": saveBiliupPreset,
  "bili:deletePreset": deleteBiliupPreset,
  "bili:getPresets": readBiliupPresets,
  "bili:deleteUser": (_event: IpcMainInvokeEvent, mid: number) => {
    return deleteUser(mid);
  },
  "bili:removeUser": async (_event: IpcMainInvokeEvent, mid: number) => {
    const users = appConfig.get("biliUser") || {};
    delete users[mid];
    appConfig.set("biliUser", users);
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
    const user = await format(data);

    await writeUser(user);
    await fs.remove(BILIUP_COOKIE_PATH);
  },
  "bili:uploadVideo": async (
    _event: IpcMainInvokeEvent,
    uid: number,
    pathArray: string[],
    options: BiliupConfig,
  ) => {
    const useBiliup = appConfig.get("useBiliup");
    if (useBiliup) {
      uploadVideo(_event.sender, uid, pathArray, options);
    } else {
      biliApi.addMedia(_event.sender, pathArray, options, uid);
    }
  },
  "bili:appendVideo": async (
    _event: IpcMainInvokeEvent,
    uid: number,
    pathArray: string[],
    options: BiliupConfigAppend,
  ) => {
    const useBiliup = appConfig.get("useBiliup");
    if (useBiliup) {
      appendVideo(_event.sender, uid, pathArray, options);
    } else {
      biliApi.editMedia(_event.sender, options.vid as number, pathArray, options, uid);
    }
  },
};
