<template>
  <div class="container">
    <div style="display: flex; align-items: center">
      <n-select
        v-model:value="store.params.type"
        :options="typeOptions"
        style="width: 140px; margin-right: 10px"
        size="small"
      />
      <n-checkbox-group v-model:value="selectedStatus">
        <n-checkbox value="pending">未开始</n-checkbox>
        <n-checkbox value="running">运行中</n-checkbox>
        <n-checkbox value="paused">已暂停</n-checkbox>
        <n-checkbox value="completed">已完成</n-checkbox>
        <n-checkbox value="error">错误</n-checkbox>
        <n-checkbox value="canceled">已取消</n-checkbox>
      </n-checkbox-group>

      <div style="margin-left: auto; display: flex; gap: 10px">
        <n-button v-if="queue.length !== 0" size="small" type="primary" @click="handlePauseTasks"
          >暂停全部</n-button
        >
        <n-button v-if="queue.length !== 0" size="small" type="error" @click="handleRemoveEndTasks"
          >清除记录</n-button
        >
      </div>
    </div>
    <template v-if="displayQueue.length !== 0">
      <div v-for="item in displayQueue" :key="item.taskId" class="item">
        <Item
          :item="item"
          :show-progress="item.children ? false : true"
          :show-info="item.children ? false : true"
        />
        <template v-if="item.children">
          <div v-for="child in item.children" :key="child.taskId" class="sub-item">
            <Item :item="child" />
          </div>
        </template>
      </div>
    </template>
    <template v-else>
      <h2>暂无任务，快去添加一个试试吧</h2>
    </template>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "Queue",
});
import Item from "./components/item.vue";
import { useQueueStore } from "@renderer/stores";
import { deepRaw } from "@renderer/utils";
import { taskApi } from "@renderer/apis";
import { TaskType } from "@biliLive-tools/shared/enum.js";

import type { Task } from "@renderer/types";

const notice = useNotification();
const store = useQueueStore();

const queue = computed(() => store.queue);

const groupByPid = (data: Task[]) => {
  // 如果有pid对应得taskid，那么将这项加入到pid对应的task得children中
  const list: Task[] = deepRaw(data);

  for (const item of list) {
    if (item.pid) {
      const result = list.find((i) => i.taskId === item.pid);
      if (result) {
        if (result.children) {
          result.children.push(item);
        } else {
          result.children = [item];
        }
      }
    }
  }
  return list.filter((item) => !item.pid);
};

const displayQueue = computed(() => {
  const filterData = queue.value.filter((item) => selectedStatus.value.includes(item.status));
  const data = groupByPid(filterData);
  return data;
});

const typeOptions = ref([
  {
    value: "",
    label: "全部",
  },
  {
    value: TaskType.ffmpeg,
    label: "FFmpeg处理",
  },
  {
    value: TaskType.bili,
    label: "B站上传",
  },
  {
    value: TaskType.biliUpload,
    label: "B站分P上传",
  },
  {
    value: TaskType.danmu,
    label: "弹幕转换",
  },
  {
    value: TaskType.biliDownload,
    label: "B站视频下载",
  },
  {
    value: TaskType.douyuDownload,
    label: "斗鱼视频下载",
  },
]);

const selectedStatus = ref<string[]>([
  "pending",
  "running",
  "paused",
  "completed",
  "error",
  "canceled",
]);

const handleRemoveEndTasks = async () => {
  const taskIds: string[] = [];
  for (const item of queue.value) {
    if (item.status === "completed" || item.status === "canceled") {
      // 如果任务有pid，那么判断pid对应的任务未被完成或取消，那么不删除
      if (item.pid) {
        const pTask = queue.value.find((i) => i.taskId === item.pid);
        if (pTask && !["completed", "canceled"].includes(pTask.status)) {
          continue;
        }
      }
      taskIds.push(item.taskId);
    }
  }
  await taskApi.removeBatch(taskIds);

  notice.success({
    title: "移除成功",
    duration: 1000,
  });
  store.getQuenu();
};

const handlePauseTasks = async () => {
  for (const item of queue.value) {
    if (item.status === "running") {
      await taskApi.pause(item.taskId);
    }
  }
  store.getQuenu();
};

let intervalId: NodeJS.Timeout | null = null;
const createInterval = () => {
  if (intervalId) return;
  const interval = window.isWeb ? 2000 : 1000;
  intervalId = setInterval(() => {
    store.getQuenu();
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
  store.getQuenu();
  createInterval();
});
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  .item {
    border-bottom: 1px solid #eee;
    padding: 10px 5px;
    padding-top: 0;

    .sub-item {
      margin-left: 15px;
    }
  }
}
</style>
