<!-- 将文件转换为mp4 -->
<template>
  <div>
    <FileArea v-model="fileList" accept="application/xml"></FileArea>

    <div class="center">
      <n-button type="primary" @click="convert"> 立即转换 </n-button>
    </div>
    <DanmuFactorySettingDailog v-model="show"></DanmuFactorySettingDailog>
  </div>
</template>

<script setup lang="ts">
import FileArea from "@renderer/components/FileArea.vue";
import DanmuFactorySettingDailog from "@renderer/components/DanmuFactorySettingDailog.vue";
import type { UploadFileInfo } from "naive-ui";

const fileList = ref<UploadFileInfo[]>([]);

// const options = ref({
//   checkSameFileFlag: true,
// });

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

  // console.log(files);

  const result = await window.api.convertDanmu2Ass(files);
  // return res;
  console.log(result);
};

const show = ref(true);
</script>

<style scoped></style>
