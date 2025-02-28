import request from "./request";

/** 订阅相关 */
const subParse = async (url: string) => {
  const res = await request.post(`/video/sub/parse`, { url });
  return res.data;
};

const addSub = async (data: { name: string; platform: string; subId: string; options: any }) => {
  const res = await request.post(`/video/sub/add`, data);
  return res.data;
};

const removeSub = async (id: number) => {
  const res = await request.post(`/video/sub/remove`, { id });
  return res.data;
};

const updateSub = async (data: {
  id: number;
  name: string;
  platform: string;
  subId: string;
  options: any;
}) => {
  const res = await request.post(`/video/sub/update`, data);
  return res.data;
};

const listSub = async () => {
  const res = await request.get(`/video/sub/list`);
  return res.data;
};

export default {
  subParse,
  addSub,
  removeSub,
  updateSub,
  listSub,
};
