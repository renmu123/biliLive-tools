<template>
  <div class="">
    <h2>Bilibili上传配置</h2>
    <n-form label-placement="left" :label-width="140">
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 线路 </span>
        </template>
        <n-input-number v-model:value="config.task.ffmpegMaxNum" min="-1" max="65535">
        </n-input-number>
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 上传重试次数 </span>
        </template>
        <n-input-number v-model:value="config.task.douyuDownloadMaxNum" min="-1" max="65535">
        </n-input-number>
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 重试延迟 </span>
        </template>
        <n-input-number v-model:value="config.task.douyuDownloadMaxNum" min="-1" max="65535">
        </n-input-number>
      </n-form-item>
    </n-form>
  </div>
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
