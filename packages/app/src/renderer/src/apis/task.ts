import request from "./request";
import type { Task } from "@renderer/types";

/**
 * 获取任务列表
 */
const list = async (): Promise<Task[]> => {
  const res = await request.get(`/task/list`);
  return res.data.payload;
};

/**
 * 获取任务
 */
const get = async (id: string): Promise<Task> => {
  const res = await request.get(`/task/${id}`);
  return res.data.payload;
};

const pause = async (id: string): Promise<string> => {
  const res = await request.delete(`/task/${id}/pause`);
  return res.data.payload;
};

const resume = async (id: string): Promise<string> => {
  const res = await request.delete(`/task/${id}/resume`);
  return res.data.payload;
};

const cancel = async (id: string): Promise<string> => {
  const res = await request.delete(`/task/${id}/kill`);
  return res.data.payload;
};

const interrupt = async (id: string): Promise<string> => {
  const res = await request.delete(`/task/${id}/interrupt`);
  return res.data.payload;
};

const remove = async (id: string): Promise<string> => {
  const res = await request.delete(`/task/${id}/remove`);
  return res.data.payload;
};

const start = async (id: string): Promise<string> => {
  const res = await request.delete(`/task/${id}/start`);
  return res.data.payload;
};

const task = {
  list,
  get,
  pause,
  resume,
  cancel,
  interrupt,
  remove,
  start,
};

export default task;
