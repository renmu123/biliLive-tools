<!-- 将文件转换为mp4 -->
<template>
  <div>
    <FileArea
      v-model="fileList"
      :extensions="['xml']"
      desc="请选择xml文件"
      :is-in-progress="isInProgress"
    ></FileArea>

    <div class="flex align-center column" style="margin-top: 10px">
      <div>
        <n-radio-group v-model:value="options.saveRadio" class="radio-group">
          <n-space class="flex align-center column">
            <n-radio :value="1"> 保存到原始文件夹 </n-radio>
            <n-radio :value="2">
              <n-input v-model:value="options.savePath" type="text" placeholder="选择文件夹" />
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
          完成后移除任务
        </n-checkbox>
        <n-checkbox v-model:checked="clientOptions.openTargetDirectory">
          完成后打开文件夹
        </n-checkbox>
      </div>

      <div class="flex justify-center" style="margin-top: 20px">
        <n-button type="primary" @click="convert"> 立即转换 </n-button>
        <n-icon size="30" class="pointer" style="margin-left: 10px" @click="openSetting">
          <SettingIcon />
        </n-icon>
      </div>
    </div>
    <DanmuFactorySettingDailog v-model="show"></DanmuFactorySettingDailog>
  </div>
</template>

<script setup lang="ts">
import FileArea from "@renderer/components/FileArea.vue";
import DanmuFactorySettingDailog from "@renderer/components/DanmuFactorySettingDailog.vue";
import type { DanmuOptions, File } from "../../../../../types";

import { Settings as SettingIcon } from "@vicons/ionicons5";

const notice = useNotification();

const fileList = ref<
  (File & {
    percentage?: number;
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
const isInProgress = ref(false);

const convert = async () => {
  if (fileList.value.length === 0) {
    notice.error({
      title: `至少选择一个文件`,
      duration: 3000,
    });
    return;
  }
  isInProgress.value = true;
  notice.info({
    title: `检测到${fileList.value.length}个任务，开始转换`,
    duration: 3000,
  });
  try {
    const result = await window.api.convertDanmu2Ass(toRaw(fileList.value), toRaw(options.value));
    const successResult = result.filter((item) => item.status === "success");

    notice.info({
      title: `${successResult.length}个任务成功，${
        result.filter((item) => item.status === "error").length
      }个任务失败`,
      duration: 3000,
    });
    console.log(result);

    if (clientOptions.value.openTargetDirectory) {
      if (options.value.saveRadio === 2) {
        window.api.openPath(toRaw(options.value).savePath);
      } else {
        window.api.openPath(toRaw(fileList.value[0]).dir);
      }
    }

    if (clientOptions.value.removeCompletedTask) {
      fileList.value = fileList.value.filter(
        (item) => !successResult.map((item2) => item2.path).includes(item.path),
      );
    }
  } finally {
    isInProgress.value = false;
  }
};

const show = ref(false);
const openSetting = () => {
  show.value = true;
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
