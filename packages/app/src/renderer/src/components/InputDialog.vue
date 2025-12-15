<template>
  <n-config-provider :theme="themeUI" :locale="zhCN" :date-locale="dateZhCN">
    <n-modal v-model:show="showModal" transform-origin="center" :mask-closable="false">
      <n-card style="width: 400px" :title="title" :bordered="false">
        <n-input
          ref="inputRef"
          v-model:value="inputValue"
          :type="inputType"
          :placeholder="placeholder"
          :maxlength="maxlength"
          :show-count="showCount"
          :rows="rows"
          :status="showError ? 'error' : undefined"
          clearable
          @keyup.enter="handleConfirm"
        />
        <n-text v-if="showError" type="error" style="font-size: 12px; margin-top: 4px">
          {{ currentErrorMessage }}
        </n-text>
        <template #footer>
          <div style="display: flex; justify-content: flex-end; gap: 12px">
            <n-button @click="handleClose">取消</n-button>
            <n-button type="primary" @click="handleConfirm">确认</n-button>
          </div>
        </template>
      </n-card>
    </n-modal>
  </n-config-provider>
</template>

<script lang="ts" setup>
import { dateZhCN, zhCN } from "naive-ui";
import { useTheme } from "@renderer/hooks/theme";

interface Props {
  title?: string;
  placeholder?: string;
  defaultValue?: string;
  type?: "text" | "password" | "textarea";
  maxlength?: number;
  showCount?: boolean;
  rows?: number;
  required?: boolean;
  errorMessage?: string;
  close: () => void;
  confirm: (value: string) => void;
}

const showModal = defineModel<boolean>("visible", { required: true, default: false });

const props = withDefaults(defineProps<Props>(), {
  title: "输入",
  placeholder: "请输入内容",
  defaultValue: "",
  type: "text",
  maxlength: undefined,
  showCount: false,
  rows: 3,
  required: true,
  errorMessage: "请输入内容",
  close: () => {},
  confirm: () => {},
});

const inputValue = ref(props.defaultValue);
const inputRef = ref();
const showError = ref(false);
const currentErrorMessage = ref("");

const { themeUI } = useTheme();

const inputType = computed(() => {
  if (props.type === "textarea") {
    return "textarea";
  }
  if (props.type === "password") {
    return "password";
  }
  return "text";
});

// 监听 showModal 变化，聚焦输入框
watch(showModal, (newVal) => {
  if (newVal) {
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
});

// 监听输入值变化，清除错误状态
watch(inputValue, () => {
  if (showError.value) {
    showError.value = false;
  }
});

const handleClose = () => {
  props.close();
  showModal.value = false;
};

const handleConfirm = () => {
  if (props.required && (!inputValue.value || inputValue.value.trim() === "")) {
    showError.value = true;
    currentErrorMessage.value = props.errorMessage;
    return;
  }
  props.confirm(inputValue.value);
  showModal.value = false;
};
</script>

<style scoped></style>
