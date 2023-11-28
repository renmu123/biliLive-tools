<!-- eslint-disable vue/no-v-html -->
<template>
  <n-popover trigger="hover">
    <template #trigger>
      <n-icon :size="props.size" class="pointer"> <HelpCircleOutline /> </n-icon>
    </template>
    <span v-html="props.tip"></span>
  </n-popover>
</template>

<script setup lang="ts">
import { HelpCircleOutline } from "@vicons/ionicons5";

interface Props {
  size?: number;
  tip: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 18,
  tip: "",
});
</script>

<style scoped></style>
