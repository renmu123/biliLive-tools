import { parse } from "node:path";

import { appConfig } from "../config.js";
import { SyncTask, taskQueue } from "./task.js";
import { BaiduPCS } from "../sync/index.js";

const getConfig = () => {
  const config = appConfig.getAll();
  return { binary: config.sync.baiduPCS.execPath, target: config.sync.baiduPCS.targetPath };
};

export const addSyncTask = async ({
  input,
  remotePath,
  execPath,
  retry,
  policy,
}: {
  input: string;
  remotePath?: string;
  execPath?: string;
  retry?: number;
  policy?: "fail" | "newcopy" | "overwrite" | "skip" | "rsync";
}) => {
  const { binary: binaryPath, target: targetPath } = getConfig();
  const instance = new BaiduPCS({
    binary: execPath ?? binaryPath,
    remotePath: remotePath ?? targetPath,
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
  const { binary: binaryPath } = getConfig();
  const instance = new BaiduPCS({
    binary: execPath ?? binaryPath,
    remotePath: "",
  });
  return instance.loginByCookie(cookie);
};

export const isLogin = async ({ execPath }: { execPath?: string }) => {
  const { binary: binaryPath } = getConfig();
  const instance = new BaiduPCS({
    binary: execPath ?? binaryPath,
    remotePath: "",
  });
  return instance.isLoggedIn();
};
