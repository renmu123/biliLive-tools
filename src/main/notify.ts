import log from "./utils/log";
import { IpcMainInvokeEvent } from "electron";
import { getAppConfig } from "./config";

export function sendByServer(title: string, desp: string, options: { key: string }) {
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

export function sendByMail() {
  //
}

export function send(title: string, desp: string) {
  log.info("send notfiy", title, desp);

  const appConfig = getAppConfig();
  switch (appConfig?.notification?.setting?.type) {
    case "server":
      sendByServer(title, desp, appConfig?.notification?.setting?.server);
      break;
    case "mail":
      sendByMail();
      break;
  }
}

export const sendNotify = send;

export const handlers = {
  "noify:send": async (_event: IpcMainInvokeEvent, title: string, desp: string) => {
    send(title, desp);
  },
};
