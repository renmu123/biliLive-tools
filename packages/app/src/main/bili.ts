import { TvQrcodeLogin } from "@renmu/bili-api";
import { biliApi, addUser } from "@biliLive-tools/shared/task/bili.js";

import type { IpcMainInvokeEvent } from "electron";

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
};
