import { defineStore } from "pinia";
import { workflowApi } from "@renderer/apis";
import type {
  Workflow,
  WorkflowDefinition,
  WorkflowExecution,
  NodeExecutionLog,
} from "@biliLive-tools/shared/workflow/index.js";

interface WorkflowState {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  currentExecution: WorkflowExecution | null;
  executionHistory: WorkflowExecution[];
  nodeLogs: NodeExecutionLog[];
  nodeMetadata: any[]; // 节点元数据（用于显示在面板中）
  isExecuting: boolean;
}

export const useWorkflowStore = defineStore("workflow", {
  state: (): WorkflowState => ({
    workflows: [],
    currentWorkflow: null,
    currentExecution: null,
    executionHistory: [],
    nodeLogs: [],
    nodeMetadata: [],
    isExecuting: false,
  }),

  getters: {
    getWorkflowById: (state) => (id: string) => {
      return state.workflows.find((w) => w.id === id);
    },

    activeWorkflows: (state) => {
      return state.workflows.filter((w) => w.is_active);
    },
  },

  actions: {
    async loadWorkflows() {
      try {
        this.workflows = await workflowApi.list();
      } catch (error) {
        console.error("加载工作流列表失败:", error);
      }
    },

    async loadNodeMetadata() {
      try {
        this.nodeMetadata = await workflowApi.getNodeMetadata();
      } catch (error) {
        console.error("加载节点元数据失败:", error);
      }
    },

    async createWorkflow(data: {
      name: string;
      description?: string;
      definition: WorkflowDefinition;
    }) {
      try {
        const result = await workflowApi.create(data);
        await this.loadWorkflows();
        return result.id;
      } catch (error) {
        console.error("创建工作流失败:", error);
        throw error;
      }
    },

    async updateWorkflow(id: string, updates: Partial<Workflow>) {
      try {
        await workflowApi.update(id, updates);
        await this.loadWorkflows();

        // 如果更新的是当前工作流，重新加载
        if (this.currentWorkflow?.id === id) {
          this.currentWorkflow = this.getWorkflowById(id) || null;
        }
      } catch (error) {
        console.error("更新工作流失败:", error);
        throw error;
      }
    },

    async deleteWorkflow(id: string) {
      try {
        await workflowApi.remove(id);
        await this.loadWorkflows();

        // 如果删除的是当前工作流，清空
        if (this.currentWorkflow?.id === id) {
          this.currentWorkflow = null;
        }
      } catch (error) {
        console.error("删除工作流失败:", error);
        throw error;
      }
    },

    async loadWorkflow(id: string) {
      try {
        this.currentWorkflow = await workflowApi.get(id);
        return this.currentWorkflow;
      } catch (error) {
        console.error("加载工作流失败:", error);
        throw error;
      }
    },

    async executeWorkflow(id: string, initialInputs?: Record<string, any>) {
      try {
        this.isExecuting = true;
        const result = await workflowApi.execute(id, initialInputs);
        return result.executionId;
      } catch (error) {
        console.error("执行工作流失败:", error);
        throw error;
      } finally {
        this.isExecuting = false;
      }
    },

    async loadExecutionHistory(workflowId: string) {
      try {
        this.executionHistory = await workflowApi.getExecutionHistory(workflowId);
      } catch (error) {
        console.error("加载执行历史失败:", error);
      }
    },

    async loadExecutionLogs(executionId: string) {
      try {
        this.nodeLogs = await workflowApi.getNodeLogs(executionId);
      } catch (error) {
        console.error("加载执行日志失败:", error);
      }
    },

    setCurrentWorkflow(workflow: Workflow | null) {
      this.currentWorkflow = workflow;
    },

    setCurrentExecution(execution: WorkflowExecution | null) {
      this.currentExecution = execution;
    },

    // 用于实时更新执行状态（通过 IPC 事件）
    updateExecutionStatus(executionId: string, status: any) {
      if (this.currentExecution?.id === executionId) {
        this.currentExecution = {
          ...this.currentExecution,
          ...status,
        };
      }
    },
  },
});
