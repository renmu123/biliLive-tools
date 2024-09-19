import path from "node:path";

import { ElectronAPI } from "@electron-toolkit/preload";
import { api } from "../preload/index";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: typeof api;
    path: typeof path;
    isWeb: boolean;
  }
}
