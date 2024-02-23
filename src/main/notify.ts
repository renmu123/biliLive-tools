import nodemailer from "nodemailer";

import log from "./utils/log";
import { IpcMainInvokeEvent } from "electron";
import { getAppConfig } from "./config";
import type { NotificationMailConfig, NotificationServerConfig } from "../types";

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
  }
}

export const sendNotify = send;

export const handlers = {
  "noify:send": async (_event: IpcMainInvokeEvent, title: string, desp: string) => {
    send(title, desp);
  },
};
