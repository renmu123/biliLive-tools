import request from "./request";
import configApi from "./config";

export const previewWebhookTitle = async (template: string): Promise<string> => {
  const res = await request.post(`/common/formatTitle`, {
    template,
  });
  return res.data;
};

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

export async function parseMeta(files: { videoFilePath?: string; danmaFilePath?: string }) {
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

const common = {
  previewWebhookTitle,
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
  parseMeta,
  getRunningTaskNum,
  fileJoin,
};

export default common;
