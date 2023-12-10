<!-- 将文件转换为mp4 -->
<template>
  <div>
    <div class="flex justify-center align-center" style="margin-bottom: 20px; gap: 10px">
      <n-button type="primary" @click="convert"> 立即转换 </n-button>
      <n-select
        v-model:value="danmuPresetId"
        :options="danmuPresetsOptions"
        placeholder="选择预设"
        style="width: 140px"
      />
      <n-icon size="25" class="pointer" @click="openSetting">
        <SettingIcon />
      </n-icon>
    </div>

    <FileArea v-model="fileList" :extensions="['xml']" desc="请选择xml文件"></FileArea>

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
        <n-checkbox v-model:checked="options.removeOrigin"> 完成后移除源文件 </n-checkbox>

        <n-checkbox v-model:checked="clientOptions.openTargetDirectory">
          完成后打开文件夹
        </n-checkbox>
      </div>
    </div>
    <DanmuFactorySettingDailog
      v-model:visible="show"
      v-model="danmuPresetId"
    ></DanmuFactorySettingDailog>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";

import FileArea from "@renderer/components/FileArea.vue";
import DanmuFactorySettingDailog from "@renderer/components/DanmuFactorySettingDailog.vue";
import type { DanmuOptions, File } from "../../../../../types";
import { deepRaw } from "@renderer/utils";
import { useDanmuPreset } from "@renderer/stores";
import { Settings as SettingIcon } from "@vicons/ionicons5";

const { danmuPresetsOptions, danmuPresetId } = storeToRefs(useDanmuPreset());

const notice = useNotification();

const fileList = ref<
  (File & {
    percentage?: number;
  })[]
>([]);

const options = ref<DanmuOptions>({
  saveRadio: 1, // 1：保存到原始文件夹，2：保存到特定文件夹
  savePath: "",

  removeOrigin: false, // 完成后移除源文件
});
const clientOptions = ref({
  openTargetDirectory: false, // 转换完成后打开目标文件夹
});

const convert = async () => {
  const presetId = danmuPresetId.value;
  if (fileList.value.length === 0) {
    notice.error({
      title: `至少选择一个文件`,
      duration: 3000,
    });
    return;
  }
  notice.info({
    title: `检测到${fileList.value.length}个任务，可在任务列表中查看进度`,
    duration: 3000,
  });
  const files = fileList.value.map((file) => {
    return { input: file.path };
  });
  window.api.danmu.convertDanmu2Ass(files, presetId, deepRaw(options.value));
  fileList.value = [];

  if (clientOptions.value.openTargetDirectory) {
    if (options.value.saveRadio === 2) {
      window.api.openPath(deepRaw(options.value).savePath as string);
    } else {
      window.api.openPath(deepRaw(fileList.value[0]).dir);
    }
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
