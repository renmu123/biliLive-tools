import { ElectronAPI } from "@electron-toolkit/preload";
import { api } from "./index";
import BiliClient from "biliApi";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: typeof api;
    biliApi: InstanceType<typeof BiliClient>;
  }
}
