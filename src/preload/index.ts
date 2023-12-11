import path from "path";
import os from "os";
import fs from "fs-extra";

import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

import type { IpcRendererEvent, SaveDialogOptions } from "electron";
import type {
  Progress,
  DanmuOptions,
  OpenDialogOptions,
  File,
  FfmpegOptions,
  AppConfig,
  BiliupPreset,
  BiliupConfig,
  BiliupConfigAppend,
  VideoMergeOptions,
  DanmuPreset,
  Video2Mp4Options,
  FfmpegPreset,
} from "../types";
import ffmpeg from "fluent-ffmpeg";

type startCallback = (params: { command?: string }) => void;
type endCallback = (params: { output?: string }) => void;
type errorCallback = (params: { err?: string; taskId?: string }) => void;
type progressCallback = (params: { percentage?: number }) => void;

// Custom APIs for renderer
export const api = {
  danmu: {
    savePreset: async (preset: DanmuPreset) => {
      return await ipcRenderer.invoke("saveDanmuPreset", preset);
    },
    deletePreset: async (id: string) => {
      return await ipcRenderer.invoke("deleteDanmuPreset", id);
    },
    getPreset: async (id: string): Promise<DanmuPreset> => {
      return await ipcRenderer.invoke("readDanmuPreset", id);
    },
    getPresets: async (): Promise<DanmuPreset[]> => {
      return await ipcRenderer.invoke("readDanmuPresets");
    },
    convertDanmu2Ass: async (
      files: {
        input: string;
        output?: string;
      }[],
      presetId: string,
      options: DanmuOptions = {
        removeOrigin: false,
      },
    ) => {
      return await ipcRenderer.invoke("convertDanmu2Ass", files, presetId, options);
    },
  },
  task: {
    pause: (taskId: string) => {
      return ipcRenderer.invoke("task:pause", taskId);
    },
    resume: (taskId: string) => {
      return ipcRenderer.invoke("task:resume", taskId);
    },
    kill: (taskId: string) => {
      return ipcRenderer.invoke("task:kill", taskId);
    },
    interrupt: (taskId: string) => {
      return ipcRenderer.invoke("task:interrupt", taskId);
    },
    list: () => {
      return ipcRenderer.invoke("task:list");
    },
    remove: (taskId: string) => {
      return ipcRenderer.invoke("task:remove", taskId);
    },
    start: (command: string) => {
      return ipcRenderer.invoke("task:start", command);
    },
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
  },
  common: {
    getTempPath: () => {
      return os.tmpdir();
    },
    deleteFile: (path: string) => {
      return fs.unlink(path);
    },
  },
  bili: {
    // 预设
    savePreset: (preset: BiliupPreset) => {
      return ipcRenderer.invoke("bili:savePreset", preset);
    },
    deletePreset: (id: string) => {
      return ipcRenderer.invoke("bili:deletePreset", id);
    },
    getPreset: (id: string): Promise<BiliupPreset> => {
      return ipcRenderer.invoke("bili:getPreset", id);
    },
    getPresets: (): Promise<BiliupPreset[]> => {
      return ipcRenderer.invoke("bili:getPresets");
    },
    // cookie
    saveCookie: () => {
      return ipcRenderer.invoke("bili:saveCookie");
    },
    checkCookie: (): Promise<boolean> => {
      return ipcRenderer.invoke("bili:checkCookie");
    },
    deleteCookie: () => {
      return ipcRenderer.invoke("bili:deleteCookie");
    },
    // 调用biliup的登录窗口
    login: async () => {
      return await ipcRenderer.invoke("bili:login");
    },
    // 监测biliup登录窗口的关闭
    onLogin(event: "close", callback: (_event: IpcRendererEvent, code: number) => void) {
      if (event === "close") {
        ipcRenderer.once("event:login-win-close", callback);
      }
    },
    // 读取bili登录的二维码
    readQrCode: () => {
      return ipcRenderer.invoke("bili:readQrCode");
    },
    // 验证视频上传参数
    validUploadParams: async (config: BiliupConfig) => {
      return await ipcRenderer.invoke("bili:validUploadParams", config);
    },
    uploadVideo: async (videoFiles: string[], options: BiliupConfig) => {
      return await ipcRenderer.invoke("bili:uploadVideo", videoFiles, options);
    },
    appendVideo: async (videoFiles: string[], options: BiliupConfigAppend) => {
      return await ipcRenderer.invoke("bili:appendVideo", videoFiles, options);
    },
  },
  ffmpeg: {
    // 预设
    savePreset: (preset: FfmpegPreset) => {
      return ipcRenderer.invoke("ffmpeg:presets:save", preset);
    },
    deletePreset: (id: string) => {
      return ipcRenderer.invoke("ffmpeg:presets:delete", id);
    },
    getPreset: (id: string): Promise<FfmpegPreset> => {
      return ipcRenderer.invoke("ffmpeg:presets:get", id);
    },
    getPresets: (): Promise<FfmpegPreset[]> => {
      return ipcRenderer.invoke("ffmpeg:presets:list");
    },
    getPresetOptions: (): Promise<
      {
        value: string;
        label: string;
        children: {
          value: string;
          label: string;
        }[];
      }[]
    > => {
      return ipcRenderer.invoke("ffmpeg:presets:getOptions");
    },
  },
  convertVideo2Mp4: async (
    file: File,
    options: Video2Mp4Options = {
      saveRadio: 1,
      saveOriginPath: true,
      savePath: "",

      override: false,
      removeOrigin: false,
    },
  ) => {
    return await ipcRenderer.invoke("convertVideo2Mp4", file, options);
  },
  mergeAssMp4: async (
    files: {
      videoFilePath: string;
      assFilePath: string;
      outputPath: string;
    },
    options: {
      removeOrigin: boolean;
    } = {
      removeOrigin: false,
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

  onBiliUploadClose: (callback: (_event: IpcRendererEvent, code: number) => void) => {
    ipcRenderer.once("upload-close", callback);
  },
  onBiliAppendClose: (callback: (_event: IpcRendererEvent, code: number) => void) => {
    ipcRenderer.once("append-close", callback);
  },
  readVideoMeta: async (file: string): Promise<ffmpeg.FfprobeData> => {
    return await ipcRenderer.invoke("readVideoMeta", file);
  },
  // app 配置相关
  // 保存app配置
  saveAppConfig: async (newConfig: AppConfig) => {
    return await ipcRenderer.invoke("saveAppConfig", newConfig);
  },
  // 获取app配置
  getAppConfig: async (): Promise<AppConfig> => {
    return await ipcRenderer.invoke("getAppConfig");
  },

  // 通用函数
  openDirectory: async () => {
    return await ipcRenderer.invoke("dialog:openDirectory");
  },
  openFile: async (options: OpenDialogOptions): Promise<string[] | undefined> => {
    return await ipcRenderer.invoke("dialog:openFile", options);
  },
  showSaveDialog: async (options?: SaveDialogOptions): Promise<string | undefined> => {
    return await ipcRenderer.invoke("dialog:save", options);
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
  getAvailableEncoders: async () => {
    return await ipcRenderer.invoke("getAvailableEncoders");
  },
  trashItem: async (path: string) => {
    return await ipcRenderer.invoke("trashItem", path);
  },
  openSetting: async (callback: (_event: IpcRendererEvent) => void) => {
    ipcRenderer.on("open-setting", callback);
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

export const biliApi = {
  getArchives(params: Parameters<(typeof biliApi)["getArchives"]>[0]) {
    return ipcRenderer.invoke("biliApi:getArchives", params);
  },
  checkTag(tag: string) {
    return ipcRenderer.invoke("biliApi:checkTag", tag);
  },
  getMyInfo() {
    return ipcRenderer.invoke("biliApi:getMyInfo");
  },
  loadCookie() {
    return ipcRenderer.invoke("biliApi:updateCookie");
  },
  login() {
    return ipcRenderer.invoke("biliApi:login");
  },
  onLogin(event: "error" | "completed", callback: (event: IpcRendererEvent, data: any) => void) {
    if (event === "error") {
      ipcRenderer.once("biliApi:login-error", callback);
    } else if (event === "completed") {
      ipcRenderer.once("biliApi:login-completed", callback);
    }
  },
  loginCancel() {
    ipcRenderer.removeAllListeners("biliApi:login-error");
    ipcRenderer.removeAllListeners("biliApi:login-completed");
    return ipcRenderer.invoke("biliApi:login:cancel");
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
    contextBridge.exposeInMainWorld("biliApi", biliApi);
    contextBridge.exposeInMainWorld("path", path);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
