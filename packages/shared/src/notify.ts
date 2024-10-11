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
  const { Notification } = await import("electron");
  new Notification({
    title: title,
    body: desp,
  }).show();
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

export function send(title: string, desp: string) {
  // log.info("send notfiy", title, desp);

  const config = appConfig.getAll();
  _send(title, desp, config);
}

export async function _send(title: string, desp: string, appConfig: AppConfig) {
  switch (appConfig?.notification?.setting?.type) {
    case "server":
      sendByServer(title, desp, appConfig?.notification?.setting?.server);
      break;
    case "mail":
      await sendByMail(title, desp, appConfig?.notification?.setting?.mail);
      break;
    case "tg":
      await sendByTg(title, desp, appConfig?.notification?.setting?.tg);
      break;
    case "system":
      await sendBySystem(title, desp);
      break;
    case "ntfy":
      await sendByNtfy(title, desp, appConfig?.notification?.setting?.ntfy);
  }
}

export const sendNotify = send;
