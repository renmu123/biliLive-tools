<!-- 将文件转换为mp4 -->
<template>
  <div>
    <FileArea v-model="fileList" accept="video/*"></FileArea>

    <div class="center">
      <!-- <n-checkbox v-model:checked="options.checkSameFileFlag"> 是否检测同名文件 </n-checkbox> -->

      <n-button type="primary" @click="convert"> 立即转换 </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import FileArea from "@renderer/components/FileArea.vue";
import type { UploadFileInfo } from "naive-ui";

const fileList = ref<UploadFileInfo[]>([]);

// const options = ref({
//   checkSameFileFlag: true,
// });

const convert = () => {
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
  // console.log(JSON.parse(JSON.stringify(fileList.value[0])));
  window.api.convertFile2Mp4(files[0]);

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
    console.log(value);

    // const oldValue = Number(counter.innerText);
    // const newValue = oldValue + value;
    // counter.innerText = newValue;
  });
};
</script>

<style scoped></style>
