<template>
  <n-modal v-model:show="showModal" transform-origin="center" :auto-focus="false">
    <n-card style="width: 800px" :bordered="false">
      <template #header>
        <span>日志</span>
        <span
          style="color: skyblue; font-size: 12px; margin-left: 10px; cursor: pointer"
          @click="exportLogFile"
          :disabled="exporting"
          >{{ exporting ? "导出中..." : "导出" }}</span
        >
      </template>
      <n-spin :show="loading" :delay="200">
        <n-virtual-list
          style="height: calc(100vh - 200px)"
          :item-size="20"
          :items="logs"
          item-resizable
          ref="logInst"
        >
          <template #default="{ item, index }">
            <div :key="index" class="item">
              {{ item.message }}
            </div>
          </template>
        </n-virtual-list>
      </n-spin>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { exportLogs, getLogContent } from "@renderer/apis/common";
import { saveAs } from "file-saver";

import type { VirtualListInst } from "naive-ui";

const showModal = defineModel<boolean>("visible", { required: true, default: false });
const loading = ref(false);
const exporting = ref(false);
let exportingTimer: NodeJS.Timeout | null = null;

const logs = ref<
  {
    value: number;
    key: number;
    message: string;
  }[]
>([]);
const logInst = ref<null | VirtualListInst>(null);

// let eventSource: EventSource | null = null;

// async function streamLogs() {
//   eventSource = await getStreamLogs();

//   eventSource.onmessage = function (event) {
//     logs.value += event.data;
//     nextTick(() => {
//       logInst.value?.scrollTo({ position: "bottom", silent: true });
//     });
//   };

//   eventSource.onerror = function () {
//     logs.value = "";
//   };
// }

const setExporting = (value: boolean) => {
  if (exportingTimer) {
    clearTimeout(exportingTimer);
  }
  if (value) {
    exportingTimer = setTimeout(() => {
      exporting.value = true;
    }, 200);
  } else {
    exporting.value = false;
  }
};

const getLog = async () => {
  loading.value = true;
  try {
    const content = await getLogContent();
    logs.value = content.split("\n").map((item, index) => {
      return {
        value: index,
        key: index,
        message: item,
      };
    });

    nextTick(() => {
      logInst.value?.scrollTo({
        index: logs.value?.at(-1)?.key,
      });
    });
  } finally {
    loading.value = false;
  }
};

watch(
  () => showModal.value,
  (value) => {
    if (value) {
      getLog();
    } else {
      logs.value = [];
      // eventSource?.close();
    }
  },
);

const exportLogFile = async () => {
  if (exporting.value) return;

  setExporting(true);

  try {
    // 导出文件
    const blob = await exportLogs();
    saveAs(blob, "main.log");
  } catch (error) {
    console.error(error);
  } finally {
    setExporting(false);
  }
};
</script>

<style scoped lang="less">
.item {
  white-space: pre;
}

span[disabled="true"] {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
