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
  return request.post(`/user/update`, {
    uid,
  });
};

/**
 * @description Delete user
 */
const deleteUser = async (uid: number) => {
  return request.post(`/user/delete`, {
    uid,
  });
};

const userApi = {
  getList: getUserList,
  refresh,
  delete: deleteUser,
};

export default userApi;
