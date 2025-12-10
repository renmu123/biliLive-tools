<template>
  <n-popover trigger="click" placement="bottom-start">
    <template #trigger>
      <slot>
        <n-button type="info">显示字段</n-button>
      </slot>
    </template>
    <div style="max-height: 400px; overflow-y: auto; padding: 8px">
      <div
        v-for="col in columns"
        :key="col.value"
        style="display: flex; align-items: center; gap: 8px; padding: 4px 0; cursor: pointer"
        @click="toggleColumn(col.value)"
      >
        <n-checkbox :checked="modelValue.includes(col.value)" />
        <span>{{ col.label }}</span>
      </div>
    </div>
  </n-popover>
</template>

<script setup lang="ts">
import { NPopover, NCheckbox, NButton } from "naive-ui";

interface ColumnConfig {
  value: string;
  label: string;
}

interface Props {
  columns: ColumnConfig[];
  modelValue: string[];
}

interface Emits {
  (e: "update:modelValue", value: string[]): void;
  (e: "change", value: string[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const toggleColumn = (columnValue: string) => {
  const newValue = [...props.modelValue];
  const index = newValue.indexOf(columnValue);
  if (index > -1) {
    newValue.splice(index, 1);
  } else {
    newValue.push(columnValue);
  }
  emit("update:modelValue", newValue);
  emit("change", newValue);
};
</script>
