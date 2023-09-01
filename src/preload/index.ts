import { contextBridge, ipcRenderer } from "electron";
import type { IpcRendererEvent } from "electron";
import type { Progress, DanmuConfig, OriginFile } from "../types";

import { electronAPI } from "@electron-toolkit/preload";

// Custom APIs for renderer
export const api = {
  convertFile2Mp4: async (file: OriginFile) => {
    return await ipcRenderer.invoke("convertFile2Mp4", file);
  },
  onTaskProgressUpdate: (callback: (_event: IpcRendererEvent, progress: Progress) => void) => {
    ipcRenderer.on("task-progress-update", callback);
  },
  onTaskStart: (callback: (_event: IpcRendererEvent, commandLine: string) => void) => {
    ipcRenderer.on("task-start", callback);
  },
  onTaskEnd: (callback: (_event: IpcRendererEvent) => void) => {
    ipcRenderer.on("task-end", callback);
  },
  onTaskError: (callback: (_event: IpcRendererEvent, err: string) => void) => {
    ipcRenderer.on("task-error", callback);
  },
  // danmufactory
  saveDanmuConfig: async (newConfig: DanmuConfig) => {
    return await ipcRenderer.invoke("saveDanmuConfig", newConfig);
  },
  getDanmuConfig: async (): Promise<DanmuConfig> => {
    return await ipcRenderer.invoke("getDanmuConfig");
  },
  convertDanmu2Ass: async (files: OriginFile[]) => {
    return await ipcRenderer.invoke("convertDanmu2Ass", files);
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
