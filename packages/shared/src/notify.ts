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
} from "@biliLive-tools/types";

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
  const url = `https://api.telegram.org/bot${options.key}/sendMessage`;

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
  }
}

/**
 * 通过系统通知
 */
export async function sendBySystem(title: string, desp: string) {
  // 非electron环境不触发
  if (process.type !== "browser") return;
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
) {
  const data = {
    message: desp,
    title: title,
  };
  fetch(options.server, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.key}`,
    },
  });
}

type TaskType =
  | "liveStart"
  | "ffmpeg"
  | "danmu"
  | "upload"
  | "download"
  | "douyuDownload"
  | "mediaStatusCheck"
  | "diskSpaceCheck";

export function send(title: string, desp: string, options?: { type?: TaskType }) {
  const config = appConfig.getAll();
  let notifyType = config?.notification?.setting?.type;

  if (options?.type) {
    if (config?.notification?.taskNotificationType[options.type]) {
      notifyType = config?.notification?.taskNotificationType[options.type];
    }
  }
  return _send(title, desp, config, notifyType);
}

export async function _send(
  title: string,
  desp: string,
  appConfig: AppConfig,
  notifyType: AppConfig["notification"]["setting"]["type"],
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
      await sendByAllInOne(title, desp, appConfig?.notification?.setting?.allInOne);
      break;
  }
}

export const sendNotify = send;
