<template>
  <n-modal
    v-model:show="showModal"
    preset="card"
    :title="`配置节点: ${nodeLabel}`"
    style="width: 600px"
    :bordered="false"
    :segmented="{
      content: true,
      footer: 'soft',
    }"
  >
    <n-form ref="formRef" :model="formData" label-placement="left" label-width="120">
      <n-form-item
        v-for="field in configSchema"
        :key="field.key"
        :label="field.label"
        :path="field.key"
        :rule="{
          required: field.required,
          message: `${field.label}不能为空`,
          trigger: ['blur', 'change'],
        }"
      >
        <template v-if="field.description" #label>
          <Tip :text="field.label" :tip="field.description"></Tip>
        </template>

        <!-- 字符串输入 -->
        <n-input
          v-if="field.type === 'string'"
          v-model:value="formData[field.key]"
          :placeholder="field.placeholder || `请输入${field.label}`"
          clearable
        />

        <!-- 数字输入 -->
        <n-input-number
          v-else-if="field.type === 'number'"
          v-model:value="formData[field.key]"
          :placeholder="field.placeholder || `请输入${field.label}`"
          :min="field.min"
          :max="field.max"
          style="width: 100%"
        />

        <!-- 布尔开关 -->
        <n-switch v-else-if="field.type === 'boolean'" v-model:value="formData[field.key]" />

        <!-- 下拉选择 -->
        <n-select
          v-else-if="field.type === 'select'"
          v-model:value="formData[field.key]"
          :options="field.options || []"
          :placeholder="field.placeholder || `请选择${field.label}`"
          clearable
        />

        <!-- 文件选择 -->
        <div v-else-if="field.type === 'file'" style="display: flex; gap: 8px; width: 100%">
          <n-input
            v-model:value="formData[field.key]"
            :placeholder="field.placeholder || `请选择${field.label}`"
            style="flex: 1"
          />
          <n-button @click="handleSelectFile(field)">浏览</n-button>
        </div>

        <!-- 目录选择 -->
        <div v-else-if="field.type === 'directory'" style="display: flex; gap: 8px; width: 100%">
          <n-input
            v-model:value="formData[field.key]"
            :placeholder="field.placeholder || `请选择${field.label}`"
            style="flex: 1"
          />
          <n-button @click="handleSelectDirectory(field)">浏览</n-button>
        </div>

        <!-- 预设选择 -->
        <PresetSelector
          v-else-if="field.type === 'preset'"
          v-model:value="formData[field.key]"
          :preset-type="field.presetType"
          :placeholder="field.placeholder || `请选择${field.label}`"
        />

        <!-- 未知类型回退 -->
        <n-input
          v-else
          v-model:value="formData[field.key]"
          :placeholder="field.placeholder || `请输入${field.label}`"
          clearable
        />
      </n-form-item>

      <!-- 提示：如果没有配置项 -->
      <n-empty v-if="!configSchema || configSchema.length === 0" description="此节点无需配置" />
    </n-form>

    <template #footer>
      <n-space justify="end">
        <n-button @click="handleCancel">取消</n-button>
        <n-button type="primary" @click="handleConfirm">确定</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import showDirectoryDialog from "@renderer/components/showDirectoryDialog";
import PresetSelector from "./PresetSelector.vue";

interface ConfigField {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  defaultValue?: any;
  description?: string;
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  presetType?: string;
  accept?: string;
  min?: number;
  max?: number;
}

interface Props {
  nodeId: string;
  nodeLabel: string;
  configSchema: ConfigField[];
  config: Record<string, any>;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update:config", config: Record<string, any>): void;
  (e: "close"): void;
}>();

const showModal = defineModel<boolean>("visible", { required: true });
const formRef = ref();
const formData = ref<Record<string, any>>({});

// 初始化表单数据
const initFormData = () => {
  const data: Record<string, any> = {};

  props.configSchema.forEach((field) => {
    // 优先使用已有配置，其次使用默认值
    if (props.config && props.config[field.key] !== undefined) {
      data[field.key] = props.config[field.key];
    } else if (field.defaultValue !== undefined) {
      data[field.key] = field.defaultValue;
    } else {
      // 根据类型设置初始值
      switch (field.type) {
        case "boolean":
          data[field.key] = false;
          break;
        case "number":
          data[field.key] = undefined;
          break;
        default:
          data[field.key] = "";
      }
    }
  });

  formData.value = data;
};

// 监听 props 变化，重新初始化表单
watch(
  () => props.config,
  () => {
    initFormData();
  },
  { immediate: true },
);

// 文件选择
const handleSelectFile = async (field: ConfigField) => {
  const result = await showDirectoryDialog({
    type: "file",
    multi: false,
    exts: field.accept ? field.accept.split(",").map((ext) => ext.trim()) : undefined,
  });

  if (result && result.length > 0) {
    formData.value[field.key] = result[0];
  }
};

// 目录选择
const handleSelectDirectory = async (field: ConfigField) => {
  const result = await showDirectoryDialog({
    type: "directory",
  });

  if (result && result.length > 0) {
    formData.value[field.key] = result[0];
  }
};

// 取消
const handleCancel = () => {
  showModal.value = false;
  emit("close");
};

// 确认
const handleConfirm = async () => {
  try {
    await formRef.value?.validate();
    emit("update:config", { ...formData.value });
    showModal.value = false;
  } catch (error) {
    console.error("表单验证失败:", error);
  }
};
</script>

<style scoped>
:deep(.n-form-item-label__text) {
  font-weight: 500;
}
</style>
