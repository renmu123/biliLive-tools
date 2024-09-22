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

const common = {
  previewWebhookTitle,
  getStreamLogs,
  version,
  versionTest,
};

export default common;
