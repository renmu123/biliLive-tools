import request from "./request";

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

const userApi = {
  getList: getUserList,
  refresh,
  delete: deleteUser,
  updateAuth,
};

export default userApi;
