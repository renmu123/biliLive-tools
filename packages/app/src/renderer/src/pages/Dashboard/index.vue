<template>
  <h1 class="center">已运行{{ formatTime(now - appStartTime) }}</h1>
</template>

<script setup lang="ts">
import { commonApi } from "@renderer/apis";

defineOptions({
  name: "Dashboard",
});
const appStartTime = ref(0);

const getTime = async () => {
  const time = await commonApi.appStartTime();
  appStartTime.value = time;
};

const now = ref(Date.now());

const formatTime = (time: number) => {
  const seconds = Math.floor((time / 1000) % 60);
  const minutes = Math.floor((time / 1000 / 60) % 60);
  const hours = Math.floor((time / 1000 / 60 / 60) % 24);
  return `${hours}小时${minutes}分钟${seconds}秒`;
};

let intervalId: NodeJS.Timeout | null = null;
const createInterval = () => {
  if (intervalId) return;
  const interval = window.isWeb ? 1000 : 1000;
  intervalId = setInterval(() => {
    now.value = Date.now();
  }, interval);
};
function cleanInterval() {
  intervalId && clearInterval(intervalId);
  intervalId = null;
}

onDeactivated(() => {
  cleanInterval();
});

onActivated(() => {
  getTime();
  createInterval();
});
</script>

<style scoped lang="less">
.center {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
