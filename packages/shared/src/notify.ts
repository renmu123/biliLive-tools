import nodemailer from "nodemailer";
import { scSend } from "serverchan-sdk";
import { appConfig } from "./config.js";
import log from "./utils/log.js";

import type {
  AppConfig,
  NotificationMailConfig,
  NotificationServerConfig,
  NotificationTgConfig,
  NotificationNtfyConfig,
  NotificationPushAllInAllConfig,
  NotificationCustomHttpConfig,
} from "@biliLive-tools/types";

/**
 * 通知模板上下文支持的值类型
 */
type NotificationContextValue = string | number | boolean | null | undefined;

/**
 * 通知模板上下文
 */
export type NotificationContext = Record<string, NotificationContextValue>;

/**
 * 任务类型
 */
type TaskType =
  | "liveStart"
  | "chargeLive"
  | "ffmpeg"
  | "danmu"
  | "upload"
  | "download"
  | "douyuDownload"
  | "mediaStatusCheck"
  | "diskSpaceCheck"
  | "sync";

/**
 * 通知发送选项
 */
export type NotificationSendOptions = {
  type?: TaskType;
  context?: NotificationContext;
};

const toTemplateValue = (value: NotificationContextValue) => {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value);
};

const toSnakeCase = (key: string) => {
  return key.replace(/([A-Z])/g, "_$1").toLowerCase();
};

const appendTemplateValue = (
  target: Record<string, string>,
  key: string,
  value: NotificationContextValue,
) => {
  const stringValue = toTemplateValue(value);
  target[key] = stringValue;
  const snakeCaseKey = toSnakeCase(key);
  if (!(snakeCaseKey in target)) {
    target[snakeCaseKey] = stringValue;
  }
};

const buildTemplateContext = (title: string, desp: string, context: NotificationContext = {}) => {
  const templateContext: Record<string, string> = {};
  appendTemplateValue(templateContext, "title", title);
  appendTemplateValue(templateContext, "desc", desp);
  appendTemplateValue(templateContext, "desp", desp);
  Object.entries(context).forEach(([key, value]) => {
    appendTemplateValue(templateContext, key, value);
  });
  return templateContext;
};

const renderTemplate = (
  template: string,
  templateContext: Record<string, string>,
  options: { encode?: boolean; jsonStringify?: boolean } = {},
) => {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = templateContext[key] || "";
    if (options.jsonStringify) {
      return JSON.stringify(String(value)).slice(1, -1);
    }
    return options.encode ? encodeURIComponent(value) : value;
  });
};

/**
 * 通过Server酱发送通知
 */
export function sendByServer(title: string, desp: string, options: NotificationServerConfig) {
  if (!options.key) {
    throw new Error("Server酱key不能为空");
  }
  scSend(options.key, title, desp);
}

/**
 * 通过邮件发送通知
 */
export async function sendByMail(title: string, desp: string, options: NotificationMailConfig) {
  if (!options.host || !options.port || !options.user || !options.pass || !options.to) {
    throw new Error("mail host、port、user、pass、to不能为空");
  }
  const transporter = nodemailer.createTransport({
    host: options.host,
    port: Number(options.port),
    secure: options.secure,
    auth: {
      user: options.user,
      pass: options.pass,
    },
  });

  const info = await transporter.sendMail({
    from: `"${options.user}" <${options.user}>`, // sender address
    to: options.to, // list of receivers
    subject: title, // Subject line
    text: desp, // plain text body
    // html: "<b>Hello world?</b>", // html body
  });

  log.info("Message sent: %s", info.messageId);
}

/**
 * 通过tg发送通知
 */
export async function sendByTg(title: string, desp: string, options: NotificationTgConfig) {
  if (!options.key || !options.chat_id) {
    throw new Error("tg key或chat_id不能为空");
  }

  let baseUrl = `https://api.telegram.org`;
  if (options.proxyUrl) {
    baseUrl = options.proxyUrl;
  }
  const url = `${baseUrl}/bot${options.key}/sendMessage`;

  const data = {
    chat_id: options.chat_id,
    text: `${title}-${desp}`,
  };
  try {
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });
    log.info("sendByTg res", res);
  } catch (e) {
    log.error("sendByTg error", e);
    throw e;
  }
}

/**
 * 通过系统通知
 */
export async function sendBySystem(title: string, desp: string) {
  // 非electron环境不触发
  // @ts-ignore
  if (process.type !== "browser") return;
  // @ts-ignore
  const { Notification } = await import("electron");
  const event = new Notification({
    title: title,
    body: desp,
  });
  event.show();
  return event;
}

/**
 * ntfy发送通知
 */
export async function sendByNtfy(title: string, desp: string, options: NotificationNtfyConfig) {
  const url = `${options.url}`;
  const data = {
    topic: options.topic,
    message: desp,
    title: title,
  };
  fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * allInOne发送通知
 */
export async function sendByAllInOne(
  title: string,
  desp: string,
  options: NotificationPushAllInAllConfig,
  context?: NotificationContext,
) {
  const templateContext = buildTemplateContext(title, desp, context);
  const data = {
    title,
    desp,
    message: desp,
    context: templateContext,
  };
  const res = await fetch(options.server, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.key}`,
    },
  });
  log.info("sendByAllInOne res", res);
}

/**
 * 通过自定义HTTP请求发送通知
 */
export async function sendByCustomHttp(
  title: string,
  desp: string,
  options: NotificationCustomHttpConfig,
  context?: NotificationContext,
) {
  if (!options.url) {
    throw new Error("自定义HTTP通知URL不能为空");
  }

  const templateContext = buildTemplateContext(title, desp, context);
  let url = options.url;
  let body = options.body || "";
  let headers: Record<string, string> = {};

  // 处理headers
  if (options.headers) {
    const headerLines = options.headers.split("\n");
    for (const line of headerLines) {
      const [key, ...values] = line.split(":");
      if (key && values.length > 0) {
        headers[key.trim()] = renderTemplate(values.join(":").trim(), templateContext);
      }
    }
  }

  // 替换占位符
  url = renderTemplate(url, templateContext, { encode: true });
  body = renderTemplate(body, templateContext, { jsonStringify: true });

  try {
    const res = await fetch(url, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: options.method === "GET" ? undefined : body,
    });
    log.info("sendByCustomHttp res", res);
  } catch (e) {
    log.error("sendByCustomHttp error", e, url, body, headers);
    throw e;
  }
}

export function send(title: string, desp: string, options?: NotificationSendOptions) {
  const config = appConfig.getAll();
  let notifyType = config?.notification?.setting?.type;

  if (options?.type) {
    if (config?.notification?.taskNotificationType[options.type]) {
      notifyType = config?.notification?.taskNotificationType[options.type];
    }
  }
  log.debug("send notify", { title, desp, notifyType, context: options?.context });
  return _send(title, desp, config, notifyType, options);
}

export async function _send(
  title: string,
  desp: string,
  appConfig: AppConfig,
  notifyType: AppConfig["notification"]["setting"]["type"],
  options?: NotificationSendOptions,
): Promise<any | void> {
  switch (notifyType) {
    case "server":
      await sendByServer(title, desp, appConfig?.notification?.setting?.server);
      break;
    case "mail":
      await sendByMail(title, desp, appConfig?.notification?.setting?.mail);
      break;
    case "tg":
      await sendByTg(title, desp, appConfig?.notification?.setting?.tg);
      break;
    case "system":
      return await sendBySystem(title, desp);
      break;
    case "ntfy":
      await sendByNtfy(title, desp, appConfig?.notification?.setting?.ntfy);
      break;
    case "allInOne":
      await sendByAllInOne(
        title,
        desp,
        appConfig?.notification?.setting?.allInOne,
        options?.context,
      );
      break;
    case "customHttp":
      await sendByCustomHttp(
        title,
        desp,
        appConfig?.notification?.setting?.customHttp,
        options?.context,
      );
      break;
  }
}

export const sendNotify = send;
