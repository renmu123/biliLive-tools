<template>
  <n-modal v-model:show="showModal" transform-origin="center" :auto-focus="false">
    <n-card style="width: 800px" title="日志" :bordered="false">
      <n-log ref="logInst" style="height: calc(100vh - 200px)" :rows="40" :log="logs"> </n-log>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { getStreamLogs } from "@renderer/apis/common";

import type { LogInst } from "naive-ui";

const showModal = defineModel<boolean>("visible", { required: true, default: false });

const logs = ref("");
const logInst = ref<LogInst | null>(null);

let eventSource: EventSource | null = null;

async function streamLogs() {
  eventSource = await getStreamLogs();

  eventSource.onmessage = function (event) {
    logs.value += event.data;
    nextTick(() => {
      logInst.value?.scrollTo({ position: "bottom", silent: true });
    });
  };

  eventSource.onerror = function () {
    logs.value = "";
  };
}
watch(
  () => showModal.value,
  (value) => {
    if (value) {
      streamLogs();
    } else {
      logs.value = "";
      eventSource?.close();
    }
  },
);
</script>

<style scoped lang="less"></style>
