<!-- 首页 -->
<template>
  <div>
    <FileArea
      v-model="fileList"
      desc="请选择录播以及弹幕文件，如果为flv以及xml将自动转换为mp4以及ass"
    ></FileArea>

    <div class="center">
      <!-- <n-checkbox v-model:checked="options.checkSameFileFlag"> 是否检测同名文件 </n-checkbox> -->

      <n-button type="primary" @click="convert"> 立即转换 </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "Home",
});

import FileArea from "@renderer/components/FileArea.vue";

const fileList = ref<any[]>([]);

// const options = ref({
//   checkSameFileFlag: true,
// });

const convert = () => {
  if (fileList.value.length === 0) {
    return;
  }

  // console.log(JSON.parse(JSON.stringify(fileList.value[0])));
  window.api.convertVideo2Mp4(toRaw(fileList.value[0]));

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
