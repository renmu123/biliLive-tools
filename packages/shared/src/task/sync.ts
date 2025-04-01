import { parse } from "node:path";

import { appConfig } from "../config.js";
import { SyncTask, taskQueue } from "./task.js";
import { BaiduPCS, AliyunPan } from "../sync/index.js";

import type { SyncType } from "@biliLive-tools/types";

const getConfig = (type: SyncType) => {
  const config = appConfig.getAll();
  return { binary: config.sync[type].execPath, target: config.sync[type].targetPath };
};

const createUploadInstance = (type: SyncType, execPath: string, remotePath: string) => {
  if (type === "baiduPCS") {
    return new BaiduPCS({
      binary: execPath,
      remotePath: remotePath ?? "",
    });
  } else if (type === "aliyunpan") {
    return new AliyunPan({
      binary: execPath,
      remotePath: remotePath ?? "",
    });
  } else {
    throw new Error("Unsupported type");
  }
};

export const addSyncTask = async ({
  input,
  remotePath,
  execPath,
  retry,
  policy,
  type,
}: {
  input: string;
  remotePath?: string;
  execPath?: string;
  retry?: number;
  policy?: "fail" | "newcopy" | "overwrite" | "skip" | "rsync";
  type: SyncType;
}) => {
  const { binary: binaryPath, target: targetPath } = getConfig(type);
  const instance = createUploadInstance(type, execPath ?? binaryPath, remotePath ?? targetPath);

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
    {},
  );
  taskQueue.addTask(task, true);
  return task;
};

export const loginByCookie = async ({
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
  return instance.loginByCookie(cookie);
};

export const isLogin = async ({ execPath, type }: { execPath?: string; type: SyncType }) => {
  const { binary: binaryPath } = getConfig(type);
  const instance = createUploadInstance(type, execPath ?? binaryPath, "");
  return instance.isLoggedIn();
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
