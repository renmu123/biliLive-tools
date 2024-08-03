import log from "./utils/log";
import { invokeWrap } from "./utils/index";
import { appConfig, videoPreset } from "@biliLive-tools/shared";
import { biliApi } from "./bili";

import type { IpcMainInvokeEvent } from "electron";
import type {
  BiliupConfig,
  BiliupConfigAppend,
  BiliupPreset,
  BiliUser,
} from "@biliLive-tools/types";

// 删除bili登录的cookie
export const deleteUser = async (uid: number) => {
  const users = appConfig.get("biliUser") || {};
  delete users[uid];
  appConfig.set("biliUser", users);
  return true;
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
  "bili:validUploadParams": invokeWrap(biliApi.validateBiliupConfig),
  "bili:getPreset": (_event: IpcMainInvokeEvent, id: string) => {
    return videoPreset.get(id);
  },
  "bili:savePreset": (_event: IpcMainInvokeEvent, presets: BiliupPreset) => {
    return videoPreset.save(presets);
  },
  "bili:deletePreset": (_event: IpcMainInvokeEvent, id: string) => {
    return videoPreset.delete(id);
  },
  "bili:getPresets": () => {
    return videoPreset.list();
  },
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
  "bili:uploadVideo": async (
    _event: IpcMainInvokeEvent,
    uid: number,
    pathArray: string[],
    options: BiliupConfig,
  ) => {
    const task = await biliApi.addMedia(pathArray, options, uid);
    return {
      taskId: task.taskId,
    };
  },
  "bili:appendVideo": async (
    _event: IpcMainInvokeEvent,
    uid: number,
    pathArray: string[],
    options: BiliupConfigAppend,
  ) => {
    const task = await biliApi.editMedia(options.vid as number, pathArray, options, uid);
    return {
      taskId: task.taskId,
    };
  },
};
