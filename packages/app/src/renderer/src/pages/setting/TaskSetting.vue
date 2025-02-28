<template>
  <div class="">
    <h2>并发处理数<Tip :tip="`-1为无限`"></Tip></h2>
    <n-form label-placement="left" :label-width="140">
      <n-form-item>
        <template #label>
          <span class="inline-flex"> ffmpeg任务 </span>
        </template>
        <n-input-number v-model:value="config.task.ffmpegMaxNum" min="-1" max="65535">
        </n-input-number>
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 斗鱼下载</span>
        </template>
        <n-input-number v-model:value="config.task.douyuDownloadMaxNum" min="-1" max="65535">
        </n-input-number>
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> Bilibili上传 </span>
        </template>
        <n-input-number v-model:value="config.task.biliUploadMaxNum" min="-1" max="65535">
        </n-input-number>
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> Bilibili下载 </span>
        </template>
        <n-input-number v-model:value="config.task.biliDownloadMaxNum" min="-1" max="65535">
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
