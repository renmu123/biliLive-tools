<template>
  <div class="">
    <n-form label-placement="left" :label-width="150">
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 保存文件夹 </span>
        </template>
        <n-input v-model:value="config.video.subSavePath" placeholder="请选择要保存的文件夹" />
        <n-icon style="margin-left: 10px" size="26" class="pointer" @click="selectFolder">
          <FolderOpenOutline />
        </n-icon>
      </n-form-item>
      <n-form-item>
        <template #label> 检查间隔 </template>
        <n-input-number v-model:value="config.video.subCheckInterval" min="0" step="30">
          <template #suffix>分钟</template>
        </n-input-number>
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { showDirectoryDialog } from "@renderer/utils/fileSystem";
import { FolderOpenOutline } from "@vicons/ionicons5";

import type { AppConfig } from "@biliLive-tools/types";

const config = defineModel<AppConfig>("data", {
  default: () => {},
});

const selectFolder = async () => {
  let file: string | undefined = await showDirectoryDialog({
    defaultPath: config.value.webhook.recoderFolder,
  });

  if (!file) return;
  config.value.recorder.savePath = file;
};
</script>

<style scoped lang="less">
.item {
  display: flex;
}
</style>
