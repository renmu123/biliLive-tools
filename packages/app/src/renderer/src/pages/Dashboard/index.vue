<template>
  <div class="center">
    <h1>已运行{{ formatTime(now - appStartTime) }}</h1>

    <n-button type="primary" @click="handleWebhook">Webhook卡住不能上传？点我试试</n-button>

    <n-button type="primary" @click="whyUploadFailed">为什么webhook里的xx不能工作？</n-button>
  </div>
</template>

<script setup lang="ts">
import { commonApi } from "@renderer/apis";
import { useConfirm } from "@renderer/hooks";

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

const confirm = useConfirm();
const notice = useNotice();
const handleWebhook = async () => {
  const res = await commonApi.testWebhook();
  if (res.length === 0) {
    notice.warning("没有发现问题");
    return false;
  }
  const list = res.map((item) => `${item.file}`).join("\n");

  const [status] = await confirm.warning({
    title: "以下数据存在问题，是否处理，以下数据将会被认为是错误数据，请手动处理？",
    content: `${list}`,
  });
  if (!status) return false;
  await commonApi.handleWebhook(res);
  notice.success("处理成功");
  return true;
};

const whyUploadFailed = async () => {
  const res = await commonApi.whyUploadFailed("1233");
  console.log(res);
};
</script>

<style scoped lang="less">
.center {
  text-align: center;
}
</style>
