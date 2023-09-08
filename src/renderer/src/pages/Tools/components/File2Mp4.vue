<!-- 将文件转换为mp4 -->
<template>
  <div>
    <div class="center" style="margin-bottom: 20px">
      <n-button type="primary" @click="convert"> 立即转换 </n-button>
    </div>
    <FileArea
      v-model="fileList"
      :extensions="['flv']"
      desc="请选择flv文件"
      :disabled="disabled"
    ></FileArea>

    <div class="flex align-center column" style="margin-top: 10px">
      <div>
        <n-radio-group v-model:value="options.saveRadio" class="radio-group">
          <n-space class="flex align-center column">
            <n-radio :value="1"> 保存到原始文件夹 </n-radio>
            <n-radio :value="2">
              <n-input
                v-model:value="options.savePath"
                type="text"
                placeholder="选择文件夹"
                style="width: 300px"
              />
            </n-radio>
            <n-button type="primary" :disabled="options.saveRadio !== 2" @click="getDir">
              选择文件夹
            </n-button>
          </n-space>
        </n-radio-group>
      </div>
      <div style="margin-top: 10px">
        <n-radio-group v-model:value="options.override">
          <n-space>
            <n-radio :value="true"> 覆盖文件 </n-radio>
            <n-radio :value="false"> 跳过存在文件 </n-radio>
          </n-space>
        </n-radio-group>
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
import { useConfirm } from "@renderer/hooks";
import type { File, DanmuOptions } from "../../../../../types";

const notice = useNotification();
const confirm = useConfirm();

const fileList = ref<
  (File & {
    percentage?: number;
    percentageStatus?: "success" | "info" | "error";
    taskId?: string;
  })[]
>([]);

const options = ref<DanmuOptions>({
  saveRadio: 1, // 1：保存到原始文件夹，2：保存到特定文件夹
  saveOriginPath: true,
  savePath: "",

  override: false, // 覆盖文件
  removeOrigin: false, // 完成后移除源文件
});
const clientOptions = ref({
  removeCompletedTask: true, // 移除已完成任务
  openTargetDirectory: false, // 转换完成后打开目标文件夹
});
const disabled = ref(false);

const convert = async () => {
  if (fileList.value.length === 0) {
    notice.error({
      title: `至少选择一个文件`,
      duration: 3000,
    });
    return;
  }
  const status = await confirm.warning({
    content: "转封装增加大量 CPU 占用以及硬盘 IO，请耐心等待",
  });
  if (!status) return;

  notice.info({
    title: `检测到${fileList.value.length}个任务，开始转换`,
    duration: 3000,
  });

  disabled.value = true;
  let showSuccessFlag = true;
  for (let i = 0; i < fileList.value.length; i++) {
    try {
      await createTask(i);
    } catch {
      showSuccessFlag = false;
    }
  }
  disabled.value = false;

  if (showSuccessFlag) {
    notice.success({
      title: `转换完成`,
      duration: 3000,
    });
  }

  if (clientOptions.value.openTargetDirectory) {
    if (options.value.saveRadio === 2) {
      window.api.openPath(toRaw(options.value).savePath);
    } else {
      window.api.openPath(toRaw(fileList.value[0]).dir);
    }
  }
  if (clientOptions.value.removeCompletedTask) {
    fileList.value = fileList.value.filter((item) => item.percentageStatus !== "success");
  }
};

const createTask = async (index: number) => {
  return new Promise((resolve, reject) => {
    const i = index;

    window.api
      .convertVideo2Mp4(toRaw(fileList.value[i]), toRaw(options.value))
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
            if (taskId === currentTaskId) {
              fileList.value[i].percentage = progress.percentage;
            }
          });
        },
      );
  });
};

async function getDir() {
  const path = await window.api.openDirectory();
  options.value.savePath = path;
}
</script>

<style scoped lang="less">
.radio-group {
  :deep(.n-radio) {
    align-items: center;
  }
}
</style>
