import Router from "@koa/router";
import { dbContainer } from "@biliLive-tools/shared/db/index.js";
import { workflowExecutor, nodeRegistry } from "@biliLive-tools/shared/workflow/index.js";

import type { Context } from "koa";
import type { WorkflowDefinition } from "@biliLive-tools/shared/workflow/index.js";

const router = new Router({
  prefix: "/workflow",
});

// 获取所有工作流列表
router.get("/", async (ctx: Context) => {
  const workflowModel = dbContainer.resolve("workflowModel");
  ctx.body = workflowModel.list();
});

// 根据ID获取工作流
router.get("/:id", async (ctx: Context) => {
  const workflowModel = dbContainer.resolve("workflowModel");
  const workflow = workflowModel.findById(ctx.params.id);
  if (!workflow) {
    ctx.status = 404;
    ctx.body = { error: "工作流不存在" };
    return;
  }
  ctx.body = workflow;
});

function cleanDefinition(definition: WorkflowDefinition): WorkflowDefinition {
  for (const node of definition.nodes) {
    const allowKeys = ["id", "type", "data", "position"];
    for (const key of Object.keys(node)) {
      if (!allowKeys.includes(key)) {
        delete node[key];
      }
    }
    const allowDataKeys = ["label", "config", "type"];
    for (const key of Object.keys(node.data)) {
      if (!allowDataKeys.includes(key)) {
        delete node.data[key];
      }
    }
  }
  for (const edge of definition.edges) {
    const allowKeys = ["id", "source", "target"];
    for (const key of Object.keys(edge)) {
      if (!allowKeys.includes(key)) {
        delete edge[key];
      }
    }
  }
  return definition;
}

// 创建工作流
router.post("/", async (ctx: Context) => {
  const workflowModel = dbContainer.resolve("workflowModel");
  const data = ctx.request.body as {
    name: string;
    description?: string;
    definition: WorkflowDefinition;
  };

  const id = workflowModel.add({
    name: data.name,
    description: data.description,
    definition: cleanDefinition(data.definition),
    is_active: true,
  });

  ctx.body = { id };
});

// 更新工作流
router.put("/:id", async (ctx: Context) => {
  const workflowModel = dbContainer.resolve("workflowModel");
  const updates = ctx.request.body as any;
  updates.definition = cleanDefinition(updates.definition);
  const success = workflowModel.update(ctx.params.id, updates);

  if (!success) {
    ctx.status = 404;
    ctx.body = { error: "工作流不存在或更新失败" };
    return;
  }

  ctx.body = { success: true };
});

// 删除工作流
router.del("/:id", async (ctx: Context) => {
  const workflowModel = dbContainer.resolve("workflowModel");
  const success = workflowModel.deleteById(ctx.params.id);

  if (!success) {
    ctx.status = 404;
    ctx.body = { error: "工作流不存在" };
    return;
  }

  ctx.body = { success: true };
});

// 执行工作流
router.post("/:id/execute", async (ctx: Context) => {
  const workflowModel = dbContainer.resolve("workflowModel");
  const executionModel = dbContainer.resolve("executionModel");
  const nodeLogModel = dbContainer.resolve("nodeLogModel");

  const workflow = workflowModel.findById(ctx.params.id);
  if (!workflow) {
    ctx.status = 404;
    ctx.body = { error: "工作流不存在" };
    return;
  }

  const initialInputs = (ctx.request.body as any)?.initialInputs;

  // 创建执行记录
  const executionId = executionModel.add({
    workflow_id: ctx.params.id,
    status: "running",
    start_time: Date.now(),
    node_results: {},
  });

  // 监听执行事件并记录到数据库
  const onNodeStart = ({ nodeId }: any) => {
    nodeLogModel.add({
      execution_id: executionId,
      node_id: nodeId,
      status: "running",
      start_time: Date.now(),
      input_data: {},
      output_data: {},
    });
  };

  const onNodeComplete = ({ nodeId, status, outputs }: any) => {
    const logs = nodeLogModel.findByExecutionId(executionId);
    const log = logs.find((l) => l.node_id === nodeId);
    if (log) {
      nodeLogModel.update(log.id, {
        status,
        end_time: Date.now(),
        output_data: outputs,
      });
    }
  };

  const onWorkflowComplete = ({ status }: any) => {
    executionModel.update(executionId, {
      status,
      end_time: Date.now(),
    });

    // 移除监听器
    workflowExecutor.offEvent("node-start", onNodeStart);
    workflowExecutor.offEvent("node-complete", onNodeComplete);
    workflowExecutor.offEvent("workflow-complete", onWorkflowComplete);
  };

  workflowExecutor.onEvent("node-start", onNodeStart);
  workflowExecutor.onEvent("node-complete", onNodeComplete);
  workflowExecutor.onEvent("workflow-complete", onWorkflowComplete);

  // 异步执行工作流
  workflowExecutor.execute(workflow, initialInputs).catch((error) => {
    console.error("工作流执行失败:", error);
    executionModel.update(executionId, {
      status: "failed",
      end_time: Date.now(),
      error: error.message,
    });
  });

  ctx.body = { executionId };
});

// 获取工作流执行历史
router.get("/:id/executions", async (ctx: Context) => {
  const executionModel = dbContainer.resolve("executionModel");
  const limit = parseInt(ctx.query.limit as string) || 50;
  ctx.body = executionModel.findByWorkflowId(ctx.params.id, limit);
});

// 获取执行详情
router.get("/execution/:executionId", async (ctx: Context) => {
  const executionModel = dbContainer.resolve("executionModel");
  const execution = executionModel.findById(ctx.params.executionId);

  if (!execution) {
    ctx.status = 404;
    ctx.body = { error: "执行记录不存在" };
    return;
  }

  ctx.body = execution;
});

// 获取执行的节点日志
router.get("/execution/:executionId/logs", async (ctx: Context) => {
  const nodeLogModel = dbContainer.resolve("nodeLogModel");
  ctx.body = nodeLogModel.findByExecutionId(ctx.params.executionId);
});

// 获取所有节点元数据（用于UI显示）
router.get("/nodes/metadata", async (ctx: Context) => {
  ctx.body = nodeRegistry.getAllMetadata();
});

// 获取指定分类的节点
router.get("/nodes/category/:category", async (ctx: Context) => {
  ctx.body = nodeRegistry.getByCategory(ctx.params.category);
});

export default router;
