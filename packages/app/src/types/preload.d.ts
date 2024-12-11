import path from "path-unified";

import { ElectronAPI } from "@electron-toolkit/preload";
import { api } from "../preload/index";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: typeof api;
    path: typeof path;
    isWeb: boolean;
    __APP_VERSION__: string;
  }
}
