import request from "./request";

import type { Task } from "@renderer/types";
import type {
  DanmuPreset,
  FfmpegOptions,
  DanmuConfig,
  hotProgressOptions,
  BiliupPreset,
} from "@biliLive-tools/types";

/**
 * 获取任务列表
 */
const list = async (params: {
  type?: string;
}): Promise<{ list: Task[]; runningTaskNum: number }> => {
  const res = await request.get(`/task`, { params });
  return res.data;
};

/**
 * 获取任务
 */
const get = async (id: string): Promise<Task> => {
  const res = await request.get(`/task/${id}`);
  return res.data;
};

const pause = async (id: string): Promise<string> => {
  const res = await request.post(`/task/${id}/pause`);
  return res.data;
};

const resume = async (id: string): Promise<string> => {
  const res = await request.post(`/task/${id}/resume`);
  return res.data;
};

const cancel = async (id: string): Promise<string> => {
  const res = await request.post(`/task/${id}/kill`);
  return res.data;
};

const interrupt = async (id: string): Promise<string> => {
  const res = await request.post(`/task/${id}/interrupt`);
  return res.data;
};

const remove = async (id: string): Promise<string> => {
  const res = await request.post(`/task/${id}/remove`);
  return res.data;
};
// 批量删除
const removeBatch = async (ids: string[]): Promise<string> => {
  const res = await request.post(`/task/removeBatch`, { ids });
  return res.data;
};

const start = async (id: string): Promise<string> => {
  const res = await request.post(`/task/${id}/start`);
  return res.data;
};

const convertXml2Ass = async (
  input: string,
  output: string,
  preset: DanmuPreset["config"],
  options: {
    saveRadio: 1 | 2;
    savePath?: string;
    removeOrigin?: boolean;
    copyInput?: boolean;
    // 生成在临时文件夹
    temp?: boolean;
  },
): Promise<string> => {
  const res = await request.post(`/task/convertXml2Ass`, {
    input,
    output,
    options,
    preset,
  });
  return res.data;
};

const mergeVideos = async (
  inputVideos: string[],
  output: string,
  options: {
    removeOrigin: boolean;
    saveOriginPath: boolean;
  },
): Promise<string> => {
  const res = await request.post(`/task/mergeVideo`, {
    inputVideos,
    output,
    options,
  });
  return res.data;
};

const transcode = async (
  input: string,
  /** 包含后缀 */
  outputName: string,
  ffmpegOptions: FfmpegOptions,
  options: {
    override?: boolean;
    removeOrigin?: boolean;
    /** 支持绝对路径和相对路径 */
    savePath?: string;
    /** 1: 保存到原始文件夹，2：保存到特定文件夹 */
    saveType: 1 | 2;
  },
) => {
  const res = await request.post(`/task/transcode`, {
    input,
    outputName,
    ffmpegOptions,
    options,
  });
  return res.data;
};

const burn = async (
  files: { videoFilePath: string; subtitleFilePath: string },
  output: string,
  options: {
    danmaOptions: DanmuConfig;
    ffmpegOptions: FfmpegOptions;
    hotProgressOptions: Omit<hotProgressOptions, "videoPath">;
    hasHotProgress: boolean;
    override?: boolean;
    removeOrigin?: boolean;
    /** 支持绝对路径和相对路径 */
    savePath?: string;
    /** 1: 保存到原始文件夹，2：保存到特定文件夹 */
    saveType?: 1 | 2;
    uploadOptions?: {
      upload: boolean;
      config: BiliupPreset["config"];
      filePath: string;
      uid: number;
      aid?: number;
    };
  },
) => {
  const res = await request.post(`/task/burn`, {
    files,
    output,
    options,
  });
  return res.data;
};

const sendToWebhook = async (data: {
  event: "FileOpening" | "FileClosed";
  filePath: string;
  danmuPath?: string;
  roomId: string;
  time: string;
  title: string;
  username: string;
}) => {
  const res = await request.post(`/webhook/custom`, data);
  return res.data;
};

const readVideoMeta = async (input: string) => {
  const res = await request.post(`/task/videoMeta`, { file: input });
  return res.data;
};

const task = {
  list,
  get,
  pause,
  resume,
  cancel,
  interrupt,
  remove,
  start,
  convertXml2Ass,
  mergeVideos,
  transcode,
  burn,
  sendToWebhook,
  removeBatch,
  readVideoMeta,
};

export default task;
