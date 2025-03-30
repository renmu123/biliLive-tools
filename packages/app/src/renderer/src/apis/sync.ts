import request from "./request";

const syncTestUpload = async (data: { remoteFolder: string; execPath: string }) => {
  const res = await request.post(`/sync/uploadTest`, data);
  return res.data;
};

const syncTestLogin = async (data: { execPath: string }) => {
  const res = await request.get(`/sync/isLogin`, { params: data });
  return res.data;
};

const loginByCookie = async (data: { cookie: string; execPath: string }) => {
  const res = await request.post(`/sync/loginByCookie`, data);
  return res.data;
};

export default {
  syncTestUpload,
  syncTestLogin,
  loginByCookie,
};
