<!-- 将文件转换为mp4 -->
<template>
  <div>
    <FileArea v-model="fileList" :extensions="['flv']" desc="请选择flv文件"></FileArea>

    <div class="center" style="margin-top: 10px">
      <n-button type="primary" @click="convert"> 立即转换 </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import FileArea from "@renderer/components/FileArea.vue";
import type { File } from "../../../../../types";

const notice = useNotification();

const fileList = ref<
  (File & {
    percentage?: number;
  })[]
>([]);

// const options = ref({
//   checkSameFileFlag: true,
// });

const convert = () => {
  if (fileList.value.length === 0) {
    notice.error({
      title: `至少选择一个文件`,
      duration: 3000,
    });
    return;
  }

  notice.info({
    title: `开始执行任务`,
    duration: 3000,
  });
  // console.log(JSON.parse(JSON.stringify(fileList.value[0])));
  window.api.convertFile2Mp4(toRaw(fileList.value[0]));

  window.api.onTaskStart((_event, command) => {
    console.log("start", command);
    fileList.value[0].percentage = 0;
  });
  window.api.onTaskEnd(() => {
    console.log("end");
    fileList.value[0].percentage = 100;
  });
  window.api.onTaskError((_event, err) => {
    console.log("error", err);
  });

  window.api.onTaskProgressUpdate((_event, progress) => {
    fileList.value[0].percentage = progress.percentage;
  });
};
</script>

<style scoped></style>
