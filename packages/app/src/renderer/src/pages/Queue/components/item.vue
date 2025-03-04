<template>
  <div class="container">
    <div class="content-container">
      <div class="name-container">
        <span class="name" :title="item.output">{{ item.name }}</span>
        <span
          class="status"
          :style="{
            color: statusMap[item.status].color,
            marginRight: '5px',
          }"
          >{{ statusMap[item.status].text }}</span
        >
        <n-icon v-if="item.error" :size="18" :title="item.error">
          <AlertCircleOutline
            :style="{
              color: statusMap[item.status].color,
            }"
          ></AlertCircleOutline>
        </n-icon>
      </div>
      <div class="btns">
        <n-icon
          v-if="item.status === 'pending' || item.status === 'paused'"
          :size="20"
          class="btn pointer"
          title="开始"
          @click="handleStart(item.taskId, item)"
        >
          <PlaySharp />
        </n-icon>
        <n-icon
          v-if="item.action.includes('pause') && item.status === 'running'"
          :size="20"
          class="btn pointer"
          title="暂停"
          @click="handlePause(item.taskId)"
        >
          <PauseSharp />
        </n-icon>
        <n-icon
          v-if="
            (item.action.includes('kill') && item.status === 'running') || item.status === 'paused'
          "
          :size="20"
          class="btn pointer"
          title="中止"
          @click="handleKill(item)"
        >
          <CloseOutline />
        </n-icon>
        <template v-if="!isWeb">
          <n-icon
            v-if="item.status === 'completed' && item.type !== TaskType.biliUpload && item.output"
            :size="20"
            class="btn pointer"
            title="打开文件夹"
            @click="handleOpenDir(item)"
          >
            <FolderOpenOutlined />
          </n-icon>
          <n-icon
            v-if="
              item.status === 'completed' &&
              item.type !== TaskType.biliUpload &&
              item.type !== TaskType.bili &&
              item.output
            "
            :size="20"
            class="btn pointer"
            title="打开文件"
            @click="handleOpenFile(item)"
          >
            <FileOpenOutlined />
          </n-icon>
        </template>
        <n-icon
          v-if="item.status === 'completed' && item.type === TaskType.bili && item.output"
          :size="20"
          class="btn pointer"
          title="打开稿件"
          @click="openExternal(item)"
        >
          <LiveTvOutlined />
        </n-icon>
        <n-icon
          v-if="
            item.type === TaskType.ffmpeg &&
            item.output &&
            (item.status === 'error' || item.status === 'completed')
          "
          :size="20"
          class="btn pointer"
          title="删除文件"
          @click="handleRemoveFile(item.taskId)"
        >
          <CloseSharp />
        </n-icon>
        <n-icon
          v-if="
            item.status === 'completed' ||
            item.status === 'error' ||
            item.status === 'pending' ||
            item.status === 'canceled'
          "
          :size="20"
          class="btn pointer"
          title="删除记录"
          @click="handleRemoveRecord(item.taskId)"
        >
          <TrashOutline />
        </n-icon>
      </div>
    </div>
    <n-progress
      v-if="showProgress"
      class="progress"
      :status="statusMap[item.status].progressStatus"
      type="line"
      :percentage="item.progress"
      :indicator-placement="'outside'"
      :show-indicator="false"
      style="--n-rail-height: 6px"
      :title="`${item.progress.toFixed(2)}%`"
    />

    <div v-if="showInfo && item.startTime" class="detail-info">
      <span>开始时间：{{ new Date(item.startTime).toLocaleString() }}</span>
      <span>持续时间：{{ formatSeconds(item.duration / 1000) }}</span>
      <span v-if="item.status === 'running'">
        预计还需：{{
          formatSeconds(
            Number(((item.duration / 1000 / item.progress) * (100 - item.progress)).toFixed(0)),
          )
        }}
      </span>
      <span>{{ item.custsomProgressMsg }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PlaySharp,
  PauseSharp,
  TrashOutline,
  CloseOutline,
  AlertCircleOutline,
  CloseSharp,
} from "@vicons/ionicons5";
import { FileOpenOutlined, FolderOpenOutlined, LiveTvOutlined } from "@vicons/material";
import { useConfirm } from "@renderer/hooks";
import { useQueueStore } from "@renderer/stores";
import { formatSeconds } from "@renderer/utils";
import { TaskType } from "@biliLive-tools/shared/enum.js";
import { taskApi } from "@renderer/apis";

import type { Task } from "@renderer/types";

interface Props {
  item: Task;
  showProgress?: boolean;
  showInfo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showProgress: true,
  showInfo: true,
});

const item = computed(() => props.item);
const isWeb = computed(() => window.isWeb);

const confirm = useConfirm();
const store = useQueueStore();

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
  canceled: {
    text: "已取消",
    color: "#f5222d",
    progressStatus: "error",
  },
};

const handleStart = (taskId: string, task: Task) => {
  console.log("handleStart", taskId);
  if (task.status === "paused") {
    taskApi.resume(taskId);
  } else if (task.status === "pending") {
    taskApi.start(taskId);
  }
  store.getQuenu();
};

const handlePause = async (taskId: string) => {
  console.log("handlePause", taskId);
  await taskApi.pause(taskId);
  store.getQuenu();
};

const handleKill = async (task: Task) => {
  if (task.type === TaskType.ffmpeg) {
    const [status, savePorcess] = await confirm.warning({
      content: "确定要中止任务吗？",
      showCheckbox: true,
      checkboxText: "保存进度",
    });
    if (!status) return;
    if (savePorcess) {
      taskApi.interrupt(task.taskId);
    } else {
      taskApi.cancel(task.taskId);
    }
  } else {
    const [status] = await confirm.warning({
      content: "确定要中止任务吗？",
    });
    if (!status) return;
    taskApi.cancel(task.taskId);
  }

  store.getQuenu();
};

const handleOpenDir = (item: Task) => {
  window.api.common.showItemInFolder(item.output!);
};
const handleOpenFile = (item: Task) => {
  window.api.openPath(item.output!);
};

const openExternal = (item: Task) => {
  if (isWeb.value) {
    window.open(
      `https://member.bilibili.com/platform/upload/video/frame?type=edit&version=new&aid=${item?.output}`,
      "_blank",
    );
  } else {
    window.api.openExternal(
      `https://member.bilibili.com/platform/upload/video/frame?type=edit&version=new&aid=${item?.output}`,
    );
  }
};

const handleRemoveRecord = async (taskId: string) => {
  await taskApi.removeRecord(taskId);
  store.getQuenu();
};

const notice = useNotification();
const handleRemoveFile = async (taskId: string) => {
  const [status] = await confirm.warning({
    content: "确定要删除输出文件吗？",
    showCheckbox: false,
  });
  if (!status) return;
  await taskApi.removeFile(taskId);
  notice.success({
    title: "移除成功",
    duration: 1000,
  });
};
</script>

<style scoped lang="less">
.container {
  .detail-info {
    // margin-top: 10px;
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
    // margin-top: 10px;
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
    gap: 4px;
    .btn {
      padding: 5px;
    }
    .btn:hover {
      background: #e2e6ea;
      border-radius: 50%;
      // padding: 5px;
    }
  }
}
</style>
