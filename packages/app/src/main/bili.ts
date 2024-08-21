import { Client, TvQrcodeLogin } from "@renmu/bili-api";
import { biliApi, addUser } from "@biliLive-tools/shared/task/bili.js";

import type { IpcMainInvokeEvent } from "electron";
import type { BiliupConfig } from "@biliLive-tools/types";

type ClientInstance = InstanceType<typeof Client>;

let tv: TvQrcodeLogin;

export { biliApi };

export const handlers = {
  "biliApi:getArchives": (
    _event: IpcMainInvokeEvent,
    params: Parameters<typeof biliApi.getArchives>[0],
    uid: number,
  ): ReturnType<typeof biliApi.getArchives> => {
    return biliApi.getArchives(params, uid);
  },
  "biliApi:checkTag": (
    _event: IpcMainInvokeEvent,
    tag: Parameters<typeof biliApi.checkTag>[0],
    uid: number,
  ): ReturnType<typeof biliApi.checkTag> => {
    return biliApi.checkTag(tag, uid);
  },
  "biliApi:searchTopic": (
    _event: IpcMainInvokeEvent,
    keyword: string,
    uid: number,
  ): ReturnType<typeof biliApi.searchTopic> => {
    return biliApi.searchTopic(keyword, uid);
  },
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
  "biliApi:getSeasonList": (
    _event: IpcMainInvokeEvent,
    uid: number,
  ): ReturnType<typeof biliApi.getSeasonList> => {
    return biliApi.getSeasonList(uid);
  },
  "biliApi:getArchiveDetail": (
    _event: IpcMainInvokeEvent,
    bvid: string,
    uid?: number,
  ): ReturnType<typeof biliApi.getArchiveDetail> => {
    return biliApi.getArchiveDetail(bvid, uid);
  },
  "biliApi:download": (
    _event: IpcMainInvokeEvent,
    options: { bvid: string; cid: number; output: string },
    uid: number,
  ) => {
    return biliApi.download(options, uid);
  },
  "biliApi:getSessionId": (_event: IpcMainInvokeEvent, aid: number, uid: number) => {
    return biliApi.getSessionId(aid, uid);
  },
  "biliApi:getPlatformArchiveDetail": (
    _event: IpcMainInvokeEvent,
    aid: number,
    uid: number,
  ): ReturnType<ClientInstance["platform"]["getArchive"]> => {
    return biliApi.getPlatformArchiveDetail(aid, uid);
  },
  "biliApi:getPlatformPre": (
    _event: IpcMainInvokeEvent,
    uid: number,
  ): ReturnType<ClientInstance["platform"]["getArchivePre"]> => {
    return biliApi.getPlatformPre(uid);
  },
  "biliApi:getTypeDesc": (
    _event: IpcMainInvokeEvent,
    tid: number,
    uid: number,
  ): ReturnType<ClientInstance["platform"]["getTypeDesc"]> => {
    return biliApi.getTypeDesc(tid, uid);
  },
};
