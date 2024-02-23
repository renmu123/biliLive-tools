import nodemailer from "nodemailer";

import log from "./utils/log";
import { IpcMainInvokeEvent } from "electron";
import { getAppConfig } from "./config";
import type {
  NotificationMailConfig,
  NotificationServerConfig,
  NotificationTgConfig,
} from "../types";

/**
 * 通过Server酱发送通知
 */
export function sendByServer(title: string, desp: string, options: NotificationServerConfig) {
  const url = `https://sctapi.ftqq.com/${options.key}.send`;
  const data = {
    title: title,
    desp: desp,
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
 * 通过邮件发送通知
 */
export async function sendByMail(title: string, desp: string, options: NotificationMailConfig) {
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
  console.log("sendByTg", title, desp, options);
  const url = `https://api.telegram.org/bot${options.key}/sendMessage`;

  const data = {
    chat_id: options.chat_id,
    text: `${desp}`,
  };
  try {
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("sendByTg", res);
  } catch (e) {
    console.log("sendByTg", e);
  }
}

export function send(title: string, desp: string) {
  log.info("send notfiy", title, desp);

  const appConfig = getAppConfig();
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
  "noify:send": async (_event: IpcMainInvokeEvent, title: string, desp: string) => {
    send(title, desp);
  },
};
