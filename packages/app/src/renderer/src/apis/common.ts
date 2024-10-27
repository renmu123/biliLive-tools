import request from "./request";
import configApi from "./config";

export const previewWebhookTitle = async (template: string): Promise<string> => {
  const res = await request.post(`/common/foramtTitle`, {
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

export async function getVideoStreams(params: {
  decodeData: string;
}): Promise<{ label: string; value: string }[]> {
  const res = await request.get(`/common/download/streams`, {
    params,
  });
  return res.data;
}

export async function douyuVideoParse(url: string) {
  const res = await request.post(`/common/douyu/parse`, {
    url,
  });
  return res.data;
}

export async function douyuVideoDownload(
  output: string,
  decodeData: string,
  options: {
    danmu: "none" | "xml" | "ass";
    resoltion: "highest" | string;
    vid?: string;
    user_name?: string;
    room_id?: string;
    room_title?: string;
    live_start_time?: string;
    platform?: "douyu";
  },
) {
  const res = await request.post(`/common/douyu/download`, {
    output,
    decodeData,
    options,
  });
  return res.data;
}

const common = {
  previewWebhookTitle,
  getStreamLogs,
  version,
  versionTest,
  getFiles,
  douyuVideoParse,
  douyuVideoDownload,
  getVideoStreams,
};

export default common;
