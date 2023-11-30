<template>
  <div class="container">
    <!-- TODO:增加筛选，移除已完成记录 -->
    <template v-if="queue.length !== 0">
      <div v-for="item in queue" :key="item.taskId" class="item">
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
                (item.action.includes('kill') && item.status === 'running') ||
                item.status === 'paused'
              "
              type="error"
              size="small"
              @click="handleKill(item.taskId)"
              >中止</n-button
            >
            <n-button
              v-if="item.status === 'completed' && item.output"
              type="primary"
              size="small"
              @click="handleOpenDir(item.taskId, item)"
              >打开文件夹</n-button
            >
            <n-button
              v-if="item.status === 'completed' && item.output"
              type="primary"
              size="small"
              @click="handleOpenFile(item.taskId, item)"
              >打开文件</n-button
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
      </div>
    </template>
    <template v-else>
      <h2>暂无任务，快去添加一个试试吧</h2>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useConfirm } from "@renderer/hooks";

const confirm = useConfirm();
const notice = useNotification();

interface Task {
  taskId: string;
  name: string;
  status: "pending" | "running" | "paused" | "completed" | "error";
  type: "ffmpeg";
  output?: string;
  progress: number;
  action: ("pause" | "kill")[];
}

const queue = ref<Task[]>([]);

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

// const duration = (Date.now() - startTime.value) / 1000;
//               const speed = duration / progress.percentage;
//               timemark.value = formatSeconds(
//                 Number((speed * (100 - progress.percentage)).toFixed(0)),

const getQuenu = async () => {
  // queue.value = [
  //   {
  //     taskId: "1",
  //     name: "tesqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqwwwwwwwwwwwwwwwwwwwwwwwwt",
  //     status: "pending",
  //     type: "ffmpeg",
  //     progress: 0,
  //   },
  //   {
  //     taskId: "2",
  //     name: "test2",
  //     status: "running",
  //     type: "ffmpeg",
  //     progress: 50,
  //   },

  //   {
  //     taskId: "3",
  //     name: "test3",
  //     status: "paused",
  //     type: "ffmpeg",
  //     progress: 50,
  //   },

  //   {
  //     taskId: "4",
  //     name: "test4",
  //     status: "completed",
  //     type: "ffmpeg",
  //     output: "D:/test.mp4",
  //     progress: 100,
  //   },

  //   {
  //     taskId: "5",
  //     name: "test5",
  //     status: "error",
  //     type: "ffmpeg",
  //     progress: 50,
  //   },
  // ];
  queue.value = (await window.api.task.list()).toReversed();
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

const handleKill = async (taskId: string) => {
  const status = await confirm.warning({
    content: "确定要中止任务吗？",
  });
  if (!status) return;
  window.api.task.kill(taskId);
  console.log("handleInterrupt", taskId);
  getQuenu();
};

const handleOpenDir = (taskId: string, item: Task) => {
  console.log("handleOpenDir", taskId);
  window.api.openPath(window.path.parse(item.output!).dir);
};
const handleOpenFile = (taskId: string, item: Task) => {
  console.log("handleOpenFile", taskId);
  window.api.openPath(item.output!);
};

const handleRemoveRecord = (taskId: string) => {
  window.api.task.remove(taskId);
  notice.success({
    title: "删除记录成功",
    duration: 2000,
  });
  getQuenu();
};

setInterval(() => {
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
