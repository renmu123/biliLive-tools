<!-- 首页 -->
<template>
  <div>
    <n-upload
      v-model:file-list="fileList"
      multiple
      :default-upload="false"
      @change="handleFileChange"
      @remove="handleFileRemove"
    >
      <n-upload-dragger>
        <div style="margin-bottom: 12px">
          <n-icon size="48" :depth="3">
            <archive-icon />
          </n-icon>
        </div>
        <n-text style="font-size: 16px"> 点击或者拖动文件到该区域来上传 </n-text>
        <n-p depth="3" style="margin: 8px 0 0 0">
          请选择录播以及弹幕文件，如果为flv以及xml将自动转换为mp4以及ass
        </n-p>
      </n-upload-dragger>
    </n-upload>
    <div class="center">
      <n-checkbox v-model:checked="checkSameFileFlag"> 是否检测同名文件 </n-checkbox>
    </div>
    <!-- <n-button>Default</n-button> -->
  </div>
</template>

<script setup lang="ts">
import { ArchiveOutline as ArchiveIcon } from "@vicons/ionicons5";
import { UploadFileInfo } from "naive-ui";

const fileList = ref<UploadFileInfo[]>([]);
const handleFileChange = (data: { fileList: UploadFileInfo[] }) => {
  fileList.value = data.fileList;
  console.log("pp", window.electron, window.api);
};
const handleFileRemove = (data: { file: UploadFileInfo; fileList: UploadFileInfo[] }) => {
  console.log(data);
  return true;
};

const checkSameFileFlag = ref(true);
</script>

<style scoped></style>
