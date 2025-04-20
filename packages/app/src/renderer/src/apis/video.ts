import request from "./request";

import type { VideoAPI } from "@biliLive-tools/http/types/video.js";

/** 订阅相关 */
const subParse = async (url: string) => {
  const res = await request.post(`/video/sub/parse`, { url });
  return res.data;
};

const addSub = async (data: VideoAPI["SubAdd"]["Args"]) => {
  const res = await request.post(`/video/sub/add`, data);
  return res.data;
};

const removeSub = async (id: number) => {
  const res = await request.post(`/video/sub/remove`, { id });
  return res.data;
};

const updateSub = async (data: VideoAPI["SubUpdate"]["Args"]) => {
  const res = await request.post(`/video/sub/update`, data);
  return res.data;
};

const listSub = async () => {
  const res = await request.get(`/video/sub/list`);
  return res.data;
};

const checkSub = async (id: number) => {
  const res = await request.post(`/video/sub/check`, { id });
  return res.data;
};

export default {
  subParse,
  addSub,
  removeSub,
  updateSub,
  listSub,
  checkSub,
};
