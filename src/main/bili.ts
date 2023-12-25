import { Client, TvQrcodeLogin } from "@renmu/bili-api";
import { format, writeUser, readUser } from "./biliup";
import { appConfig } from "./config";
import { type IpcMainInvokeEvent } from "electron";

type ClientInstance = InstanceType<typeof Client>;

const client = new Client();

/**
 * 加载cookie
 * @param uid 用户id
 */
async function loadCookie(uid?: number) {
  const mid = uid || appConfig.get("uid");

  if (!mid) throw new Error("请先登录");
  const user = await readUser(mid);
  const data = await JSON.parse(user?.rawAuth || "{}");
  return client.setAuth(user?.cookie, data.accessToken);
}

async function getArchives(
  params?: Parameters<ClientInstance["platform"]["getArchives"]>[0],
  uid?: number,
): ReturnType<ClientInstance["platform"]["getArchives"]> {
  await loadCookie(uid);
  return client.platform.getArchives(params);
}

async function checkTag(
  tag: string,
  uid: number,
): ReturnType<ClientInstance["platform"]["checkTag"]> {
  await loadCookie(uid);
  return client.platform.checkTag(tag);
}

async function getUserInfo(uid: number): ReturnType<ClientInstance["user"]["getUserInfo"]> {
  return client.user.getUserInfo(uid);
}

async function getMyInfo(uid: number): ReturnType<ClientInstance["user"]["getMyInfo"]> {
  await loadCookie(uid);
  return client.user.getMyInfo();
}

function login() {
  const tv = new TvQrcodeLogin();
  return tv.login();
}

export const biliApi = {
  getArchives,
  checkTag,
  login,
  getUserInfo,
  getMyInfo,
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
    uid: number,
  ): ReturnType<typeof biliApi.getArchives> => {
    return biliApi.getArchives(params, uid);
  },
  "biliApi:checkTag": (
    _event: IpcMainInvokeEvent,
    tag: Parameters<typeof biliApi.checkTag>[0],
    uid: number,
  ): ReturnType<typeof biliApi.checkTag> => {
    return biliApi.checkTag(tag, uid);
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
  "bili:updateUserInfo": async (_event: IpcMainInvokeEvent, uid: number) => {
    const user = await readUser(uid);
    if (!user) throw new Error("用户不存在");
    const userInfo = await getUserInfo(uid);
    user.name = userInfo.data.name;
    user.avatar = userInfo.data.face;
    await writeUser(user);
  },
};

export default {
  client,
};
