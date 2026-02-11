<template>
  <div
    class="custom-node"
    :class="{
      'has-warning': hasConfigWarning,
      selected: props.selected,
    }"
  >
    <!-- 节点头部 -->
    <div class="node-header">
      <span class="node-label">{{ data.label }}</span>
      <n-icon v-if="hasConfigSchema" class="config-icon" size="18" @click.stop="handleConfigClick">
        <SettingsOutline />
      </n-icon>
    </div>

    <!-- 输入端口 -->
    <div v-if="data.inputs && data.inputs.length > 0" class="node-ports">
      <Handle
        v-for="input in data.inputs"
        :key="input.id"
        :id="input.id"
        type="target"
        :position="Position.Left"
        :style="{ top: getPortPosition(input, data.inputs) }"
      >
        <div class="port-label port-label-left">{{ input.name }}</div>
      </Handle>
    </div>

    <!-- 输出端口 -->
    <div v-if="data.outputs && data.outputs.length > 0" class="node-ports">
      <Handle
        v-for="output in data.outputs"
        :key="output.id"
        :id="output.id"
        type="source"
        :position="Position.Right"
        :style="{ top: getPortPosition(output, data.outputs) }"
      >
        <div class="port-label port-label-right">{{ output.name }}</div>
      </Handle>
    </div>

    <!-- 警告图标 -->
    <div v-if="hasConfigWarning" class="warning-indicator">
      <n-icon size="16">
        <WarningOutline />
      </n-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import { SettingsOutline, WarningOutline } from "@vicons/ionicons5";

interface Props {
  id: string;
  data: {
    label: string;
    type: string;
    config: Record<string, any>;
    configSchema?: Array<{
      key: string;
      label: string;
      type: string;
      required?: boolean;
      [key: string]: any;
    }>;
    inputs?: Array<{ id: string; name: string; required?: boolean }>;
    outputs?: Array<{ id: string; name: string; required?: boolean }>;
    onConfigClick?: (nodeId: string) => void;
  };
  selected?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "config-click", nodeId: string): void;
}>();

// 是否有配置项
const hasConfigSchema = computed(() => {
  return props.data.configSchema && props.data.configSchema.length > 0;
});

// 是否有配置警告（必填项未填写）
const hasConfigWarning = computed(() => {
  if (!hasConfigSchema.value) return false;

  const schema = props.data.configSchema || [];
  const config = props.data.config || {};

  return schema.some((field) => {
    if (!field.required) return false;
    const value = config[field.key];
    return value === undefined || value === null || value === "";
  });
});

// 计算端口位置
const getPortPosition = (port: any, ports: any[]) => {
  const index = ports.indexOf(port);
  const total = ports.length;
  // 均匀分布端口
  const offset = 100 / (total + 1);
  return `${offset * (index + 1)}%`;
};

// 处理配置按钮点击
const handleConfigClick = () => {
  if (props.data.onConfigClick) {
    props.data.onConfigClick(props.id);
  }
};
</script>

<style scoped>
.custom-node {
  position: relative;
  min-width: 180px;
  min-height: 60px;
  background: white;
  border: 2px solid #d0d7de;
  border-radius: 8px;
  /* padding: 12px; */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.custom-node:hover {
  border-color: #18a058;
  box-shadow: 0 4px 12px rgba(24, 160, 88, 0.15);
}

.custom-node.selected {
  border-color: #18a058;
  box-shadow: 0 4px 16px rgba(24, 160, 88, 0.25);
}

.custom-node.has-warning {
  border-color: #f0a020;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.node-label {
  font-weight: 500;
  font-size: 14px;
  color: #24292f;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.config-icon {
  color: #656d76;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.2s;
}

.config-icon:hover {
  color: #18a058;
}

.node-ports {
  position: relative;
}

.port-label {
  position: absolute;
  font-size: 12px;
  color: #656d76;
  white-space: nowrap;
  pointer-events: none;
  /* transform: translateY(0px); */
  top: -3px;
}

.port-label-left {
  left: 12px;
}

.port-label-right {
  right: 12px;
}

.warning-indicator {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  background: #f0a020;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* VueFlow Handle 样式覆盖 */
:deep(.vue-flow__handle) {
  width: 10px;
  height: 10px;
  background: gray;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

:deep(.vue-flow__handle:hover) {
  /* width: 12px;
  height: 12px; */
  background: #18a058;
}

/* :deep(.vue-flow__handle-left) {
  left: -5px;
}

:deep(.vue-flow__handle-right) {
  right: -5px;
} */
</style>
