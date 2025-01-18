import request from "./request";
import { generateHMACSHA256 } from "../utils";

/**
 * @description Get user list
 */
export const getUserList = async (): Promise<
  {
    uid: number;
    name: string;
    face?: string;
    expires: number;
  }[]
> => {
  const res = await request.get(`/user/list`);
  return res.data;
};

/**
 * @description Refresh user info
 */
const refresh = async (uid: number) => {
  const res = await request.post(`/user/update`, {
    uid,
  });
  return res.data;
};

/**
 * @description Delete user
 */
const deleteUser = async (uid: number) => {
  const res = await request.post(`/user/delete`, {
    uid,
  });
  return res.data;
};

const updateAuth = async (uid: number) => {
  const res = await request.post(`/user/update_auth`, {
    uid,
  });
  return res.data;
};

const getCookie = async (uid: number) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const secret = "r96gkr8ahc34fsrewr34";
  const signature = await generateHMACSHA256(`${uid}${timestamp}`, secret);

  const res = await request.post(`/user/get_cookie`, {
    uid,
    timestamp,
    signature,
  });
  const data = res.data;

  return data;
};

const userApi = {
  getList: getUserList,
  refresh,
  delete: deleteUser,
  updateAuth,
  getCookie,
};

export default userApi;
