import request from "./request";

const syncTestUpload = async (data: {
  remoteFolder: string;
  execPath: string;
  type: "baiduPCS" | "aliyunpan";
}) => {
  const res = await request.post(`/sync/uploadTest`, data);
  return res.data;
};

const syncTestLogin = async (data: { execPath: string; type: "baiduPCS" | "aliyunpan" }) => {
  const res = await request.get(`/sync/isLogin`, { params: data });
  return res.data;
};

const loginByCookie = async (data: { cookie: string; execPath: string }) => {
  const res = await request.post(`/sync/loginByCookie`, data);
  return res.data;
};

const aliyunpanLogin = async (data: {
  execPath: string;
  type: "getUrl" | "cancel" | "confirm";
}) => {
  const res = await request.get(`/sync/aliyunpanLogin`, { params: data });
  return res.data;
};

export default {
  syncTestUpload,
  syncTestLogin,
  loginByCookie,
  aliyunpanLogin,
};
