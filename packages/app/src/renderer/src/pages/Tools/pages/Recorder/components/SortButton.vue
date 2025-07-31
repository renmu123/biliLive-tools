<template>
  <n-dropdown :options="options" trigger="click" @select="handleFieldChange">
    <div class="sort-button" style="width: 80px; flex: none">
      <span class="label">{{ currentLabel || "默认状态" }}</span>
      <div class="sort-icon-wrapper" @click.stop="handleDirectionChange">
        <n-icon
          size="14"
          class="sort-icon"
          :class="{
            asc: direction === 'asc',
          }"
        >
          <ArrowUpOutline></ArrowUpOutline>
        </n-icon>
      </div>
    </div>
  </n-dropdown>
</template>

<script setup lang="ts">
import { ArrowUpOutline } from "@vicons/ionicons5";

interface Props {
  field: string;
  direction: "asc" | "desc";
  options: {
    label: string;
    key: string | undefined;
  }[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update:field", field: string): void;
  (e: "update:direction", direction: "asc" | "desc"): void;
}>();

const currentLabel = computed(() => {
  return props.options.find((opt) => opt.key === props.field)?.label || "";
});

const handleFieldChange = (value: string) => {
  emit("update:field", value);
};

const handleDirectionChange = () => {
  const newDirection = props.direction === "asc" ? "desc" : "asc";
  emit("update:direction", newDirection);
};
</script>

<style scoped lang="less">
.sort-button {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0px 8px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  border: 1px solid rgb(224, 224, 230);
  line-height: 34px;
  @media screen and (prefers-color-scheme: dark) {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: #0000;
  }

  .sort-icon-wrapper {
    display: flex;
    align-items: center;
    cursor: pointer;
  }
  &:hover {
    border-color: #36ad6a;
  }

  .sort-icon {
    transition: all 0.2s;

    &.asc {
      transform: rotate(180deg);
    }
    &:hover {
      color: #36ad6a;
    }
  }
}
</style>
