<!-- 将文件转换为mp4 -->
<template>
  <div>
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
        <n-checkbox v-model:checked="clientOptions.removeCompletedTask">
          移除已完成任务
        </n-checkbox>
        <n-checkbox v-model:checked="clientOptions.openTargetDirectory">
          移除已完成任务
        </n-checkbox>
      </div>
    </div>

    <div class="center" style="margin-top: 10px">
      <n-button type="primary" @click="convert"> 立即转换 </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import FileArea from "@renderer/components/FileArea.vue";
import type { File, DanmuOptions } from "../../../../../types";

const notice = useNotification();

const fileList = ref<
  (File & {
    percentage?: number;
    percentageStatus?: "success" | "info" | "error";
  })[]
>([]);

const options = ref<DanmuOptions>({
  saveRadio: 1, // 1：保存到原始文件夹，2：保存到特定文件夹
  saveOriginPath: true,
  savePath: "",

  override: false, // 覆盖文件
  removeOrigin: false, // 完成后移除源文件
});
const clientOptions = ref({
  removeCompletedTask: true, // 移除已完成任务
  openTargetDirectory: true, // 转换完成后打开目标文件夹
});

const convert = async () => {
  if (fileList.value.length === 0) {
    notice.error({
      title: `至少选择一个文件`,
      duration: 3000,
    });
    return;
  }

  notice.info({
    title: `检测到${fileList.value.length}个任务，开始转换`,
    duration: 3000,
  });

  for (let i = 0; i < fileList.value.length; i++) {
    await createTask(i);
  }
  notice.success({
    title: `转换完成`,
    duration: 3000,
  });
  if (clientOptions.value.removeCompletedTask) {
    fileList.value = fileList.value.filter((item) => item.percentageStatus !== "success");
  }
};

const createTask = async (index: number) => {
  return new Promise((resolve) => {
    const i = index;

    window.api.convertVideo2Mp4(toRaw(fileList.value[i]), toRaw(options.value));

    window.api.onTaskStart((_event, command) => {
      console.log("start", command, index);
      fileList.value[i].percentage = 0;
      fileList.value[i].percentageStatus = "info";
    });
    window.api.onTaskEnd(() => {
      fileList.value[i].percentage = 100;
      fileList.value[i].percentageStatus = "success";
      resolve(true);
    });
    window.api.onTaskError((_event, err) => {
      fileList.value[i].percentageStatus = "error";
      notice.error({
        title: `转换失败：\n${err}`,
      });
      resolve(true);
    });

    window.api.onTaskProgressUpdate((_event, progress) => {
      console.log(progress);

      fileList.value[i].percentage = progress.percentage;
    });
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
