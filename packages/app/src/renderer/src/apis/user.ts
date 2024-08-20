import request from "./request";

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

const flush = async (uid: number) => {
  return request.get(`/user/flush`, {
    params: {
      uid,
    },
  });
};

const deleteUser = async (uid: number) => {
  return request.post(`/user/delete`, {
    uid,
  });
};

const userApi = {
  getList: getUserList,
  flush: flush,
  delete: deleteUser,
};

export default userApi;
