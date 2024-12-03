import request from "./request";
import type { Task } from "@renderer/types";
import type { DanmuPreset } from "@biliLive-tools/types";

/**
 * 获取任务列表
 */
const list = async (params: {
  type?: string;
}): Promise<{ list: Task[]; runningTaskNum: number }> => {
  const res = await request.get(`/task`, { params });
  return res.data;
};

/**
 * 获取任务
 */
const get = async (id: string): Promise<Task> => {
  const res = await request.get(`/task/${id}`);
  return res.data;
};

const pause = async (id: string): Promise<string> => {
  const res = await request.post(`/task/${id}/pause`);
  return res.data;
};

const resume = async (id: string): Promise<string> => {
  const res = await request.post(`/task/${id}/resume`);
  return res.data;
};

const cancel = async (id: string): Promise<string> => {
  const res = await request.post(`/task/${id}/kill`);
  return res.data;
};

const interrupt = async (id: string): Promise<string> => {
  const res = await request.post(`/task/${id}/interrupt`);
  return res.data;
};

const remove = async (id: string): Promise<string> => {
  const res = await request.post(`/task/${id}/remove`);
  return res.data;
};

const start = async (id: string): Promise<string> => {
  const res = await request.post(`/task/${id}/start`);
  return res.data;
};

const convertXml2Ass = async (
  input: string,
  output: string,
  preset: DanmuPreset["config"],
  options: {
    saveRadio: 1 | 2;
    savePath?: string;
  },
): Promise<string> => {
  const res = await request.post(`/task/convertXml2Ass`, {
    input,
    output,
    options,
    preset,
  });
  return res.data;
};

const mergeVideos = async (
  inputVideos: string[],
  output: string,
  options: {
    removeOrigin: boolean;
  },
): Promise<string> => {
  const res = await request.post(`/task/mergeVideo`, {
    inputVideos,
    output,
    options,
  });
  return res.data;
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
  convertXml2Ass,
  mergeVideos,
};

export default task;
