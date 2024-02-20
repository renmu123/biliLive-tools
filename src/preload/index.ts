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
  DanmuConfig,
  BiliUser,
  BiliApi,
  hotProgressOptions,
} from "../types";
import type ffmpeg from "fluent-ffmpeg";

type startCallback = (params: { command?: string }) => void;
type endCallback = (params: { output?: string }) => void;
type errorCallback = (params: { err?: string; taskId?: string }) => void;
type progressCallback = (params: { percentage?: number }) => void;

// Custom APIs for renderer
export const api = {
  danmu: {
    savePreset: (preset: DanmuPreset) => {
      return ipcRenderer.invoke("danmu:savePreset", preset);
    },
    deletePreset: (id: string) => {
      return ipcRenderer.invoke("danmu:deletePreset", id);
    },
    getPreset: (id: string): Promise<DanmuPreset> => {
      return ipcRenderer.invoke("danmu:getPreset", id);
    },
    getPresets: (): Promise<DanmuPreset[]> => {
      return ipcRenderer.invoke("danmu:getPresets");
    },
    convertXml2Ass: (
      files: {
        input: string;
        output?: string;
      }[],
      config: DanmuConfig,
      options: DanmuOptions = {
        removeOrigin: false,
      },
    ) => {
      return ipcRenderer.invoke("danmu:convertXml2Ass", files, config, options);
    },
    saveReport(input: string, output: string) {
      return ipcRenderer.invoke("danmu:saveReport", {
        input,
        output,
      });
    },
    // danmu:generateDanmakuImage
    genHotProgress(input: string, output: string, options: hotProgressOptions) {
      return ipcRenderer.invoke("danmu:genHotProgress", input, output, options);
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
    // interrupt: (taskId: string) => {
    //   return ipcRenderer.invoke("task:interrupt", taskId);
    // },
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
    relaunch: () => {
      return ipcRenderer.invoke("common:relaunch");
    },
    showItemInFolder: (path: string) => {
      return ipcRenderer.invoke("common:showItemInFolder", path);
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
    deleteUser: (uid: number) => {
      return ipcRenderer.invoke("bili:deleteUser", uid);
    },
    // 验证视频上传参数
    validUploadParams: (config: BiliupConfig) => {
      return ipcRenderer.invoke("bili:validUploadParams", config);
    },
    // 上传视频
    uploadVideo: (uid: number, videoFiles: string[], options: BiliupConfig) => {
      return ipcRenderer.invoke("bili:uploadVideo", uid, videoFiles, options);
    },
    // 续传视频
    appendVideo: (uid: number, videoFiles: string[], options: BiliupConfigAppend) => {
      return ipcRenderer.invoke("bili:appendVideo", uid, videoFiles, options);
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
    checkOldCookie(): Promise<boolean> {
      return ipcRenderer.invoke("bili:checkOldCookie");
    },
    migrateCookie() {
      return ipcRenderer.invoke("bili:migrateCookie");
    },
    removeUser(mid: number) {
      return ipcRenderer.invoke("bili:removeUser", mid);
    },
    readUserList(): Promise<BiliUser[]> {
      return ipcRenderer.invoke("bili:readUserList");
    },
    updateUserInfo(uid: number) {
      return ipcRenderer.invoke("bili:updateUserInfo", uid);
    },
    getArchives(
      params: Parameters<BiliApi["getArchives"]>[0],
      uid: number,
    ): Promise<ReturnType<BiliApi["getArchives"]>> {
      return ipcRenderer.invoke("biliApi:getArchives", params, uid);
    },
    checkTag(tag: string, uid: number) {
      return ipcRenderer.invoke("biliApi:checkTag", tag, uid);
    },
    getSeasonList(uid: number) {
      return ipcRenderer.invoke("biliApi:getSeasonList", uid);
    },
    getArchiveDetail(bvid: string, uid?: number): Promise<ReturnType<BiliApi["getArchiveDetail"]>> {
      return ipcRenderer.invoke("biliApi:getArchiveDetail", bvid, uid);
    },
    download(options: { bvid: string; cid: number; output: string }, uid: number) {
      return ipcRenderer.invoke("biliApi:download", options, uid);
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
  },
  convertVideo2Mp4: (
    file: File,
    options: Video2Mp4Options = {
      saveRadio: 1,
      saveOriginPath: true,
      savePath: "",

      override: false,
      removeOrigin: false,
    },
  ) => {
    return ipcRenderer.invoke("convertVideo2Mp4", file, options);
  },
  mergeAssMp4: async (
    files: {
      videoFilePath: string;
      assFilePath: string;
      outputPath: string;
      hotProgressFilePath: string | undefined;
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

  onBiliUploadClose: (
    callback: (_event: IpcRendererEvent, code: number, pathArray: string[]) => void,
  ) => {
    ipcRenderer.on("upload-close", callback);
  },
  readVideoMeta: (file: string): Promise<ffmpeg.FfprobeData> => {
    return ipcRenderer.invoke("readVideoMeta", file);
  },
  // 获取app配置
  getAppConfig: (): Promise<AppConfig> => {
    return ipcRenderer.invoke("getAppConfig");
  },

  // 通用函数
  openDirectory: (): Promise<string | undefined> => {
    return ipcRenderer.invoke("dialog:openDirectory");
  },
  openFile: (options: OpenDialogOptions): Promise<string[] | undefined> => {
    return ipcRenderer.invoke("dialog:openFile", options);
  },
  showSaveDialog: (options?: SaveDialogOptions): Promise<string | undefined> => {
    return ipcRenderer.invoke("dialog:save", options);
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
  getAvailableEncoders: () => {
    return ipcRenderer.invoke("getAvailableEncoders");
  },
  trashItem: (path: string) => {
    return ipcRenderer.invoke("trashItem", path);
  },

  openSetting: (callback: (_event: IpcRendererEvent) => void) => {
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
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
