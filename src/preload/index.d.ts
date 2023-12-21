import path from "node:path";

import { ElectronAPI } from "@electron-toolkit/preload";
import { api } from "./index";

import type { BiliApi } from "@types/index";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: typeof api;
    biliApi: BiliApi;
    path: typeof path;
  }
}
