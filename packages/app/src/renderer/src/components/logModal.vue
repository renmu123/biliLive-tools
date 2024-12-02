<template>
  <n-modal v-model:show="showModal" transform-origin="center" :auto-focus="false">
    <n-card style="width: 800px" :bordered="false">
      <template #header>
        <span>日志</span>
        <span
          style="color: skyblue; font-size: 12px; margin-left: 10px; cursor: pointer"
          @click="exportLogFile"
          >导出</span
        >
      </template>
      <n-log ref="logInst" style="height: calc(100vh - 200px)" :rows="40" :log="logs"> </n-log>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { getStreamLogs, exportLogs } from "@renderer/apis/common";
import { saveAs } from "file-saver";

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

const exportLogFile = async () => {
  // 导出文件
  const blob = await exportLogs();
  saveAs(blob, "main.log");
};
</script>

<style scoped lang="less"></style>
