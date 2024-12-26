import request from "./request";

import type { BiliupConfig } from "@biliLive-tools/types";
import type { BiliApi } from "../../../types";

const validUploadParams = async (data: BiliupConfig) => {
  const res = await request.post("/bili/validUploadParams", data);
  return res.data;
};

const getArchives = async (
  params: Parameters<BiliApi["getArchives"]>[0],
  uid: number,
): Promise<ReturnType<BiliApi["getArchives"]>> => {
  const res = await request.get("/bili/archives", {
    params: { ...params, uid },
  });
  return res.data;
};

const getArchiveDetail = async (
  bvid: string,
  uid?: number,
): Promise<ReturnType<BiliApi["getArchiveDetail"]>> => {
  const res = await request.get(`/bili/user/archive/${bvid}`, {
    params: { uid },
  });
  return res.data;
};

const checkTag = async (tag: string, uid: number) => {
  const res = await request.post("/bili/checkTag", {
    tag,
    uid,
  });
  return res.data;
};

const searchTopic = async (keyword: string, uid: number) => {
  const res = await request.get("/bili/searchTopic", {
    params: { keyword, uid },
  });
  return res.data;
};

const getSeasonList = async (uid: number): Promise<ReturnType<BiliApi["getSeasonList"]>> => {
  const res = await request.get("/bili/seasons", {
    params: { uid },
  });
  return res.data;
};

const getSessionId = async (aid: number, uid: number) => {
  const res = await request.get(`/bili//season/${aid}`, {
    params: { uid },
  });
  return res.data;
};

const getPlatformArchiveDetail = async (aid: number, uid: number) => {
  const res = await request.get("/bili/platformArchiveDetail", {
    params: { aid, uid },
  });
  return res.data;
};

const getPlatformPre = async (uid: number): Promise<ReturnType<BiliApi["getPlatformPre"]>> => {
  const res = await request.get("/bili/platformPre", {
    params: { uid },
  });
  return res.data;
};

const getTypeDesc = async (
  tid: number,
  uid: number,
): Promise<ReturnType<BiliApi["getTypeDesc"]>> => {
  const res = await request.get("/bili/typeDesc", {
    params: { tid, uid },
  });
  return res.data;
};

const download = async (
  options: { bvid: string; cid: number; output: string; override: boolean; onlyAudio: boolean },
  uid?: number,
) => {
  const res = await request.post("/bili/download", {
    options,
    uid,
  });
  return res.data;
};

const qrcode = async (): Promise<{
  url: string;
  id: string;
}> => {
  const res = await request.post("/bili/login");
  return res.data;
};

const loginCancel = async (id: string) => {
  const res = await request.post("/bili/login/cancel", {
    id,
  });
  return res.data;
};

const loginPoll = async (
  id: string,
): Promise<{ res: string; status: "scan" | "completed" | "error"; failReason: string }> => {
  const res = await request.get("/bili/login/poll", {
    params: { id },
  });
  return res.data;
};

const upload = async (options: {
  uid: number;
  vid?: number;
  videos?:
    | string[]
    | {
        path: string;
        title?: string;
      }[];
  config?: BiliupConfig;
}): Promise<{
  taskId: string;
}> => {
  const res = await request.post("/bili/upload", options);
  return res.data;
};

const bili = {
  validUploadParams,
  getArchives,
  checkTag,
  searchTopic,
  getSeasonList,
  getArchiveDetail,
  getSessionId,
  getPlatformArchiveDetail,
  getPlatformPre,
  getTypeDesc,
  download,
  qrcode,
  loginCancel,
  loginPoll,
  upload,
};

export default bili;
