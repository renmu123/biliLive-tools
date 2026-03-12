import { z } from "zod";

// ==================== Port & Data Type ====================

export const PortDataType = z.enum(["file", "string", "number", "boolean", "object", "array"]);
export type PortDataType = z.infer<typeof PortDataType>;

export const PortDefinition = z.object({
  id: z.string(),
  name: z.string(),
  type: PortDataType,
  required: z.boolean().default(true),
  description: z.string().optional(),
});
export type PortDefinition = z.infer<typeof PortDefinition>;

// ==================== Config Field ====================

export const ConfigFieldType = z.enum([
  "string",
  "number",
  "boolean",
  "select",
  "file",
  "directory",
  "preset",
]);
export type ConfigFieldType = z.infer<typeof ConfigFieldType>;

export const ConfigFieldDefinition = z.object({
  key: z.string(),
  label: z.string(),
  type: ConfigFieldType,
  required: z.boolean().default(false),
  defaultValue: z.any().optional(),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  // select 类型的选项
  options: z.array(z.object({ label: z.string(), value: z.any() })).optional(),
  // preset 类型的API类型（如 "ffmpeg", "danmu", "upload"）
  presetType: z.string().optional(),
  // 文件类型过滤
  accept: z.string().optional(),
  // 数字类型的范围
  min: z.number().optional(),
  max: z.number().optional(),
});
export type ConfigFieldDefinition = z.infer<typeof ConfigFieldDefinition>;

// ==================== Node ====================

export const WorkflowNodeData = z.object({
  label: z.string(),
  config: z.record(z.any()).default({}),
  type: z.string(),
  inputs: z.array(PortDefinition).default([]),
  outputs: z.array(PortDefinition).default([]),
});
export type WorkflowNodeData = z.infer<typeof WorkflowNodeData>;

export const WorkflowNode = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: WorkflowNodeData,
});
export type WorkflowNode = z.infer<typeof WorkflowNode>;

// ==================== Edge ====================

export const WorkflowEdge = z.object({
  id: z.string(),
  source: z.string(), // 源节点 ID
  target: z.string(), // 目标节点 ID
  sourceHandle: z.string().optional(), // 源端口
  targetHandle: z.string().optional(), // 目标端口
});
export type WorkflowEdge = z.infer<typeof WorkflowEdge>;

// ==================== Workflow Definition ====================

export const WorkflowDefinition = z.object({
  nodes: z.array(WorkflowNode),
  edges: z.array(WorkflowEdge),
  variables: z.record(z.any()).optional().default({}),
});
export type WorkflowDefinition = z.infer<typeof WorkflowDefinition>;

// ==================== Workflow ====================

export const BaseWorkflow = z.object({
  name: z.string(),
  description: z.string().optional(),
  definition: WorkflowDefinition,
  is_active: z.boolean().default(true),
});
export type BaseWorkflow = z.infer<typeof BaseWorkflow>;

export const Workflow = BaseWorkflow.extend({
  id: z.string(),
  created_at: z.number(),
  updated_at: z.number(),
});
export type Workflow = z.infer<typeof Workflow>;

// ==================== Execution ====================

export const ExecutionStatus = z.enum(["running", "success", "failed", "cancelled"]);
export type ExecutionStatus = z.infer<typeof ExecutionStatus>;

export const BaseWorkflowExecution = z.object({
  workflow_id: z.string(),
  status: ExecutionStatus,
  start_time: z.number(),
  end_time: z.number().optional(),
  error: z.string().optional(),
  node_results: z.record(z.any()).optional().default({}),
});
export type BaseWorkflowExecution = z.infer<typeof BaseWorkflowExecution>;

export const WorkflowExecution = BaseWorkflowExecution.extend({
  id: z.string(),
});
export type WorkflowExecution = z.infer<typeof WorkflowExecution>;

// ==================== Node Execution Log ====================

export const NodeExecutionStatus = z.enum(["pending", "running", "success", "failed", "skipped"]);
export type NodeExecutionStatus = z.infer<typeof NodeExecutionStatus>;

export const BaseNodeExecutionLog = z.object({
  execution_id: z.string(),
  node_id: z.string(),
  status: NodeExecutionStatus,
  start_time: z.number().optional(),
  end_time: z.number().optional(),
  input_data: z.record(z.any()).optional().default({}),
  output_data: z.record(z.any()).optional().default({}),
  error: z.string().optional(),
});
export type BaseNodeExecutionLog = z.infer<typeof BaseNodeExecutionLog>;

export const NodeExecutionLog = BaseNodeExecutionLog.extend({
  id: z.string(),
});
export type NodeExecutionLog = z.infer<typeof NodeExecutionLog>;
