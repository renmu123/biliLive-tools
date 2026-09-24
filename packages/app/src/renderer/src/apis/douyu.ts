import request from "./request";

const qrcode = async (): Promise<{ id: string; url: string; expiresAt: number }> => {
  const res = await request.post("/douyu/login");
  return res.data;
};

const loginPoll = async (
  id: string,
): Promise<{ status: "scan" | "completed" | "error"; failReason?: string }> => {
  const res = await request.get("/douyu/login/poll", { params: { id } });
  return res.data;
};

const loginCancel = async (id: string) => {
  if (!id) return;
  const res = await request.post("/douyu/login/cancel", { id });
  return res.data;
};

const getUsers = async (): Promise<{ uid: number; name: string; avatar?: string }[]> => {
  const res = await request.get("/douyu/user/list");
  return res.data;
};

const deleteUser = async (uid: number) => {
  const res = await request.post("/douyu/user/delete", { uid });
  return res.data;
};

export default { qrcode, loginPoll, loginCancel, getUsers, deleteUser };
