import path from "node:path";

import { ElectronAPI } from "@electron-toolkit/preload";
import { api } from "./index";

import type { BiliApi } from "@types/index";
import type { IpcRendererEvent } from "electron";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: typeof api;
    biliApi: BiliApi & {
      onLogin: (
        event: "error" | "completed",
        callback: (event: IpcRendererEvent, data: any) => void,
      ) => void;
      loginCancel: () => void;
    };
    path: typeof path;
  }
}
