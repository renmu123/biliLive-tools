<template>
  <div class="node-wrapper">
    <div
      class="custom-node"
      :class="{
        'has-warning': hasConfigWarning,
        selected: props.selected,
      }"
    >
      <!-- 配置图标 -->
      <div v-if="hasConfigSchema" class="node-header">
        <n-icon class="config-icon" size="18" @click.stop="handleConfigClick">
          <SettingsOutline />
        </n-icon>
      </div>

      <!-- 节点内容区域 -->
      <div class="node-content">
        <!-- 输入端口区域 -->
        <div v-if="data.inputs && data.inputs.length > 0" class="ports-container input-ports">
          <div v-for="input in data.inputs" :key="input.id" class="port-item">
            <Handle :id="input.id" type="target" :position="Position.Left" />
            <span class="port-label">{{ input.name }}</span>
          </div>
        </div>

        <!-- 输出端口区域 -->
        <div v-if="data.outputs && data.outputs.length > 0" class="ports-container output-ports">
          <div v-for="output in data.outputs" :key="output.id" class="port-item">
            <span class="port-label">{{ output.name }}</span>
            <Handle :id="output.id" type="source" :position="Position.Right" />
          </div>
        </div>
      </div>

      <!-- 警告图标 -->
      <div v-if="hasConfigWarning" class="warning-indicator">
        <n-icon size="16">
          <WarningOutline />
        </n-icon>
      </div>
    </div>

    <!-- 节点名称 - 外部底部居中 -->
    <div class="node-label-external">{{ data.label }}</div>
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

<style scoped lang="less">
.node-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.custom-node {
  position: relative;
  min-width: 180px;
  /* min-height: 80px; */
  background: white;
  border: 2px solid #d0d7de;
  border-radius: 8px;
  // padding: 12px 16px;
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
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.config-icon {
  color: #656d76;
  cursor: pointer;
  transition: color 0.2s;
}

.config-icon:hover {
  color: #18a058;
}

.node-content {
  // min-height: 80px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 30px 0 15px 0;
}

.ports-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  // align-items: center;
  justify-content: center;
  width: 100%;
}

// .input-ports {
//   left: -10px;
// }

// .output-ports {
//   right: -10px;
// }

.port-item {
  position: relative;
  // position: absolute;
  display: flex;
  align-items: center;
  gap: 8px;
  // transform: translateY(-50%);
}

.input-ports .port-item {
  flex-direction: row;
  left: 0;
}

.output-ports .port-item {
  flex-direction: row-reverse;
  right: 0;
}

.port-label {
  font-size: 12px;
  color: #656d76;
  white-space: nowrap;
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
  // border: 1px solid #e1e4e8;
  transition: all 0.2s;
}

.port-item:hover .port-label {
  color: #18a058;
  border-color: #18a058;
}

.node-label-external {
  font-size: 13px;
  font-weight: 500;
  color: #24292f;
  text-align: center;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
}

.warning-indicator {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 24px;
  height: 24px;
  background: #f0a020;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 20;
}

/* VueFlow Handle 样式覆盖 */
:deep(.vue-flow__handle) {
  width: 10px;
  height: 10px;
  background: #8c959f;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  transition: all 0.2s;
}

:deep(.vue-flow__handle:hover) {
  background: #18a058;
  /* transform: scale(1.2); */
}

:deep(.vue-flow__handle.connected) {
  background: #18a058;
}
</style>
