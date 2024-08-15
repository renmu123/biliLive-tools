import request from "./request";

export const previewWebhookTitle = async (template: string): Promise<string> => {
  return request.post(`/common/foramtTitle`, {
    template,
  });
};

export const getStreamLogs = async () => {
  const appConfig = await window.api.config.getAll();
  const eventSource = new EventSource(
    `http://${appConfig.host}:${appConfig.port}/common/streamLogs`,
  );
  return eventSource;
};
