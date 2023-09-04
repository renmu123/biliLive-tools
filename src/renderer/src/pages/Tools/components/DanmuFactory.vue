<!-- 将文件转换为mp4 -->
<template>
  <div>
    <FileArea v-model="fileList" accept="application/xml"></FileArea>

    <div class="flex align-center column">
      <div>
        <n-radio-group v-model:value="options.saveRadio">
          <n-space>
            <n-radio :value="1"> 保存到原始文件夹 </n-radio>
            <n-radio :value="2"> 保存到特定文件夹 </n-radio>
          </n-space>
        </n-radio-group>
      </div>
      <div>
        <n-radio-group v-model:value="options.override">
          <n-space>
            <n-radio :value="true"> 覆盖文件 </n-radio>
            <n-radio :value="false"> 跳过存在文件 </n-radio>
          </n-space>
        </n-radio-group>
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
import type { UploadFileInfo } from "naive-ui";
import { Settings as SettingIcon } from "@vicons/ionicons5";

const fileList = ref<UploadFileInfo[]>([]);

// TODO: 配置项
// 保存到原始文件夹，保存到特定文件夹，覆盖文件，跳过已存在的文件

const options = ref({
  saveRadio: 1, // 1：保存到原始文件夹，2：保存到特定文件夹
  saveOriginPath: true,
  savePath: "",

  override: false,
});

const convert = async () => {
  if (fileList.value.length === 0) {
    return;
  }
  const files = fileList.value.map((item) => {
    const file = item.file!;
    return {
      name: file.name,
      path: file.path,
    };
  });

  const result = await window.api.convertDanmu2Ass(files);
  // return res;
  console.log(result);
};

const show = ref(false);
const openSetting = () => {
  show.value = true;
};
</script>

<style scoped></style>
