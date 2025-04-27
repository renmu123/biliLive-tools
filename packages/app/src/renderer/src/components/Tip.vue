<!-- eslint-disable vue/no-v-html -->
<template>
  <n-popover trigger="hover" :placement="placement">
    <template #trigger>
      <span style="display: inline-flex; cursor: help">
        {{ props.text }}<n-icon :size="props.size"> <HelpCircleOutline /> </n-icon>
      </span>
    </template>
    <span v-if="props.tip" v-html="props.tip"></span>
    <slot v-else></slot>
  </n-popover>
</template>

<script setup lang="ts">
import { HelpCircleOutline } from "@vicons/ionicons5";

type Placement =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-start"
  | "top-end"
  | "left-start"
  | "left-end"
  | "right-start"
  | "right-end"
  | "bottom-start"
  | "bottom-end";

interface Props {
  size?: number;
  tip?: string;
  text?: string;
  placement?: Placement;
}

const props = withDefaults(defineProps<Props>(), {
  size: 18,
  tip: "",
});
</script>

<style scoped></style>
