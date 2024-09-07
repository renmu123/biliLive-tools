import request from "./request";

export const previewWebhookTitle = async (template: string): Promise<string> => {
  const res = await request.post(`/common/foramtTitle`, {
    template,
  });
  return res.data;
};

export const getStreamLogs = async () => {
  const appConfig = await window.api.config.getAll();
  const eventSource = new EventSource(`http://${appConfig.host}:${appConfig.port}/sse/streamLogs`);
  return eventSource;
};
