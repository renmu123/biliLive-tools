import crypto from "node:crypto";
import axios from "axios";

import { appConfig } from "../config.js";
import log from "./log.js";

export const getExternalWebhookUrl = () => {
  return appConfig.get("externalWebhook")?.trim();
};

export interface ExternalEventPayload<TData = unknown> {
  id: string;
  version: number;
  time: string;
  type: string;
  data: TData;
}

export const sendExternalEventRequest = async (type: string, data: unknown) => {
  const webhookUrl = getExternalWebhookUrl();
  if (!webhookUrl) return;

  const body: ExternalEventPayload = {
    id: crypto.randomUUID(),
    version: 1,
    time: new Date().toISOString(),
    type,
    data,
  };

  try {
    await axios.post(webhookUrl, body, {
      proxy: false,
      timeout: 10000,
    });
  } catch (error) {
    log.error("发送外部事件失败", {
      webhookUrl,
      error,
    });
  }
};
