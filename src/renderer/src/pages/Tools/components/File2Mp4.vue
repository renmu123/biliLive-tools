<!-- 将文件转换为mp4 -->
<template>
  <div>
    <FileArea v-model="fileList" :extensions="['flv']" desc="请选择flv文件"></FileArea>

    <div class="center">
      <n-button type="primary" @click="convert"> 立即转换 </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import FileArea from "@renderer/components/FileArea.vue";
import type { File } from "../../../../../types";

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
    return;
  }

  // console.log(JSON.parse(JSON.stringify(fileList.value[0])));
  window.api.convertFile2Mp4(toRaw(fileList.value[0]));

  window.api.onTaskStart((_event, command) => {
    console.log("start", command);
  });
  window.api.onTaskEnd(() => {
    console.log("end");
  });
  window.api.onTaskError((_event, err) => {
    console.log("error", err);
  });

  window.api.onTaskProgressUpdate((_event, value) => {
    // console.log(value);
    // fileList.value[0].percentage = value;
    // const oldValue = Number(counter.innerText);
    // const newValue = oldValue + value;
    // counter.innerText = newValue;
  });
};
</script>

<style scoped></style>
