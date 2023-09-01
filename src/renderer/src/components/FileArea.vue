<template>
  <n-upload
    v-model:file-list="fileList"
    multiple
    :default-upload="false"
    @change="handleFileChange"
    :accept="props.accept"
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
</template>

<script setup lang="ts">
import { ArchiveOutline as ArchiveIcon } from "@vicons/ionicons5";
import type { UploadFileInfo } from "naive-ui";
// import { defineModel } from "vue";

const props = defineProps<{
  accept?: string;
}>();
const emits = defineEmits<{
  change: any[];
}>();

const fileList = defineModel<UploadFileInfo[]>({ required: true });

const handleFileChange = (data: { fileList: UploadFileInfo[] }) => {
  fileList.value = data.fileList;
  emits("change", data.fileList);
};
</script>

<style scoped></style>
