import request from "./request";
import configApi from "./config";

export const previewWebhookTitle = async (template: string): Promise<string> => {
  const res = await request.post(`/common/foramtTitle`, {
    template,
  });
  return res.data;
};

export const getStreamLogs = async () => {
  const appConfig = await configApi.get();
  const eventSource = new EventSource(`http://127.0.0.1:${appConfig.port}/sse/streamLogs`);
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
  ext?: string;
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
    params,
  });
  return res.data;
};

export async function douyuVideoParse(url: string) {
  const res = await request.post(`/douyu/parse`, {
    url,
  });
  return res.data;
}

export async function douyuVideoDownload(
  output: string,
  decodeData: string,
  options: {
    danmu: boolean;
    vid?: string;
    user_name?: string;
    room_id?: string;
    room_title?: string;
    live_start_time?: string;
    platform?: "douyu";
  },
) {
  const res = await request.post(`/douyu/download`, {
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
};

export default common;
