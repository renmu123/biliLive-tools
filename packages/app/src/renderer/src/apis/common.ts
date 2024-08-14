import request from "./request";

export const previewWebhookTitle = async (template: string): Promise<string> => {
  return request.post(`/common/foramtTitle`, {
    template,
  });
};
