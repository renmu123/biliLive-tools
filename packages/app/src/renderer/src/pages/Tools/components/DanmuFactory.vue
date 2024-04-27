<!-- 将文件转换为mp4 -->
<template>
  <div>
    <div class="flex justify-center align-center" style="margin-bottom: 20px; gap: 10px">
      <n-button @click="addVideo"> 添加文件 </n-button>
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

    <FileSelect
      v-model="fileList"
      area-placeholder="请选择xml文件"
      :extensions="['xml']"
      :sort="false"
    ></FileSelect>

    <div class="flex align-center column" style="margin-top: 10px">
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
          <n-icon size="30" style="margin-left: -10px" class="pointer" @click="getDir">
            <FolderOpenOutline />
          </n-icon>
        </n-space>
      </n-radio-group>
      <div style="margin-top: 10px">
        <n-checkbox v-model:checked="options.removeOrigin"> 完成后移除源文件 </n-checkbox>

        <n-checkbox v-model:checked="options.openFolder"> 完成后打开文件夹 </n-checkbox>
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

import FileSelect from "@renderer/pages/Tools/components/FileUpload/components/FileSelect.vue";
import DanmuFactorySettingDailog from "@renderer/components/DanmuFactorySettingDailog.vue";
import { deepRaw } from "@renderer/utils";
import { useDanmuPreset, useAppConfig } from "@renderer/stores";
import { Settings as SettingIcon, FolderOpenOutline } from "@vicons/ionicons5";

const { danmuPresetsOptions, danmuPresetId } = storeToRefs(useDanmuPreset());
const { appConfig } = storeToRefs(useAppConfig());

const notice = useNotification();

const fileList = ref<{ id: string; title: string; path: string; visible: boolean }[]>([]);

const options = appConfig.value.tool.danmu;

const convert = async () => {
  if (fileList.value.length === 0) {
    notice.error({
      title: `至少选择一个文件`,
      duration: 1000,
    });
    return;
  }
  const presetId = danmuPresetId.value;
  notice.info({
    title: `生成${fileList.value.length}个任务，可在任务列表中查看进度`,
    duration: 1000,
  });
  const files = fileList.value.map((file) => {
    return { input: file.path };
  });
  const config = (await window.api.danmu.getPreset(presetId)).config;
  await window.api.danmu.convertXml2Ass(files, config, deepRaw(options));
  const dir = window.api.formatFile(deepRaw(fileList.value[0]).path).dir;
  fileList.value = [];

  if (options.openFolder) {
    if (options.saveRadio === 2) {
      window.api.openPath(deepRaw(options).savePath as string);
    } else {
      window.api.openPath(dir);
    }
  }
};

const show = ref(false);
const openSetting = () => {
  show.value = true;
};

async function getDir() {
  const path = await window.api.openDirectory();
  if (!path) return;
  options.savePath = path;
}

const fileSelect = ref(null);
const addVideo = async () => {
  // @ts-ignore
  fileSelect.value.select();
};
</script>

<style scoped lang="less">
.radio-group {
  :deep(.n-radio) {
    align-items: center;
  }
}
</style>
