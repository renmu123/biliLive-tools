<template>
  <h1 class="center">已运行{{ formatTime(now - appStartTime) }}</h1>
</template>

<script setup lang="ts">
import { commonApi } from "@renderer/apis";

const appStartTime = ref(0);

const getTime = async () => {
  const time = await commonApi.appStartTime();
  appStartTime.value = time;
};

getTime();

const now = ref(Date.now());
setInterval(() => {
  now.value = Date.now();
}, 1000);

const formatTime = (time: number) => {
  const seconds = Math.floor((time / 1000) % 60);
  const minutes = Math.floor((time / 1000 / 60) % 60);
  const hours = Math.floor((time / 1000 / 60 / 60) % 24);
  return `${hours}小时${minutes}分钟${seconds}秒`;
};
</script>

<style scoped lang="less">
.center {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
