<template>
  <div class="container">
    <div style="display: flex; justify-content: space-between; align-items: center">
      <n-checkbox-group v-model:value="selectedStatus">
        <n-checkbox value="pending">等待中</n-checkbox>
        <n-checkbox value="running">运行中</n-checkbox>
        <n-checkbox value="paused">已暂停</n-checkbox>
        <n-checkbox value="completed">已完成</n-checkbox>
        <n-checkbox value="error">错误</n-checkbox>
      </n-checkbox-group>

      <n-button v-if="queue.length !== 0" size="small" type="error" @click="handleRemoveEndTasks"
        >移除已完成任务记录</n-button
      >
    </div>
    <template v-if="displayQueue.length !== 0">
      <div v-for="item in displayQueue" :key="item.taskId" class="item">
        <div class="content-container">
          <div class="name-container">
            <span class="name" :title="item.name">{{ item.name }}</span>
            <span
              class="status"
              :style="{
                color: statusMap[item.status].color,
              }"
              >{{ statusMap[item.status].text }}</span
            >
          </div>
          <div class="btns">
            <n-button
              v-if="item.status === 'pending' || item.status === 'paused'"
              type="primary"
              size="small"
              @click="handleStart(item.taskId, item)"
              >开始</n-button
            >
            <n-button
              v-if="item.action.includes('pause') && item.status === 'running'"
              type="primary"
              size="small"
              @click="handlePause(item.taskId)"
              >暂停</n-button
            >
            <n-button
              v-if="
                item.action.includes('interrupt') &&
                (item.status === 'running' || item.status === 'paused')
              "
              type="error"
              size="small"
              title="中断会保留已处理进度"
              @click="handleInterrupt(item.taskId)"
              >中断</n-button
            >
            <n-button
              v-if="
                (item.action.includes('kill') && item.status === 'running') ||
                item.status === 'paused'
              "
              type="error"
              size="small"
              @click="handleKill(item.taskId)"
              >中止</n-button
            >
            <n-button
              v-if="item.status === 'completed' && item.type !== TaskType.bili && item.output"
              type="primary"
              size="small"
              @click="handleOpenDir(item)"
              >打开文件夹</n-button
            >
            <n-button
              v-if="item.status === 'completed' && item.type !== TaskType.bili && item.output"
              type="primary"
              size="small"
              @click="handleOpenFile(item)"
              >打开文件</n-button
            >
            <n-button
              v-if="item.status === 'completed' && item.type === TaskType.bili && item.output"
              type="primary"
              size="small"
              @click="openExternal(item)"
              >打开稿件</n-button
            >
            <n-button
              v-if="
                item.status === 'completed' || item.status === 'error' || item.status === 'pending'
              "
              size="small"
              title="已完成任务移除只是删除记录"
              @click="handleRemoveRecord(item.taskId)"
              >删除任务</n-button
            >
          </div>
        </div>
        <n-progress
          class="progress"
          :status="statusMap[item.status].progressStatus"
          type="line"
          :percentage="item.progress"
          :indicator-placement="'outside'"
          :show-indicator="false"
          style="--n-rail-height: 6px"
        />

        <div class="detail-info">
          <span v-if="item.startTime"
            >开始时间：{{ new Date(item.startTime).toLocaleString() }}</span
          >
          <span
            v-if="
              item.status !== 'pending' && item.status !== 'completed' && item.status !== 'error'
            "
            >持续时间：{{ formatSeconds((now - (item.startTime || 0)) / 1000) }}</span
          >
          <span v-if="item.status === 'completed'"
            >持续时间：{{ formatSeconds((item.endTime! - item.startTime!) / 1000) }}</span
          >
          <span v-if="item.status === 'running'">
            预计还需时间：{{
              formatSeconds(
                Number(
                  (
                    ((now - (item.startTime || 0)) / 1000 / item.progress) *
                    (100 - item.progress)
                  ).toFixed(0),
                ),
              )
            }}
          </span>
        </div>
      </div>
    </template>
    <template v-else>
      <h2>暂无任务，快去添加一个试试吧</h2>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useConfirm } from "@renderer/hooks";
import { useQueueStore } from "@renderer/stores";
import { formatSeconds } from "@renderer/utils";
import { TaskType } from "../../../../types/enum";

const confirm = useConfirm();
const notice = useNotification();
const store = useQueueStore();

interface Task {
  taskId: string;
  name: string;
  status: "pending" | "running" | "paused" | "completed" | "error";
  type: TaskType;
  output?: any;
  progress: number;
  action: ("pause" | "kill" | "interrupt")[];
  startTime?: number;
  endTime?: number;
}

const queue = ref<Task[]>([]);
const displayQueue = computed(() => {
  return queue.value.filter((item) => selectedStatus.value.includes(item.status));
});

const statusMap: {
  [key in Task["status"]]: {
    text: string;
    color: string;
    progressStatus: "default" | "success" | "warning" | "error";
  };
} = {
  pending: {
    text: "等待中",
    color: "#999",
    progressStatus: "default",
  },
  running: {
    text: "运行中",
    color: "#1890ff",
    progressStatus: "default",
  },
  paused: {
    text: "已暂停",
    color: "#faad14",
    progressStatus: "warning",
  },
  completed: {
    text: "已完成",
    color: "#52c41a",
    progressStatus: "success",
  },
  error: {
    text: "错误",
    color: "#f5222d",
    progressStatus: "error",
  },
};

const selectedStatus = ref<string[]>(["pending", "running", "paused", "completed", "error"]);
const getQuenu = async () => {
  // queue.value = [
  //   {
  //     taskId: "1",
  //     name: "tesqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqwwwwwwwwwwwwwwwwwwwwwwwwt",
  //     status: "pending",
  //     type: "ffmpeg",
  //     progress: 0,
  //     action: ["pause", "kill"],
  //   },
  //   {
  //     taskId: "2",
  //     name: "test2",
  //     status: "running",
  //     type: "ffmpeg",
  //     progress: 50,
  //     action: ["pause", "kill"],
  //     startTime: 1701682795887,
  //   },
  //   {
  //     taskId: "3",
  //     name: "test3",
  //     status: "paused",
  //     type: "ffmpeg",
  //     progress: 50,
  //     action: ["pause", "kill"],
  //     startTime: 1701682795887,
  //   },
  //   {
  //     taskId: "4",
  //     name: "test4",
  //     status: "completed",
  //     type: "ffmpeg",
  //     output: "D:/test.mp4",
  //     progress: 100,
  //     action: ["pause", "kill"],
  //     startTime: 1701682795887,
  //     endTime: 1701682995887,
  //   },
  //   {
  //     taskId: "5",
  //     name: "test5",
  //     status: "error",
  //     type: "ffmpeg",
  //     progress: 50,
  //     action: ["pause", "kill"],
  //   },
  // ];
  queue.value = (await window.api.task.list()).toReversed();
  store.runningTaskNum = queue.value.filter((item) => item.status === "running").length;
};

const handleStart = (taskId: string, task: Task) => {
  console.log("handleStart", taskId);
  if (task.status === "paused") {
    window.api.task.resume(taskId);
  } else if (task.status === "pending") {
    window.api.task.start(taskId);
  }
  getQuenu();
};

const handlePause = (taskId: string) => {
  console.log("handlePause", taskId);
  window.api.task.pause(taskId);
  getQuenu();
};

const handleInterrupt = async (taskId: string) => {
  const status = await confirm.warning({
    content: "确定要中断任务吗？中断会保留进度",
  });
  if (!status) return;
  window.api.task.interrupt(taskId);
  getQuenu();
};

const handleKill = async (taskId: string) => {
  const status = await confirm.warning({
    content: "确定要中止任务吗？",
  });
  if (!status) return;
  window.api.task.kill(taskId);
  getQuenu();
};

const handleOpenDir = (item: Task) => {
  window.api.openPath(window.path.parse(item.output!).dir);
};
const handleOpenFile = (item: Task) => {
  window.api.openPath(item.output!);
};

const openExternal = (item: Task) => {
  window.api.openExternal(
    `https://member.bilibili.com/platform/upload/video/frame?type=edit&version=new&aid=${item?.output?.aid}`,
  );
};

const handleRemoveRecord = (taskId: string) => {
  window.api.task.remove(taskId);
  notice.success({
    title: "删除记录成功",
    duration: 2000,
  });
  getQuenu();
};

const handleRemoveEndTasks = async () => {
  for (const item of queue.value) {
    if (item.status === "completed") {
      await window.api.task.remove(item.taskId);
    }
  }
  notice.success({
    title: "移除成功",
    duration: 2000,
  });
  getQuenu();
};

const now = ref(Date.now());

setInterval(() => {
  now.value = Date.now();
  getQuenu();
}, 1000);
getQuenu();
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  .item {
    border-bottom: 1px solid #eee;
    padding: 10px 5px;
    .detail-info {
      margin-top: 10px;
      font-size: 12px;
      color: #999;
      display: flex;
      gap: 10px;
    }
    .content-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .progress {
      margin-top: 10px;
    }

    .name-container {
      display: flex;
      align-items: center;
      overflow: hidden;

      .name {
        margin-right: 10px;
        font-size: 16px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .status {
        flex: none;
        font-size: 12px;
        margin-right: 10px;
      }
    }
    .btns {
      flex: none;
      display: flex;
      gap: 10px;
    }
  }
}
</style>
