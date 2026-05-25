import request from "./request";
import { generateHMACSHA256 } from "../utils";
import type { BiliUser } from "@biliLive-tools/types";

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

const exportAll = async (): Promise<BiliUser[]> => {
  const res = await request.get(`/user/export`);
  return res.data;
};

const exportSingle = async (uid: number): Promise<BiliUser> => {
  const res = await request.post(`/user/export_single`, {
    uid,
  });
  return res.data;
};

const importAll = async (users: BiliUser[]) => {
  const res = await request.post(`/user/import`, {
    users,
  });
  return res.data;
};

const importSingle = async (user: BiliUser) => {
  const res = await request.post(`/user/import_single`, {
    user,
  });
  return res.data;
};

const userApi = {
  getList: getUserList,
  refresh,
  delete: deleteUser,
  updateAuth,
  getCookie,
  exportAll,
  exportSingle,
  importAll,
  importSingle,
};

export default userApi;
