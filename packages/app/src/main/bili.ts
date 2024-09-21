import { TvQrcodeLogin } from "@renmu/bili-api";
import { biliApi, addUser } from "@biliLive-tools/shared/task/bili.js";

import type { IpcMainInvokeEvent } from "electron";
import type { BiliupConfig } from "@biliLive-tools/types";

let tv: TvQrcodeLogin;

export { biliApi };

export const handlers = {
  "biliApi:login": (event: IpcMainInvokeEvent) => {
    tv = new TvQrcodeLogin();
    tv.on("error", (res) => {
      event.sender.send("biliApi:login-error", res);
    });
    tv.on("scan", (res) => {
      console.log("scan", res);
    });
    tv.on("completed", async (res) => {
      const data = res.data;
      await addUser(data);
      event.sender.send("biliApi:login-completed", res);
    });
    return tv.login();
  },
  "biliApi:login:cancel": () => {
    tv.interrupt();
  },
  "bili:addMedia": (
    _event: IpcMainInvokeEvent,
    uid: number,
    pathArray: string[],
    options: BiliupConfig,
  ) => {
    return biliApi.addMedia(pathArray, options, uid);
  },
  "biliApi:download": (
    _event: IpcMainInvokeEvent,
    options: { bvid: string; cid: number; output: string },
    uid: number,
  ) => {
    return biliApi.download(options, uid);
  },
};
