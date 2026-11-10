import { parse } from "node:path";

import { appConfig } from "../config.js";
import { SyncTask, taskQueue } from "./task.js";
import { BaiduPCS, AliyunPan, Alist, LocalCopy, Pan123, Quark } from "../sync/index.js";
import { pan123Login as pan123LoginAPi, getToken as getPan123AccessToken } from "../sync/pan123.js";
import { trashItem } from "../utils/index.js";

import type { SyncType, SyncConfig, AliyunPanDriveType, QuarkAuth } from "@biliLive-tools/types";

const getConfig = (type: SyncType) => {
  const config = appConfig.getAll();
  if (type === "alist") {
    return {
      binary: "",
      apiUrl: config.sync[type as "alist"].apiUrl,
      username: config.sync[type as "alist"].username,
      password: config.sync[type as "alist"].hashPassword,
      limitRate: config.sync[type as "alist"].limitRate,
      retry: config.sync[type as "alist"].retry,
    };
  } else if (["aliyunpan", "baiduPCS"].includes(type)) {
    return {
      binary: config.sync[type].execPath,
    };
  } else if (type === "copy") {
    return {
      binary: "",
    };
  } else if (type === "pan123") {
    return {
      clientId: config.sync[type as "pan123"].clientId,
      clientSecret: config.sync[type as "pan123"].clientSecret,
      limitRate: config.sync[type as "pan123"].limitRate,
    };
  } else if (type === "quark") {
    return { auth: config.sync.quark.auth };
  } else {
    throw new Error("Unsupported type");
  }
};

const createUploadInstance = async (opts: {
  type: SyncType;
  execPath: string;
  remotePath: string;
  aliyunpanDriveType?: AliyunPanDriveType;
  apiUrl?: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  auth?: QuarkAuth;
  onAuthChange?: (auth: QuarkAuth) => void;
  limitRate?: number;
  stringFilters?: SyncConfig["stringFilters"];
  retry?: number;
}) => {
  if (opts.type === "baiduPCS") {
    return new BaiduPCS({
      binary: opts.execPath,
      remotePath: opts.remotePath ?? "",
    });
  } else if (opts.type === "aliyunpan") {
    return new AliyunPan({
      binary: opts.execPath,
      remotePath: opts.remotePath ?? "",
      driveType: opts.aliyunpanDriveType,
    });
  } else if (opts.type === "alist") {
    return new Alist({
      server: opts.apiUrl,
      username: opts.username,
      password: opts.password,
      remotePath: opts.remotePath ?? "",
      limitRate: opts.limitRate ?? 0,
      stringFilters: opts.stringFilters,
      retry: opts.retry,
    });
  } else if (opts.type === "copy") {
    return new LocalCopy({
      targetPath: opts.remotePath ?? "",
    });
  } else if (opts.type === "pan123") {
    const accessToken = await getPan123AccessToken(
      opts.clientId as string,
      opts.clientSecret as string,
    );
    return new Pan123({
      accessToken,
      remotePath: opts.remotePath ?? "",
      limitRate: opts.limitRate ?? 0,
    });
  } else if (opts.type === "quark") {
    if (!opts.auth?.accessToken) throw new Error("请先授权夸克网盘");
    return new Quark({
      auth: opts.auth,
      remotePath: opts.remotePath,
      onAuthChange: opts.onAuthChange,
    });
  } else {
    throw new Error("Unsupported type");
  }
};

export const addSyncTask = async ({
  input,
  remotePath,
  execPath,
  policy,
  type,
  removeOrigin,
  apiUrl,
  username,
  password,
  clientId,
  clientSecret,
  auth,
  aliyunpanDriveType,
  stringFilters,
}: {
  input: string;
  remotePath?: string;
  execPath?: string;
  retry?: number;
  policy?: "fail" | "newcopy" | "overwrite" | "skip" | "rsync";
  type: SyncType;
  removeOrigin?: boolean;
  apiUrl?: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  auth?: QuarkAuth;
  aliyunpanDriveType?: AliyunPanDriveType;
  stringFilters?: SyncConfig["stringFilters"];
}) => {
  const {
    binary: binaryPath,
    apiUrl: iApiUrl,
    username: iUsername,
    password: iPassword,
    clientId: iClientId,
    clientSecret: iClientSecret,
    auth: iAuth,
    limitRate,
    retry,
  } = getConfig(type);
  const instance = await createUploadInstance({
    type,
    execPath: execPath ?? binaryPath,
    remotePath: remotePath ?? "/",
    apiUrl: apiUrl ?? iApiUrl,
    username: username ?? iUsername,
    password: password ?? iPassword,
    clientId: clientId ?? iClientId,
    clientSecret: clientSecret ?? iClientSecret,
    auth: auth ?? iAuth,
    onAuthChange:
      type === "quark" ? (updated) => appConfig.set("sync.quark.auth", updated) : undefined,
    aliyunpanDriveType,
    limitRate: limitRate ?? 0,
    stringFilters,
    retry,
  });

  const task = new SyncTask(
    instance,
    {
      input: input,
      output: "",
      options: {
        retry: retry,
        policy: policy,
      },
      name: `同步任务: ${parse(input).base}`,
    },
    {
      onEnd: () => {
        if (removeOrigin) {
          trashItem(input);
        }
      },
    },
  );
  taskQueue.addTask(task, false);
  return task;
};

export const baiduPCSLogin = async ({
  cookie,
  execPath,
}: {
  cookie: string;
  execPath?: string;
}) => {
  const { binary: binaryPath } = getConfig("baiduPCS");
  const instance = new BaiduPCS({
    binary: execPath ?? binaryPath,
    remotePath: "",
  });
  return instance.baiduPCSLogin(cookie);
};

export const isLogin = async ({
  execPath,
  type,
  apiUrl,
  username,
  password,
  clientId,
  clientSecret,
  auth,
}: {
  execPath?: string;
  type: SyncType;
  apiUrl?: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  auth?: QuarkAuth;
}) => {
  const { binary: binaryPath, auth: configuredAuth } = getConfig(type);
  const instance = await createUploadInstance({
    type,
    execPath: execPath ?? binaryPath,
    remotePath: "",
    apiUrl,
    username,
    password,
    clientId,
    clientSecret,
    auth: auth ?? configuredAuth,
    onAuthChange:
      type === "quark" ? (updated) => appConfig.set("sync.quark.auth", updated) : undefined,
  });
  if (type === "alist") {
    const status = await (instance as Alist).login();
    return status;
  } else {
    return instance.isLoggedIn();
  }
};

export const pan123Login = async ({
  clientId,
  clientSecret,
}: {
  clientId: string;
  clientSecret: string;
}) => {
  return pan123LoginAPi(clientId, clientSecret);
};

let aliyunpanLoginInstance: AliyunPan | null = null;

export const aliyunpanLogin = async ({
  execPath,
  type,
}: {
  execPath?: string;
  type: "getUrl" | "cancel" | "confirm";
}) => {
  const { binary: binaryPath } = getConfig("aliyunpan");
  if (!aliyunpanLoginInstance) {
    aliyunpanLoginInstance = new AliyunPan({
      binary: execPath ?? binaryPath,
      remotePath: "",
    });
  }
  if (type === "getUrl") {
    return aliyunpanLoginInstance.loginByBrowser();
  } else if (type === "cancel") {
    return aliyunpanLoginInstance.cancelLogin();
  } else if (type === "confirm") {
    return aliyunpanLoginInstance.confirmLogin();
  } else {
    throw new Error("Unsupported type");
  }
};
