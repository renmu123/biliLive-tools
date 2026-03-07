<template>
  <div class="workflow-editor">
    <div class="editor-header">
      <n-space justify="space-between" align="center">
        <n-space align="center">
          <n-button @click="handleBack">
            <template #icon>
              <n-icon><ArrowBack /></n-icon>
            </template>
            返回
          </n-button>
          <n-text strong>{{ workflow?.name || "加载中..." }}</n-text>
        </n-space>
        <n-space>
          <n-button @click="handleSave" :loading="saving">
            <template #icon>
              <n-icon><SaveOutline /></n-icon>
            </template>
            保存
          </n-button>
          <n-button type="primary" @click="handleExecute" :loading="workflowStore.isExecuting">
            <template #icon>
              <n-icon><PlayCircleOutline /></n-icon>
            </template>
            运行
          </n-button>
        </n-space>
      </n-space>
    </div>

    <div class="editor-body">
      <div class="node-panel">
        <n-card title="节点面板" size="small">
          <n-collapse>
            <n-collapse-item
              v-for="category in nodeCategories"
              :key="category.key"
              :title="category.label"
            >
              <div class="node-list">
                <div
                  v-for="node in getNodesByCategory(category.key)"
                  :key="node.type"
                  class="node-item"
                  draggable="true"
                  @dragstart="onNodeDragStart($event, node)"
                >
                  <n-icon size="20" style="margin-right: 8px">
                    <Apps />
                  </n-icon>
                  <div>
                    <div class="node-name">{{ node.displayName }}</div>
                    <div class="node-desc">{{ node.description }}</div>
                  </div>
                </div>
              </div>
            </n-collapse-item>
          </n-collapse>
        </n-card>
      </div>

      <div class="canvas-area">
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :node-types="nodeTypes"
          @drop="onDrop"
          @dragover="onDragOver"
          @connect="onConnect"
        >
          <Background />
          <!-- <Controls />
          <MiniMap /> -->
        </VueFlow>
      </div>
    </div>

    <!-- 节点配置弹窗 -->
    <NodeConfigModal
      v-if="configModalVisible"
      v-model:visible="configModalVisible"
      :node-id="configNodeId"
      :node-label="configNodeLabel"
      :config-schema="configNodeSchema"
      :config="configNodeConfig"
      @update:config="handleConfigUpdate"
      @close="handleConfigClose"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";
import { VueFlow } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { ArrowBack, SaveOutline, PlayCircleOutline, Apps } from "@vicons/ionicons5";
import { useWorkflowStore } from "@renderer/stores/workflow";
import CustomNode from "@renderer/components/workflow/CustomNode.vue";
import NodeConfigModal from "@renderer/components/workflow/NodeConfigModal.vue";

import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";

import type { Connection, Edge } from "@vue-flow/core";

const router = useRouter();
const route = useRoute();
const message = useNotice();
const workflowStore = useWorkflowStore();

// 注册自定义节点类型
const nodeTypes: any = {
  custom: markRaw(CustomNode),
};

const workflowId = route.params.id as string;
const workflow = ref<any>(null);
const saving = ref(false);
const nodes = ref<any[]>([]);
const edges = ref<any[]>([]);
const draggedNodeType = ref<string | null>(null);

// 配置弹窗状态
const configModalVisible = ref(false);
const configNodeId = ref("");
const configNodeLabel = ref("");
const configNodeSchema = ref<any[]>([]);
const configNodeConfig = ref<Record<string, any>>({});

const nodeCategories = [
  { key: "trigger", label: "触发器" },
  { key: "action", label: "动作" },
  { key: "util", label: "工具" },
];

const getNodesByCategory = (category: string) => {
  return workflowStore.nodeMetadata.filter((n: any) => n.category === category);
};

const onNodeDragStart = (event: DragEvent, node: any) => {
  draggedNodeType.value = node.type;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
};

const onDragOver = (event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
};

const onDrop = (event: DragEvent) => {
  if (!draggedNodeType.value) return;

  const nodeMetadata = workflowStore.nodeMetadata.find(
    (n: any) => n.type === draggedNodeType.value,
  );
  if (!nodeMetadata) return;

  // 计算节点位置
  const position = {
    x: event.offsetX,
    y: event.offsetY,
  };

  // 添加节点
  const newNode = {
    id: `node-${Date.now()}`,
    type: "custom",
    position,
    // sourcePosition: Position.Left,
    // targetPosition: Position.Right,
    data: {
      label: nodeMetadata.displayName,
      config: {},
      type: nodeMetadata.type,
      configSchema: nodeMetadata.configSchema || [],
      inputs: nodeMetadata.inputs,
      outputs: nodeMetadata.outputs,
      onConfigClick: handleNodeConfigClick,
    },
  };

  nodes.value.push(newNode);
  draggedNodeType.value = null;
};

const onConnect = (connection: Connection) => {
  // 添加新的连线
  const newEdge: Edge = {
    id: `edge-${Date.now()}`,
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle,
    targetHandle: connection.targetHandle,
  };
  edges.value.push(newEdge);
};

// 处理节点配置按钮点击
const handleNodeConfigClick = (nodeId: string) => {
  const node = nodes.value.find((n) => n.id === nodeId);
  if (!node) return;

  configNodeId.value = nodeId;
  configNodeLabel.value = node.data.label;
  configNodeSchema.value = node.data.configSchema || [];
  configNodeConfig.value = { ...node.data.config };
  configModalVisible.value = true;
};

// 处理配置更新
const handleConfigUpdate = (newConfig: Record<string, any>) => {
  const node = nodes.value.find((n) => n.id === configNodeId.value);
  if (node) {
    node.data.config = newConfig;
  }
};

// 关闭配置弹窗
const handleConfigClose = () => {
  configModalVisible.value = false;
};

// 验证所有节点配置
const validateAllNodes = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  nodes.value.forEach((node) => {
    const schema = node.data.configSchema || [];
    const config = node.data.config || {};

    schema.forEach((field: any) => {
      if (field.required) {
        const value = config[field.key];
        if (value === undefined || value === null || value === "") {
          errors.push(`节点 "${node.data.label}" 的 "${field.label}" 为必填项`);
        }
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};

const handleBack = () => {
  router.push("/workflow");
};

const handleSave = async () => {
  if (!workflow.value) return;

  // 验证所有节点配置
  const validation = validateAllNodes();
  if (!validation.valid) {
    message.warning(`配置未完成:\n${validation.errors.join("\n")}`);
    return;
  }

  saving.value = true;
  try {
    await workflowStore.updateWorkflow(workflowId, {
      definition: {
        nodes: nodes.value,
        edges: edges.value,
        variables: workflow.value.definition.variables || {},
      },
    });
    message.success("保存成功");
  } catch (error: any) {
    message.error(`保存失败: ${error.message}`);
  } finally {
    saving.value = false;
  }
};

const handleExecute = async () => {
  try {
    // 先保存
    await handleSave();
    // 执行
    await workflowStore.executeWorkflow(workflowId);
    message.success("工作流开始执行");
  } catch (error: any) {
    message.error(`执行失败: ${error.message}`);
  }
};

onMounted(async () => {
  // 加载节点元数据
  if (workflowStore.nodeMetadata.length === 0) {
    await workflowStore.loadNodeMetadata();
  }

  // 加载工作流
  workflow.value = await workflowStore.loadWorkflow(workflowId);
  if (workflow.value) {
    // 处理已加载的节点，添加必要的属性
    const loadedNodes = workflow.value.definition.nodes || [];
    nodes.value = loadedNodes.map((node: any) => {
      // 从元数据中获取 configSchema
      const metadata = workflowStore.nodeMetadata.find((m: any) => m.type === node.data.type);

      return {
        ...node,
        // sourcePosition: Position.Left,
        // targetPosition: Position.Right,
        type: "custom", // 确保使用自定义节点类型
        data: {
          ...node.data,
          configSchema: node.data.configSchema || metadata?.configSchema || [],
          onConfigClick: handleNodeConfigClick,
          inputs: metadata?.inputs || [],
          outputs: metadata?.outputs || [],
        },
      };
    });

    edges.value = workflow.value.definition.edges || [];
  }
});
</script>

<style scoped>
.workflow-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.editor-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: white;
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.node-panel {
  width: 280px;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
  background: white;
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: grab;
  background: white;
  transition: all 0.2s;
}

.node-item:hover {
  border-color: #18a058;
  box-shadow: 0 2px 8px rgba(24, 160, 88, 0.15);
}

.node-item:active {
  cursor: grabbing;
}

.node-name {
  font-weight: 500;
  font-size: 14px;
}

.node-desc {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.canvas-area {
  flex: 1;
  position: relative;
}
</style>
