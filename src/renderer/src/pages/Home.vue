<!-- 首页 -->
<template>
  <div>
    <div class="flex justify-center" style="margin-bottom: 20px">
      <n-button type="primary" @click="convert"> 立即转换 </n-button>
      <!-- <n-icon size="30" class="pointer" style="margin-left: 10px" @click="openSetting">
          <SettingIcon />
        </n-icon> -->
    </div>

    <FileArea
      v-model="fileList"
      :extensions="['flv', 'mp4', 'ass', 'xml']"
      desc="请选择录播以及弹幕文件，如果为flv以及xml将自动转换为mp4以及ass"
      :max="2"
    ></FileArea>

    <!-- 基础配置，弹幕配置，ffmpeg配置 -->
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
defineOptions({
  name: "Home",
});

import FileArea from "@renderer/components/FileArea.vue";
import { useConfirm } from "@renderer/hooks";

import type { DanmuOptions, File } from "../../../types";

const notice = useNotification();
const confirm = useConfirm();

const fileList = ref<
  (File & {
    percentage?: number;
    percentageStatus?: "success" | "info" | "error";
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
  openTargetDirectory: true, // 转换完成后打开目标文件夹
});

const convert = async () => {
  if (fileList.value.length === 0) {
    return;
  }

  const videoIndex = fileList.value.findIndex((item) => item.ext === ".flv" || item.ext === ".mp4");
  const videoFile = videoIndex === -1 ? [] : [fileList.value[videoIndex]];

  const assIndex = fileList.value.findIndex((item) => item.ext === ".xml" || item.ext === ".ass");
  const assFile = assIndex === -1 ? [] : [fileList.value[assIndex]];

  if (videoFile.length === 0) {
    notice.error({
      title: "请选择一个flv或者mp4文件",
      duration: 3000,
    });
    return;
  }
  if (assFile.length === 0) {
    notice.error({
      title: "请选择一个xml或者ass文件",
      duration: 3000,
    });
    return;
  }

  // 判断目标视频文件是否存在
  let path = window.api.join(videoFile[0].dir, `${videoFile[0].name}-弹幕版.mp4`);
  if (options.value.saveRadio === 2 && options.value.savePath) {
    path = window.api.join(options.value.savePath, `${videoFile[0].name}-弹幕版.mp4`);
  }
  const isExits = await window.api.exits(path);
  if (isExits) {
    if (!options.value.override) {
      notice.info({
        title: "目前文件已存在，无需进行压制",
        duration: 3000,
      });
      return;
    } else {
      const status = await confirm.warning({
        content: `目标文件夹已存在 ${videoFile[0].name}-弹幕版.mp4 文件，继续将会覆盖此文件`,
      });
      if (!status) return;
    }
  }

  // xml文件转换
  let targetAssFile: string;
  if (assFile[0].ext === ".xml") {
    let path = window.api.join(assFile[0].dir, `${assFile[0].name}.ass`);
    if (options.value.saveRadio === 2 && options.value.savePath) {
      path = window.api.join(options.value.savePath, `${assFile[0].name}.ass`);
    }
    const isExits = await window.api.exits(path);
    if (isExits && options.value.override) {
      const status = await confirm.warning({
        content: `目标文件夹已存在 ${assFile[0].name}.ass 文件，继续将会覆盖此文件`,
      });
      if (!status) return;
    }

    console.log(assFile, toRaw(assFile));

    const result = await window.api.convertDanmu2Ass([toRaw(assFile[0])], toRaw(options.value));
    const successResult = result.filter((item) => item.status === "success");
    if (successResult.length === 0) {
      notice.error({
        title: "xml文件转换失败，请检查文件",
        duration: 3000,
      });
      return;
    }
    notice.success({
      title: "xml文件转换成功",
      duration: 3000,
    });
    targetAssFile = successResult[0].output;
  } else {
    targetAssFile = assFile[0].path;
  }
  console.log("targetAssFile", targetAssFile);

  // video文件转换
  let targetVideoFile: string;
  if (videoFile[0].ext === ".flv") {
    let path = window.api.join(videoFile[0].dir, `${videoFile[0].name}.mp4`);
    if (options.value.saveRadio === 2 && options.value.savePath) {
      path = window.api.join(options.value.savePath, `${videoFile[0].name}.mp4`);
    }
    const isExits = await window.api.exits(path);
    if (isExits && options.value.override) {
      const status = await confirm.warning({
        content: `目标文件夹已存在 ${videoFile[0].name}.mp4 文件，继续将会覆盖此文件`,
      });
      if (!status) return;
    }

    const result = await create2Mp4Task(videoFile[0], videoIndex);
    if (!result) {
      notice.error({
        title: "flv转码失败，请检查文件",
        duration: 3000,
      });
      return;
    }
    notice.success({
      title: "flv转码成功",
      duration: 3000,
    });
    targetVideoFile = result as string;
  } else {
    targetVideoFile = videoFile[0].path;
  }
  console.log("targetAssFile", targetVideoFile);
};

const create2Mp4Task = async (file: File, index: number) => {
  return new Promise((resolve) => {
    const i = index;

    window.api.convertVideo2Mp4(toRaw(file), toRaw(options.value));

    window.api.onTaskStart((_event, command) => {
      console.log("start", command, index);
      fileList.value[i].percentage = 0;
      fileList.value[i].percentageStatus = "info";
    });
    window.api.onTaskEnd(() => {
      fileList.value[i].percentage = 100;
      fileList.value[i].percentageStatus = "success";
      resolve(true);
    });
    window.api.onTaskError((_event, err) => {
      fileList.value[i].percentageStatus = "error";
      notice.error({
        title: `转换失败：\n${err}`,
      });
      resolve(false);
    });

    window.api.onTaskProgressUpdate((_event, progress) => {
      console.log(progress);

      fileList.value[i].percentage = progress.percentage;
    });
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
