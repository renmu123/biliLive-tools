import request from "./request";
import configApi from "./config";

import type { DanmuItem } from "@biliLive-tools/types";

export const getStreamLogs = async () => {
  let key = window.localStorage.getItem("key");
  if (!window.isWeb) {
    const appConfig = await configApi.get();
    key = appConfig.passKey;
  }

  const eventSource = new EventSource(`${request.defaults.baseURL}/sse/streamLogs?auth=${key}`);
  return eventSource;
};

export const exportLogs = async (): Promise<Buffer> => {
  const res = await request.get(`/common/exportLogs`, {
    responseType: "blob",
  });
  return res.data;
};

export const getLogContent = async (): Promise<string> => {
  const res = await request.get(`/common/getLogContent`);
  return res.data;
};

export const getDanmaStream = async (recorderId: string) => {
  let key = window.localStorage.getItem("key");
  if (!window.isWeb) {
    const appConfig = await configApi.get();
    key = appConfig.passKey;
  }

  const eventSource = new EventSource(
    `${request.defaults.baseURL}/sse/recorder/danma?auth=${key}&id=${recorderId}`,
  );
  return eventSource;
};

export const getRunningTaskNum = async () => {
  let key = window.localStorage.getItem("key");
  if (!window.isWeb) {
    const appConfig = await configApi.get();
    key = appConfig.passKey;
  }

  const eventSource = new EventSource(
    `${request.defaults.baseURL}/sse/task/runningNum?auth=${key}`,
  );
  return eventSource;
};

export const version = async (): Promise<string> => {
  const res = await request.get(`/common/version`);
  return res.data;
};

export const versionTest = async (api: string, Authorization: string): Promise<string> => {
  const res = await request.get(`${api}/common/version`, {
    headers: {
      Authorization: Authorization,
    },
  });
  return res.data;
};

export const getFiles = async (params: {
  path: string;
  exts?: string[];
  type?: "file" | "directory";
}): Promise<{
  list: {
    type: "file" | "directory";
    name: string;
    path: string;
  }[];
  parent: string;
}> => {
  const res = await request.get(`/common/files`, {
    params: {
      ...params,
      exts: (params?.exts || []).join("|"),
    },
  });
  return res.data;
};

const fileJoin = async (dir: string, name: string): Promise<string> => {
  const res = await request.post(`/common/fileJoin`, {
    dir,
    name,
  });
  return res.data;
};

export async function readXmlTimestamp(filepath: string): Promise<number> {
  const res = await request.post(`/common/danma/timestamp`, {
    filepath,
  });
  return res.data;
}

export async function parseMeta(files: {
  videoFilePath?: string;
  danmaFilePath?: string;
}): Promise<{
  startTimestamp: number | null;
  endTimestamp: number | null;
  roomId: string | null;
  title: string | null;
  username: string | null;
  duration: number;
}> {
  const res = await request.post("/common/parseMeta", files);
  return res.data;
}

export async function getFontList(): Promise<
  {
    postscriptName: string;
    fullName: string;
  }[]
> {
  const res = await request.get(`/common/fonts`);
  return res.data;
}

export async function uploadCover(file: File): Promise<{
  name: string;
  path: string;
}> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await request.post("/common/cover/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export async function appStartTime(): Promise<number> {
  const res = await request.get(`/common/appStartTime`);
  return res.data;
}

export async function readDanma(filepath: string): Promise<string> {
  const res = await request.post("/common/readDanma", {
    filepath,
  });
  return res.data;
}

export async function readLLCProject(filepath: string): Promise<string> {
  const res = await request.post("/common/readLLC", {
    filepath,
  });
  return res.data;
}

export async function writeLLCProject(filepath: string, content: string): Promise<void> {
  await request.post("/common/writeLLC", {
    filepath,
    content,
  });
}

export async function genTimeData(filepath: string): Promise<number[]> {
  const res = await request.post("/common/genTimeData", {
    filepath,
  });
  return res.data;
}

export const applyVideoId = async (
  videoPath: string,
): Promise<{
  videoId: string;
  expireAt: number;
  type: string;
}> => {
  const res = await request.post(`/common/apply-video-id`, {
    videoPath,
  });
  return res.data;
};

export const getVideo = async (videoId: string): Promise<string> => {
  return `${request.defaults.baseURL}/common/video/${videoId}`;
};

export const parseDanmu = async (
  filepath: string,
): Promise<{
  danmu: DanmuItem[];
  sc: DanmuItem[];
  metadata: {
    video_start_time?: number;
  };
}> => {
  const res = await request.post("/common/parseDanmu", {
    filepath,
  });
  return res.data;
};

/**
 * 测试webhook是否存在不正常数据，如果有则返回相关id以及文件
 */
export const testWebhook = async (): Promise<{ id: string; file: string }[]> => {
  const res = await request.post("/common/testWebhook");
  return res.data;
};

/**
 * 处理webhook不正常数据
 */
export const handleWebhook = async (data: { id: string }[]) => {
  const res = await request.post("/common/handleWebhook", { data });
  return res.data;
};

/**
 * 为什么上传失败
 * @param roomId 房间号
 * @returns
 */
export const whyUploadFailed = async (roomId: string) => {
  const res = await request.get("/common/whyUploadFailed", {
    params: {
      roomId,
    },
  });
  return res.data;
};

/**
 * 检查更新
 *
 */
export const checkUpdate = async (): Promise<{
  message: string;
  error: boolean;
  needUpdate: boolean;
  downloadUrl: string;
  backupUrl: string;
}> => {
  const res = await request.get("/common/checkUpdate");
  return res.data;
};

/**
 * 获取缓存文件夹路径
 */
export const getTempPath = async (): Promise<string> => {
  const res = await request.get("/common/tempPath");
  return res.data;
};

/**
 * 文件是否存在
 */
export const fileExists = async (filepath: string): Promise<boolean> => {
  const res = await request.post("/common/fileExists", {
    filepath,
  });
  return res.data;
};

const common = {
  getStreamLogs,
  version,
  versionTest,
  getFiles,
  readXmlTimestamp,
  getFontList,
  uploadCover,
  appStartTime,
  getDanmaStream,
  exportLogs,
  getLogContent,
  parseMeta,
  getRunningTaskNum,
  fileJoin,
  readDanma,
  genTimeData,
  getVideo,
  applyVideoId,
  parseDanmu,
  testWebhook,
  handleWebhook,
  whyUploadFailed,
  checkUpdate,
  getTempPath,
  readLLCProject,
  writeLLCProject,
  fileExists,
};

export default common;
