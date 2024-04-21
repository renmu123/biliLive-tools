import nodemailer from "nodemailer";

import { appConfig } from "@biliLive-tools/shared";

import log from "./utils/log";
import { IpcMainInvokeEvent, net } from "electron";
import type {
  AppConfig,
  NotificationMailConfig,
  NotificationServerConfig,
  NotificationTgConfig,
} from "@biliLive-tools/types";

/**
 * 通过Server酱发送通知
 */
export function sendByServer(title: string, desp: string, options: NotificationServerConfig) {
  if (!options.key) {
    throw new Error("Server酱key不能为空");
  }
  const url = `https://sctapi.ftqq.com/${options.key}.send`;
  const data = {
    title: title,
    desp: desp,
  };
  net.fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * 通过邮件发送通知
 */
export async function sendByMail(title: string, desp: string, options: NotificationMailConfig) {
  if (!options.host || !options.port || !options.user || !options.pass || !options.to) {
    throw new Error("mail host、port、user、pass、to不能为空");
  }
  console.log("sendByMail", title, desp, options);
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
  console.log("sendByTg", title, desp, options);
  const url = `https://api.telegram.org/bot${options.key}/sendMessage`;

  const data = {
    chat_id: options.chat_id,
    text: `${desp}`,
  };
  try {
    const res = await net.fetch(url, {
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

export function send(title: string, desp: string) {
  log.info("send notfiy", title, desp);

  const config = appConfig.getAll();
  _send(title, desp, config);
}

export function _send(title: string, desp: string, appConfig: AppConfig) {
  switch (appConfig?.notification?.setting?.type) {
    case "server":
      sendByServer(title, desp, appConfig?.notification?.setting?.server);
      break;
    case "mail":
      sendByMail(title, desp, appConfig?.notification?.setting?.mail);
      break;
    case "tg":
      sendByTg(title, desp, appConfig?.notification?.setting?.tg);
      break;
  }
}

export const sendNotify = send;

export const handlers = {
  "notify:send": async (_event: IpcMainInvokeEvent, title: string, desp: string) => {
    send(title, desp);
  },
  "notify:sendTest": async (
    _event: IpcMainInvokeEvent,
    title: string,
    desp: string,
    options: AppConfig,
  ) => {
    _send(title, desp, options);
  },
};
