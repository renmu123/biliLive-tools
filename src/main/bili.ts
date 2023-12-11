import { Client, TvQrcodeLogin } from "@renmu/bili-api";
import { BILIUP_COOKIE_PATH } from "./appConstant";

import { type IpcMainInvokeEvent } from "electron";

type ClientInstance = InstanceType<typeof Client>;

const client = new Client();
client.loadCookieFile(BILIUP_COOKIE_PATH);

async function loadCookie() {
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

async function getMyInfo(): ReturnType<ClientInstance["user"]["getMyInfo"]> {
  await loadCookie();
  return client.user.getMyInfo();
}

function login() {
  const tv = new TvQrcodeLogin();
  return tv.login();
}

export const biliApi = {
  getArchives,
  checkTag,
  getMyInfo,
  loadCookie,
  login,
};

export const invokeWrap = <T extends (...args: any[]) => any>(fn: T) => {
  return (_event: IpcMainInvokeEvent, ...args: Parameters<T>): ReturnType<T> => {
    return fn(...args);
  };
};

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
  "biliApi:getMyInfo": (): ReturnType<typeof biliApi.getMyInfo> => {
    return biliApi.getMyInfo();
  },
  "biliApi:updateCookie": () => {
    return biliApi.loadCookie();
  },
  "biliApi:login": (event: IpcMainInvokeEvent) => {
    const tv = new TvQrcodeLogin();
    const t = Date.now();
    tv.on("error", (res) => {
      event.sender.send("biliApi:login-error", res);
    });
    tv.on("completed", (res) => {
      event.sender.send("biliApi:login-completed", res);
    });
    tv.on("scan", (res) => {
      console.log("scan", res, t);
      event.sender.send("biliApi:login-scan", res);
    });
    return tv.login();
  },
};

export default {
  client,
};
