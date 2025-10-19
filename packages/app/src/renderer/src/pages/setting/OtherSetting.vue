<template>
  <div class="">
    <n-form label-placement="left" :label-width="150">
      <!-- <n-form-item>
        <template #label>
          <span class="inline-flex"> 保存文件夹 </span>
        </template>
        <n-input v-model:value="config.video.subSavePath" placeholder="请选择要保存的文件夹" />
        <n-icon style="margin-left: 10px" size="26" class="pointer" @click="selectFolder">
          <FolderOpenOutline />
        </n-icon>
      </n-form-item> -->
      <n-form-item>
        <template #label>
          <Tip
            text="录制页面额外请求"
            tip="进入录制页面时不再额外请求查询接口，减少风控可能，关闭后未监听的直播间无法获取封面等相关信息"
          ></Tip>
        </template>
        <n-switch v-model:value="config.requestInfoForRecord" />
      </n-form-item>
      <n-form-item v-if="!isWeb">
        <template #label>
          <Tip text="切片独立窗口" tip="客户端使用子窗口打开切片页面"></Tip>
        </template>
        <n-switch v-model:value="config.cutPageInNewWindow" />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import type { AppConfig } from "@biliLive-tools/types";

const config = defineModel<AppConfig>("data", {
  default: () => {},
});
const isWeb = computed(() => window.isWeb);
</script>

<style scoped lang="less">
.item {
  display: flex;
}
</style>
