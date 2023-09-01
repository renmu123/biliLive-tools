<template>
  <div>dasdasdasda</div>
</template>

<script setup lang="ts">
// import type { DanmuConfig } from "@/types";
const config = ref({});

onMounted(async () => {
  config.value = await window.api.getDanmuConfig();
  console.log(config.value);
});
</script>

<style scoped></style>
