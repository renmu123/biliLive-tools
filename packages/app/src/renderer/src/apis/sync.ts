import request from "./request";

import type { SyncType } from "@biliLive-tools/types";

const syncTestUpload = async (data: {
  remoteFolder: string;
  type: SyncType;
  execPath?: string;
  apiUrl?: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
}) => {
  const res = await request.post(`/sync/uploadTest`, data);
  return res.data;
};

const syncTestLogin = async (data: {
  execPath?: string;
  type: SyncType;
  apiUrl?: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
}) => {
  const res = await request.get(`/sync/isLogin`, { params: data });
  return res.data;
};

const baiduPCSLogin = async (data: { cookie: string; execPath: string }) => {
  const res = await request.post(`/sync/baiduPCSLogin`, data);
  return res.data;
};

const aliyunpanLogin = async (data: {
  execPath: string;
  type: "getUrl" | "cancel" | "confirm";
}) => {
  const res = await request.get(`/sync/aliyunpanLogin`, { params: data });
  return res.data;
};

const pan123Login = async (data: { clientId: string; clientSecret: string }) => {
  const res = await request.post(`/sync/pan123Login`, data);
  return res.data;
};

const sync = async (data: {
  file: string;
  type: SyncType;
  targetPath: string;
  options: { removeOrigin: boolean };
}) => {
  const res = await request.post(`/sync/sync`, data);
  return res.data;
};

export default {
  syncTestUpload,
  syncTestLogin,
  baiduPCSLogin,
  aliyunpanLogin,
  pan123Login,
  sync,
};
