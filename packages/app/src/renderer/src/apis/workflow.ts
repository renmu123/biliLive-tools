import request from "./request";
import type {
  Workflow,
  WorkflowDefinition,
  WorkflowExecution,
  NodeExecutionLog,
} from "@biliLive-tools/shared/workflow/index.js";

/**
 * 获取所有工作流列表
 */
const list = async (): Promise<Workflow[]> => {
  const res = await request.get(`/workflow`);
  return res.data;
};

/**
 * 根据ID获取工作流
 */
const get = async (id: string): Promise<Workflow> => {
  const res = await request.get(`/workflow/${id}`);
  return res.data;
};

/**
 * 创建新工作流
 */
const create = async (data: {
  name: string;
  description?: string;
  definition: WorkflowDefinition;
}): Promise<{ id: string }> => {
  const res = await request.post(`/workflow`, data);
  return res.data;
};

/**
 * 更新工作流
 */
const update = async (id: string, updates: Partial<Workflow>): Promise<void> => {
  await request.put(`/workflow/${id}`, updates);
};

/**
 * 删除工作流
 */
const remove = async (id: string): Promise<void> => {
  await request.delete(`/workflow/${id}`);
};

/**
 * 执行工作流
 */
const execute = async (
  id: string,
  initialInputs?: Record<string, any>,
): Promise<{ executionId: string }> => {
  const res = await request.post(`/workflow/${id}/execute`, { initialInputs });
  return res.data;
};

/**
 * 获取工作流执行历史
 */
const getExecutionHistory = async (workflowId: string): Promise<WorkflowExecution[]> => {
  const res = await request.get(`/workflow/${workflowId}/executions`);
  return res.data;
};

/**
 * 获取指定执行的详细信息
 */
const getExecutionDetail = async (executionId: string): Promise<WorkflowExecution> => {
  const res = await request.get(`/workflow/execution/${executionId}`);
  return res.data;
};

/**
 * 获取节点执行日志
 */
const getNodeLogs = async (executionId: string): Promise<NodeExecutionLog[]> => {
  const res = await request.get(`/workflow/execution/${executionId}/logs`);
  return res.data;
};

/**
 * 获取可用节点类型元数据
 */
const getNodeMetadata = async (): Promise<any[]> => {
  const res = await request.get(`/workflow/nodes/metadata`);
  return res.data;
};

export default {
  list,
  get,
  create,
  update,
  remove,
  execute,
  getExecutionHistory,
  getExecutionDetail,
  getNodeLogs,
  getNodeMetadata,
};
