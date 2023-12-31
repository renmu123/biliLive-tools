<!-- 将文件转换为mp4 -->
<template>
  <div>
    <div class="center" style="margin-bottom: 20px">
      <n-button type="primary" @click="convert"> 立即转换 </n-button>
    </div>
    <FileArea v-model="fileList" :extensions="['flv']" desc="请选择flv文件"></FileArea>

    <div class="flex align-center column" style="margin-top: 10px">
      <div>
        <n-radio-group v-model:value="options.saveRadio" class="radio-group">
          <n-space class="flex align-center column">
            <n-radio :value="1"> 保存到原始文件夹 </n-radio>
            <n-radio :value="2">
              <n-input
                v-model:value="options.savePath"
                type="text"
                placeholder="选择文件夹"
                style="width: 300px"
              />
            </n-radio>
            <n-button type="primary" :disabled="options.saveRadio !== 2" @click="getDir">
              选择文件夹
            </n-button>
          </n-space>
        </n-radio-group>
      </div>
      <div style="margin-top: 10px">
        <n-radio-group v-model:value="options.override">
          <n-space>
            <n-radio :value="true"> 覆盖文件 </n-radio>
            <n-radio :value="false"> 跳过存在文件 </n-radio>
          </n-space>
        </n-radio-group>
        <n-checkbox v-model:checked="options.removeOrigin"> 完成后移除源文件 </n-checkbox>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FileArea from "@renderer/components/FileArea.vue";
import { useConfirm } from "@renderer/hooks";
import type { File, Video2Mp4Options } from "../../../../../types";

const notice = useNotification();
const confirm = useConfirm();

const fileList = ref<
  (File & {
    percentage?: number;
    percentageStatus?: "success" | "info" | "error";
    taskId?: string;
  })[]
>([]);

const options = ref<Video2Mp4Options>({
  saveRadio: 1, // 1：保存到原始文件夹，2：保存到特定文件夹
  saveOriginPath: true,
  savePath: "",

  override: false, // 覆盖文件
  removeOrigin: false, // 完成后移除源文件
});

const convert = async () => {
  if (fileList.value.length === 0) {
    notice.error({
      title: `至少选择一个文件`,
      duration: 3000,
    });
    return;
  }
  const status = await confirm.warning({
    content: "转封装增加大量 CPU 占用以及硬盘 IO，请耐心等待",
  });
  if (!status) return;

  for (let i = 0; i < fileList.value.length; i++) {
    try {
      window.api.convertVideo2Mp4(toRaw(fileList.value[i]), toRaw(options.value));
    } catch (err) {
      notice.error({
        title: err as string,
        duration: 3000,
      });
    }
  }
  fileList.value = [];
  notice.warning({
    title: `已加入任务队列，可在任务列表中查看进度`,
    duration: 3000,
  });
};

async function getDir() {
  const path = await window.api.openDirectory();
  options.value.savePath = path;
}
</script>

<style scoped lang="less">
.radio-group {
  :deep(.n-radio) {
    align-items: center;
  }
}
</style>
