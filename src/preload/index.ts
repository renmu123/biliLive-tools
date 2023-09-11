import { contextBridge, ipcRenderer } from "electron";
import type { IpcRendererEvent } from "electron";
import type {
  Progress,
  DanmuConfig,
  DanmuOptions,
  OpenDialogOptions,
  File,
  FfmpegOptions,
} from "../types";
import path from "path";

import { electronAPI } from "@electron-toolkit/preload";

// Custom APIs for renderer
export const api = {
  convertVideo2Mp4: async (
    file: File,
    options: DanmuOptions = {
      saveRadio: 1,
      saveOriginPath: true,
      savePath: "",

      override: false,
      removeOrigin: false,
    },
  ) => {
    return await ipcRenderer.invoke("convertVideo2Mp4", file, options);
  },
  onTaskProgressUpdate: (
    callback: (
      _event: IpcRendererEvent,
      data: {
        taskId: string;
        progress: Progress;
      },
    ) => void,
  ) => {
    ipcRenderer.on("task-progress-update", callback);
  },
  onTaskStart: (
    callback: (
      _event: IpcRendererEvent,
      data: {
        taskId: string;
        command: string;
      },
    ) => void,
  ) => {
    ipcRenderer.once("task-start", callback);
  },
  onTaskEnd: (
    callback: (
      _event: IpcRendererEvent,
      data: {
        taskId: string;
        output: string;
      },
    ) => void,
  ) => {
    ipcRenderer.once("task-end", callback);
  },
  onTaskError: (
    callback: (
      _event: IpcRendererEvent,
      data: {
        taskId: string;
        err: string;
      },
    ) => void,
  ) => {
    ipcRenderer.once("task-error", callback);
  },
  // danmufactory
  saveDanmuConfig: async (newConfig: DanmuConfig) => {
    return await ipcRenderer.invoke("saveDanmuConfig", newConfig);
  },
  getDanmuConfig: async (): Promise<DanmuConfig> => {
    return await ipcRenderer.invoke("getDanmuConfig");
  },
  convertDanmu2Ass: async (
    files: File[],
    options: DanmuOptions = {
      saveRadio: 1,
      saveOriginPath: true,
      savePath: "",

      override: false,
      removeOrigin: false,
    },
  ) => {
    return await ipcRenderer.invoke("convertDanmu2Ass", files, options);
  },
  mergeAssMp4: async (
    videoFile: File,
    assFile: File,
    options: DanmuOptions = {
      saveRadio: 1,
      saveOriginPath: true,
      savePath: "",

      override: false,
      removeOrigin: false,
    },
    ffmpegOptions: FfmpegOptions = {
      encoder: "libx264",
    },
  ) => {
    return await ipcRenderer.invoke("mergeAssMp4", videoFile, assFile, options, ffmpegOptions);
  },

  // 通用函数
  openDirectory: async () => {
    return await ipcRenderer.invoke("dialog:openDirectory");
  },
  openFile: async (options: OpenDialogOptions) => {
    return await ipcRenderer.invoke("dialog:openFile", options);
  },
  formatFile: (filePath: string) => {
    const formatFile = path.parse(filePath);
    return { ...formatFile, path: filePath, filename: formatFile.base };
  },
  appVersion: () => {
    return ipcRenderer.invoke("getVersion");
  },
  openExternal: (url: string) => {
    return ipcRenderer.invoke("openExternal", url);
  },
  openPath: (path: string) => {
    return ipcRenderer.invoke("openPath", path);
  },
  exits: (path: string) => {
    return ipcRenderer.invoke("exits", path);
  },
  join(...paths: string[]) {
    return path.join(...paths);
  },
  getAvailableEncoders: async () => {
    return await ipcRenderer.invoke("getAvailableEncoders");
  },
  trashItem: async (path: string) => {
    return await ipcRenderer.invoke("trashItem", path);
  },
  openSetting: async (callback: (_event: IpcRendererEvent) => void) => {
    ipcRenderer.on("open-setting", callback);
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
