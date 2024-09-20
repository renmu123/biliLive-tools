import request from "./request";

export const previewWebhookTitle = async (template: string): Promise<string> => {
  const res = await request.post(`/common/foramtTitle`, {
    template,
  });
  return res.data;
};

export const getStreamLogs = async () => {
  const appConfig = await window.api.config.getAll();
  const eventSource = new EventSource(`http://127.0.0.1:${appConfig.port}/sse/streamLogs`);
  return eventSource;
};

export const version = async (): Promise<string> => {
  const res = await request.get(`/common/version`);
  return res.data;
};

const common = {
  previewWebhookTitle,
  getStreamLogs,
  version,
};

export default common;
