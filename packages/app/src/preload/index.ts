import path from "node:path";
import fs from "fs-extra";

import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import { webUtils } from "electron";

import type { IpcRendererEvent, SaveDialogOptions } from "electron";
import type {
  Progress,
  DanmuOptions,
  File,
  FfmpegOptions,
  AppConfig,
  BiliupConfig,
  BiliupConfigAppend,
  VideoMergeOptions,
  DanmuConfig,
  hotProgressOptions,
  Theme,
  SC,
  DanmuItem,
} from "@biliLive-tools/types";
import type { OpenDialogOptions } from "../types";
import type ffmpeg from "fluent-ffmpeg";

type startCallback = (params: { command?: string }) => void;
type endCallback = (params: { output?: string }) => void;
type errorCallback = (params: { err?: string; taskId?: string }) => void;
type progressCallback = (params: { percentage?: number }) => void;

// Custom APIs for renderer
export const api = {
  dbQuery: (options) => {
    return ipcRenderer.invoke("db:query", options);
  },
  dbList: (options) => {
    return ipcRenderer.invoke("db:list", options);
  },
  addWithStreamer: (options) => {
    return ipcRenderer.invoke("db:addWithStreamer", options);
  },
  danmu: {
    convertXml2Ass: (
      file: {
        input: string;
        output?: string;
      },
      config: DanmuConfig,
      options: DanmuOptions = {
        removeOrigin: false,
        copyInput: false,
      },
    ) => {
      return ipcRenderer.invoke("danmu:convertXml2Ass", file, config, options);
    },
    isEmptyDanmu(input: string) {
      return ipcRenderer.invoke("danmu:isEmptyDanmu", input);
    },
    saveReport(input: string, output: string) {
      return ipcRenderer.invoke("danmu:saveReport", {
        input,
        output,
      });
    },
    // danmu:generateDanmakuImage
    genHotProgress(input: string, options: hotProgressOptions) {
      return ipcRenderer.invoke("danmu:genHotProgress", input, options);
    },
    generateDanmakuData(
      input: string,
      options: {
        interval?: number;
        duration: number;
        color?: string;
      },
    ) {
      return ipcRenderer.invoke("danmu:generateDanmakuData", input, options);
    },
    getSCDanmu(input: string): Promise<SC[]> {
      return ipcRenderer.invoke("danmu:getSCDanmu", input);
    },
    parseDanmu(
      input: string,
      options: {
        parseHotProgress?: boolean;
        interval?: number;
        duration?: number;
        color?: string;
      } = {},
    ): Promise<{
      danmu: DanmuItem[];
      sc: DanmuItem[];
      hotProgress: {
        time: number;
        value: number;
        color: string;
      }[];
    }> {
      return ipcRenderer.invoke("danmu:parseDanmu", input, options);
    },
  },
  task: {
    on(
      taskId: string,
      event: "start" | "end" | "error" | "progress",
      callback: startCallback | endCallback | errorCallback | progressCallback,
    ) {
      if (event === "start") {
        ipcRenderer.on(
          `task-start`,
          (
            _event,
            data: {
              taskId: string;
              command: string;
            },
          ) => {
            console.log("render:start", data);
            if (data.taskId === taskId) {
              callback({ command: data.command });
            }
          },
        );
      } else if (event === "end") {
        ipcRenderer.on(
          `task-end`,
          (
            _event,
            data: {
              taskId: string;
              output: string;
            },
          ) => {
            if (data.taskId === taskId) {
              callback({
                output: data.output,
                taskId: data.taskId,
              });
            }
          },
        );
      } else if (event === "error") {
        ipcRenderer.on(
          `task-error`,
          (
            _event,
            data: {
              taskId: string;
              err: string;
            },
          ) => {
            if (data.taskId === taskId) {
              callback({
                err: data.err,
              });
            }
          },
        );
      } else if (event === "progress") {
        ipcRenderer.on(
          `task-progress`,
          (
            _event,
            data: {
              taskId: string;
              progress: Progress;
            },
          ) => {
            if (data.taskId === taskId) {
              callback({
                // percentage: data.progress,
              });
            }
          },
        );
      }
    },
    notifyTest: (title: string, desp: string, config: AppConfig) => {
      return ipcRenderer.invoke("notify:sendTest", title, desp, config);
    },
  },
  common: {
    getTempPath: async () => {
      return ipcRenderer.invoke("common:getTempPath");
    },
    deleteFile: (path: string) => {
      return fs.unlink(path);
    },
    readFile: (path: string) => {
      return fs.readFile(path, "utf-8");
    },
    writeFile: (path: string, data: string) => {
      return fs.writeFile(path, data);
    },
    relaunch: () => {
      return ipcRenderer.invoke("common:relaunch");
    },
    showItemInFolder: (path: string) => {
      return ipcRenderer.invoke("common:showItemInFolder", path);
    },
    setOpenAtLogin: (openAtLogin: boolean) => {
      return ipcRenderer.invoke("common:setOpenAtLogin", openAtLogin);
    },
    setTheme: (theme: Theme) => {
      return ipcRenderer.invoke("common:setTheme", theme);
    },
    getPathForFile: (file: globalThis.File) => {
      return webUtils.getPathForFile(file);
    },
    mkdir: (path: string) => {
      return fs.mkdir(path);
    },
    execFile: (file: string, args: string[]) => {
      return ipcRenderer.invoke("common:execFile", file, args);
    },
  },
  bili: {
    // 上传视频
    uploadVideo: (
      uid: number,
      videoFiles:
        | string[]
        | {
            path: string;
            title?: string;
          }[],
      options: BiliupConfig,
    ) => {
      return ipcRenderer.invoke("bili:uploadVideo", uid, videoFiles, options);
    },
    // 续传视频
    appendVideo: (
      uid: number,
      videoFiles:
        | string[]
        | {
            path: string;
            title?: string;
          }[],
      options: BiliupConfigAppend,
    ) => {
      return ipcRenderer.invoke("bili:appendVideo", uid, videoFiles, options);
    },
  },
  config: {
    save: (newConfig: AppConfig) => {
      return ipcRenderer.invoke("config:save", newConfig);
    },
    get: (key: string) => {
      return ipcRenderer.invoke("config:get", key);
    },
    getAll: (): Promise<AppConfig> => {
      return ipcRenderer.invoke("config:getAll");
    },
    set: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => {
      return ipcRenderer.invoke("config:set", key, value);
    },
    export: (filePath: string) => {
      return ipcRenderer.invoke("config:export", filePath);
    },
    import: (filePath: string) => {
      return ipcRenderer.invoke("config:import", filePath);
    },
  },
  mergeAssMp4: async (
    files: {
      videoFilePath: string;
      assFilePath?: string | null;
      outputPath: string;
      hotProgressFilePath: string | undefined;
    },
    options: {
      removeOrigin: boolean;
      override: boolean;
      startTimestamp?: number;
    } = {
      removeOrigin: false,
      override: true,
      startTimestamp: 0,
    },
    ffmpegOptions: FfmpegOptions = {
      encoder: "libx264",
    },
  ) => {
    return await ipcRenderer.invoke("mergeAssMp4", files, options, ffmpegOptions);
  },
  mergeVideos: async (videoFiles: File[], options: VideoMergeOptions) => {
    return await ipcRenderer.invoke("mergeVideos", videoFiles, options);
  },

  readVideoMeta: (file: string): Promise<ffmpeg.FfprobeData> => {
    return ipcRenderer.invoke("readVideoMeta", file);
  },

  // 通用函数
  openDirectory: (
    opts: {
      defaultPath?: string;
      buttonLabel?: string;
      title?: string;
    } = {},
  ): Promise<string | undefined> => {
    return ipcRenderer.invoke("dialog:openDirectory", opts);
  },
  openFile: (options: OpenDialogOptions): Promise<string[] | undefined> => {
    return ipcRenderer.invoke("dialog:openFile", options);
  },
  showSaveDialog: (options?: SaveDialogOptions): Promise<string | undefined> => {
    return ipcRenderer.invoke("dialog:save", options);
  },
  // appVersion: () => {
  //   return ipcRenderer.invoke("getVersion");
  // },
  openExternal: (url: string) => {
    return ipcRenderer.invoke("openExternal", url);
  },
  openPath: (path: string) => {
    return ipcRenderer.invoke("openPath", path);
  },
  exits: (path: string) => {
    return ipcRenderer.invoke("exits", path);
  },
  trashItem: (path: string) => {
    return ipcRenderer.invoke("trashItem", path);
  },

  openSetting: (callback: (_event: IpcRendererEvent) => void) => {
    ipcRenderer.on("open-setting", callback);
  },
  openLog: (callback: (_event: IpcRendererEvent) => void) => {
    ipcRenderer.on("open-log", callback);
  },
  openChangelog: (callback: (_event: IpcRendererEvent) => void) => {
    ipcRenderer.on("open-changelog", callback);
  },
  onMainNotify: (
    callback: (
      _event: IpcRendererEvent,
      data: {
        type: "info" | "success" | "warning" | "error";
        content: string;
      },
    ) => void,
  ) => {
    ipcRenderer.on("notify", callback);
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
    contextBridge.exposeInMainWorld("path", path);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = electronAPI;
  window.api = api;
}
