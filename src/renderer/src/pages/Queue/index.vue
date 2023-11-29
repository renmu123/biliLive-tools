<template>
  <div class="container">
    <template v-if="queue.length !== 0">
      <div v-for="item in queue" :key="item.taskId" class="item">
        <div class="name-container">
          <span class="name">{{ item.name }}</span>
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
            @click="handleStart(item.taskId, item)"
            >开始</n-button
          >
          <n-button
            v-if="item.status === 'running'"
            type="primary"
            @click="handlePause(item.taskId)"
            >暂停</n-button
          >
          <n-button
            v-if="item.status === 'running' || item.status === 'paused'"
            type="error"
            @click="handleKill(item.taskId)"
            >中止</n-button
          >
          <n-button
            v-if="item.status === 'completed' && item.output"
            type="primary"
            @click="handleOpenDir(item.taskId, item)"
            >打开文件夹</n-button
          >
          <n-button
            v-if="item.status === 'completed' && item.output"
            type="primary"
            @click="handleOpenFile(item.taskId, item)"
            >打开文件</n-button
          >
          <n-button
            v-if="item.status === 'completed' || item.status === 'error'"
            @click="handleRemoveRecord(item.taskId)"
            >删除记录</n-button
          >
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

const confirm = useConfirm();
const notice = useNotification();

interface Task {
  taskId: string;
  name: string;
  status: "pending" | "running" | "paused" | "completed" | "error";
  type: "ffmpeg";
  output?: string;
}

const queue = ref<Task[]>([]);

const statusMap = {
  pending: {
    text: "等待中",
    color: "#999",
  },
  running: {
    text: "运行中",
    color: "#1890ff",
  },
  paused: {
    text: "暂停中",
    color: "#faad14",
  },
  completed: {
    text: "已完成",
    color: "#52c41a",
  },
  error: {
    text: "错误",
    color: "#f5222d",
  },
};

const getQuenu = async () => {
  // queue.value = [
  //   {
  //     taskId: "1",
  //     name: "test",
  //     status: "pending",
  //     type: "ffmpeg",
  //   },
  //   {
  //     taskId: "2",
  //     name: "test2",
  //     status: "running",
  //     type: "ffmpeg",
  //   },

  //   {
  //     taskId: "3",
  //     name: "test3",
  //     status: "paused",
  //     type: "ffmpeg",
  //   },

  //   {
  //     taskId: "4",
  //     name: "test4",
  //     status: "completed",
  //     type: "ffmpeg",
  //     output: "D:/test.mp4",
  //   },

  //   {
  //     taskId: "5",
  //     name: "test5",
  //     status: "error",
  //     type: "ffmpeg",
  //   },
  // ];
  queue.value = await window.api.task.list();
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

const handleKill = (taskId: string) => {
  const status = confirm.warning({
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
    display: flex;
    justify-content: space-between;

    .name-container {
      display: flex;
      align-items: center;
      .name {
        margin-right: 10px;
        font-size: 18px;
      }
      .status {
        font-size: 12px;
      }
    }
    .btns {
      display: flex;
      gap: 10px;
    }
  }
}
</style>
