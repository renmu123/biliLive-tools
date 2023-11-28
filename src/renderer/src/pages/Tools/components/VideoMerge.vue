<!-- 文件合并 -->
<template>
  <div>
    <div
      class="center"
      style="
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      "
    >
      <n-button type="primary" @click="convert"> 立即合并 </n-button>
      <Tip
        tip="在这种模式下，音频/视频文件可以被流式复制，只要它们共享质量（大小、编解码器、比特率）。<br/>注意：并非所有容器都支持流复制。如果出现播放问题或未合并文件，则可能需要重新编码。"
        :size="26"
      ></Tip>
    </div>
    <FileArea
      v-model="fileList"
      :extensions="['flv', 'mp4']"
      desc="请选择视频文件"
      :disabled="disabled"
    ></FileArea>

    <div class="flex align-center column" style="margin-top: 10px">
      <div></div>
      <div style="margin-top: 10px">
        <n-checkbox v-model:checked="clientOptions.saveOriginPath">
          保存到原始文件夹并自动重命名
        </n-checkbox>
        <n-checkbox v-model:checked="options.removeOrigin"> 完成后移除源文件 </n-checkbox>
        <n-checkbox v-model:checked="clientOptions.removeCompletedTask">
          完成后移除任务
        </n-checkbox>
        <n-checkbox v-model:checked="clientOptions.openTargetDirectory">
          完成后打开文件夹
        </n-checkbox>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FileArea from "@renderer/components/FileArea.vue";
import Tip from "@renderer/components/Tip.vue";
import type { File, VideoMergeOptions } from "../../../../../types";

const notice = useNotification();

const fileList = ref<
  (File & {
    percentage?: number;
    percentageStatus?: "success" | "info" | "error";
    taskId?: string;
  })[]
>([]);

const options = ref<VideoMergeOptions>({
  savePath: "",

  removeOrigin: false, // 完成后移除源文件
});
const clientOptions = ref({
  saveOriginPath: false, // 保存到原始文件夹并自动重命名
  removeCompletedTask: true, // 移除已完成任务
  openTargetDirectory: true, // 转换完成后打开目标文件夹
});
const disabled = ref(false);

const convert = async () => {
  if (fileList.value.length < 2) {
    notice.error({
      title: `至少选择2个文件`,
      duration: 3000,
    });
    return;
  }
  let filePath!: string;
  if (clientOptions.value.saveOriginPath) {
    const { dir, name } = fileList.value[0];
    filePath = window.path.join(dir, `${name}-mergered.mp4`);
    if (await window.api.exits(filePath)) {
      notice.error({
        title: `${filePath}-文件已存在，请手动选择路径`,
        duration: 3000,
      });
      console.log("文件已存在，请手动选择路径");
      const file = await getDir();
      if (!file) {
        return;
      }
      filePath = file;
    }
  } else {
    console.log("文件已存在，请手动选择路径1");

    const file = await getDir();
    if (!file) {
      return;
    }
    filePath = file;
  }
  options.value.savePath = filePath;

  console.log(filePath);

  disabled.value = true;
  let showSuccessFlag = true;
  notice.warning({
    title: `开始合并`,
    duration: 3000,
  });
  try {
    await createTask();
  } catch (err) {
    notice.error({
      title: err as string,
      duration: 3000,
    });
    showSuccessFlag = false;
  }
  disabled.value = false;

  if (showSuccessFlag) {
    notice.success({
      title: `合并完成`,
      duration: 3000,
    });
  }

  if (clientOptions.value.openTargetDirectory) {
    const { dir } = window.path.parse(filePath);
    window.api.openPath(dir);
  }
  if (clientOptions.value.removeCompletedTask) {
    fileList.value = [];
  }
};

const createTask = async () => {
  return new Promise((resolve, reject) => {
    const i = 0;
    window.api
      .mergeVideos(toRaw(fileList.value), toRaw(options.value))
      .then(
        ({
          taskId,
          status,
          text,
        }: {
          taskId: string;
          status: "success" | "error";
          text: string;
        }) => {
          const currentTaskId = taskId;
          if (status === "error") {
            reject(text);
          }
          fileList.value[i].taskId = currentTaskId;

          window.api.onTaskStart((_event, { taskId }) => {
            if (taskId === currentTaskId) {
              fileList.value[i].percentage = 0;
              fileList.value[i].percentageStatus = "info";
            }
          });
          window.api.onTaskEnd((_event, { output, taskId }) => {
            if (taskId === currentTaskId) {
              fileList.value[i].percentage = 100;
              fileList.value[i].percentageStatus = "success";
              resolve(output);
            }
          });
          window.api.onTaskError((_event, { err, taskId }) => {
            if (taskId === currentTaskId) {
              fileList.value[i].percentageStatus = "error";
              reject(err);
            }
          });

          window.api.onTaskProgressUpdate((_event, { progress, taskId }) => {
            console.log(taskId, currentTaskId, progress);

            if (taskId === currentTaskId) {
              fileList.value[i].percentage = progress.percentage;
            }
          });
        },
      );
  });
};

async function getDir() {
  const path = await window.api.showSaveDialog({
    filters: [
      { name: "视频文件", extensions: ["mp4"] },
      { name: "所有文件", extensions: ["*"] },
    ],
  });
  return path;
}
</script>

<style scoped lang="less">
.radio-group {
  :deep(.n-radio) {
    align-items: center;
  }
}
</style>
