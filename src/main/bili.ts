import { Client, TvQrcodeLogin } from "@renmu/bili-api";
import { BILIUP_COOKIE_PATH } from "./appConstant";
import { format, writeUser } from "./biliup";

import { type IpcMainInvokeEvent } from "electron";

type ClientInstance = InstanceType<typeof Client>;

const client = new Client();
loadCookie();

async function loadCookie() {
  // TODO: 改成不从文件加载
  return client.loadCookieFile(BILIUP_COOKIE_PATH);
}

async function getArchives(
  params?: Parameters<ClientInstance["platform"]["getArchives"]>[0],
): ReturnType<ClientInstance["platform"]["getArchives"]> {
  await loadCookie();
  return client.platform.getArchives(params);
}

async function checkTag(tag: string): ReturnType<ClientInstance["platform"]["checkTag"]> {
  await loadCookie();
  return client.platform.checkTag(tag);
}

async function getUserInfo(uid: number): ReturnType<ClientInstance["user"]["getUserInfo"]> {
  return client.user.getUserInfo(uid);
}

function login() {
  const tv = new TvQrcodeLogin();
  return tv.login();
}

export const biliApi = {
  getArchives,
  checkTag,
  loadCookie,
  login,
  getUserInfo,
};

export const invokeWrap = <T extends (...args: any[]) => any>(fn: T) => {
  return (_event: IpcMainInvokeEvent, ...args: Parameters<T>): ReturnType<T> => {
    return fn(...args);
  };
};

let tv: TvQrcodeLogin;

export const handlers = {
  "biliApi:getArchives": (
    _event: IpcMainInvokeEvent,
    params: Parameters<typeof biliApi.getArchives>[0],
  ): ReturnType<typeof biliApi.getArchives> => {
    return biliApi.getArchives(params);
  },
  "biliApi:checkTag": (
    _event: IpcMainInvokeEvent,
    tag: Parameters<typeof biliApi.checkTag>[0],
  ): ReturnType<typeof biliApi.checkTag> => {
    return biliApi.checkTag(tag);
  },
  "biliApi:login": (event: IpcMainInvokeEvent) => {
    tv = new TvQrcodeLogin();
    tv.on("error", (res) => {
      event.sender.send("biliApi:login-error", res);
    });
    tv.on("scan", (res) => {
      console.log(res);
    });
    tv.on("completed", async (res) => {
      const data = res.data;
      const user = await format(data);
      await writeUser(user);
      event.sender.send("biliApi:login-completed", res);
    });
    return tv.login();
  },
  "biliApi:login:cancel": () => {
    tv.interrupt();
  },
  "bili:updateUserInfo": async (
    _event: IpcMainInvokeEvent,
    uid: number,
  ): ReturnType<typeof getUserInfo> => {
    // TODO:获取用户名称和头像后替换
    return getUserInfo(uid);
  },
};

export default {
  client,
};
