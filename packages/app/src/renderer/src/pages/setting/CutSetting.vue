<template>
  <n-form label-placement="left" :label-width="150">
    <n-form-item>
      <template #label>
        <Tip text="自动保存" tip="在进行操作之后，自动保存项目文件"></Tip>
      </template>
      <n-switch v-model:value="config.videoCut.autoSave" />
    </n-form-item>
    <n-form-item>
      <template #label>
        <Tip text="缓存波形图数据" tip="缓存波形图数据，避免每次重新计算波形图"></Tip>
      </template>
      <n-switch v-model:value="config.videoCut.cacheWaveform" />
    </n-form-item>
  </n-form>
</template>

<script setup lang="ts">
import type { AppConfig } from "@biliLive-tools/types";

const config = defineModel<AppConfig>("data", {
  default: () => {},
});
</script>

<style scoped lang="less">
.item {
  display: flex;
}
</style>
