<template>
  <n-upload
    v-model:file-list="fileList"
    multiple
    :default-upload="false"
    :accept="props.accept"
    @change="handleFileChange"
  >
    <n-upload-dragger>
      <div style="margin-bottom: 12px">
        <n-icon size="48" :depth="3">
          <archive-icon />
        </n-icon>
      </div>
      <n-text style="font-size: 16px"> 点击文件到该区域来上传 </n-text>
      <n-p v-if="desc" depth="3" style="margin: 8px 0 0 0">
        {{ desc }}
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
  desc?: string;
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
