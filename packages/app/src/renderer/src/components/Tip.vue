<!-- eslint-disable vue/no-v-html -->
<template>
  <n-popover trigger="hover">
    <template #trigger>
      <span style="display: inline-flex">
        {{ props.text
        }}<n-icon :size="props.size" style="cursor: help"> <HelpCircleOutline /> </n-icon>
      </span>
    </template>
    <span v-if="props.tip" v-html="props.tip"></span>
    <slot v-else></slot>
  </n-popover>
</template>

<script setup lang="ts">
import { HelpCircleOutline } from "@vicons/ionicons5";

interface Props {
  size?: number;
  tip?: string;
  text?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 18,
  tip: "",
});
</script>

<style scoped></style>
