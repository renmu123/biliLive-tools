import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import child_process from "node:child_process";
import { app, shell } from "electron";
import { trashItem } from "@biliLive-tools/shared/utils/index.js";

import type { IpcMainInvokeEvent } from "electron";

export const getTempPath = () => {
  return path.join(os.tmpdir(), "biliLive-tools");
};

export const commonHandlers = {
  "common:getTempPath": () => {
    return getTempPath();
  },
  "common:execFile": async (_event: IpcMainInvokeEvent, file: string, args: string[]) => {
    return new Promise((resolve, reject) => {
      child_process.execFile(file, args, (error, stdout) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  },
  getVersion: () => {
    return app.getVersion();
  },
  openPath: (_event: IpcMainInvokeEvent, path: string) => {
    shell.openPath(path);
  },
  openExternal: (_event: IpcMainInvokeEvent, url: string) => {
    shell.openExternal(url);
  },
  "common:showItemInFolder": async (_event: IpcMainInvokeEvent, path: string) => {
    shell.showItemInFolder(path);
  },
  exits: (_event: IpcMainInvokeEvent, path: string) => {
    return fs.pathExists(path);
  },
  trashItem: (_event: IpcMainInvokeEvent, path: string) => {
    return trashItem(path);
  },
};
