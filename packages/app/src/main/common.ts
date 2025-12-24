import fs from "fs-extra";
import child_process from "node:child_process";
import { app, shell } from "electron";

import type { IpcMainInvokeEvent } from "electron";

export const commonHandlers = {
  "common:execFile": async (_event: IpcMainInvokeEvent, file: string, args: string[]) => {
    return new Promise((resolve, reject) => {
      child_process.execFile(file, args, { windowsHide: true }, (error, stdout) => {
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
};
