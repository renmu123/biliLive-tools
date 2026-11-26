<template>
  <div class="container">
    <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 10px">
      <n-select
        v-model:value="store.params.type"
        :options="typeOptions"
        style="width: 140px"
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
        <n-button
          v-if="queue.length !== 0"
          size="small"
          type="error"
          :loading="batchAction === 'cancel'"
          title="取消当前任务类型下所有支持取消的未结束任务"
          @click="handleCancelTasks"
          >取消全部</n-button
        >
        <n-button
          v-if="queue.length !== 0"
          size="small"
          type="primary"
          :loading="batchAction === 'pause'"
          title="暂停当前任务类型下所有支持暂停的运行中任务"
          @click="handlePauseTasks"
          >暂停全部</n-button
        >
        <n-button
          v-if="queue.length !== 0"
          size="small"
          type="warning"
          @click="handleRemoveEndTasks"
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
    <n-empty
      v-else
      class="empty-state"
      :description="
        queue.length === 0 && !store.params.type
          ? '暂无任务，快去添加一个试试吧'
          : '没有符合筛选条件的任务'
      "
    />
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
import { useConfirm } from "@renderer/hooks";
import { TaskType } from "@biliLive-tools/shared/enum.js";

import type { Task } from "@renderer/types";

const notice = useNotification();
const confirm = useConfirm();
const store = useQueueStore();

const queue = computed(() => store.queue);
const batchAction = ref<"pause" | "cancel" | null>(null);
const pausableTasks = computed(() =>
  queue.value.filter((item) => item.status === "running" && item.action.includes("pause")),
);
const cancelableTasks = computed(() => {
  const tasks = queue.value.filter(
    (item) =>
      ["pending", "running", "paused"].includes(item.status) && item.action.includes("kill"),
  );
  // 取消上传父任务时会一并取消其分 P，避免重复操作子任务。
  const parentIds = new Set(
    tasks.filter((item) => item.type === TaskType.bili).map((item) => item.taskId),
  );
  return tasks
    .filter((item) => !item.pid || !parentIds.has(item.pid))
    .sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"));
});

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
  {
    value: TaskType.sync,
    label: "同步",
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

const handleBatchTasks = async (action: "pause" | "cancel") => {
  if (batchAction.value) return;
  const tasks = action === "pause" ? pausableTasks.value : cancelableTasks.value;
  if (tasks.length === 0) return;

  batchAction.value = action;
  const label = action === "pause" ? "暂停" : "取消";
  try {
    if (action === "cancel") {
      const [confirmed] = await confirm.warning({
        content: "确定要取消当前任务类型下所有可取消的未结束任务吗？",
      });
      if (!confirmed) return;
    }

    let failed = 0;
    for (const item of tasks) {
      try {
        if (action === "cancel" && item.type === TaskType.ffmpeg) {
          await taskApi.interrupt(item.taskId);
        } else {
          await taskApi[action](item.taskId);
        }
      } catch {
        failed++;
      }
    }
    if (failed > 0) {
      notice.warning({
        title: `${failed === tasks.length ? "全部" : "部分"}任务${label}失败`,
        content: `${failed} 个任务操作失败，请刷新后重试。`,
        duration: 5000,
      });
    } else {
      notice.success({ title: `${label}操作完成`, duration: 1000 });
    }
    await store.getQuenu();
  } finally {
    batchAction.value = null;
  }
};

const handlePauseTasks = () => handleBatchTasks("pause");
const handleCancelTasks = () => handleBatchTasks("cancel");

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
    border-bottom: 1px solid var(--border-secondary);
    padding: 10px 5px;
    padding-top: 0;

    .sub-item {
      margin-left: 15px;
    }
  }

  .empty-state {
    padding: 48px 0;
  }
}
</style>
