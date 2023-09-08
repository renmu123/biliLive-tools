<!-- 首页 -->
<template>
  <div>
    <div class="flex justify-center" style="margin-bottom: 20px">
      <n-button type="primary" @click="handleConvert"> 立即转换 </n-button>
      <!-- <n-icon size="30" class="pointer" style="margin-left: 10px" @click="openSetting">
          <SettingIcon />
        </n-icon> -->
    </div>

    <FileArea
      v-model="fileList"
      :extensions="['flv', 'mp4', 'ass', 'xml']"
      desc="请选择录播以及弹幕文件，如果为flv以及xml将自动转换为mp4以及ass"
      :max="2"
      :is-in-progress="isInProgress"
    ></FileArea>

    <n-tabs type="segment" style="margin-top: 10px">
      <n-tab-pane name="common-setting" tab="基础设置" display-directive="show:lazy">
        <div class="flex column">
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
            <n-checkbox v-model:checked="clientOptions.removeTempFile"> 移除临时文件 </n-checkbox>

            <n-checkbox v-model:checked="clientOptions.removeCompletedTask">
              完成后移除任务
            </n-checkbox>
            <n-checkbox v-model:checked="clientOptions.openTargetDirectory">
              完成后打开文件夹
            </n-checkbox>
          </div>
        </div>
      </n-tab-pane>
      <n-tab-pane name="ffmpeg-setting" tab="ffmpeg设置" display-directive="show">
        <!-- <DanmuFactoryVue></DanmuFactoryVue> -->
        <ffmpegSetting @change="handleFfmpegSettingChange"></ffmpegSetting>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "Home",
});

import FileArea from "@renderer/components/FileArea.vue";
import ffmpegSetting from "./components/ffmpegSetting.vue";
import { useConfirm } from "@renderer/hooks";

import type { DanmuOptions, File, FfmpegOptions } from "../../../../types";
import { reject } from "lodash-es";

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
  removeTempFile: false, // 移除临时文件
});

const isInProgress = ref(false);

const handleConvert = async () => {
  isInProgress.value = true;
  try {
    await convert();
  } finally {
    isInProgress.value = false;
  }
};

const convert = async () => {
  if (fileList.value.length === 0) {
    return;
  }
  const startTime = Date.now();

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
  let targetAssFilePath: string;
  let canRemoveAssFile = false;
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
    } else {
      canRemoveAssFile = true;
    }

    notice.warning({
      title: "开始转换xml",
      duration: 3000,
    });
    const result = await window.api.convertDanmu2Ass([toRaw(assFile[0])], toRaw(options.value));
    console.log("xmlresult", result);
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
    targetAssFilePath = successResult[0].output;
  } else {
    targetAssFilePath = assFile[0].path;
  }
  console.log("targetAssFilePath", targetAssFilePath);

  // video文件转换
  let targetVideoFilePath: string;
  let canRemoveVideo = false;
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
    } else {
      canRemoveVideo = true;
    }

    notice.warning({
      title: "开始转换flv",
      duration: 3000,
    });
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
    targetVideoFilePath = result as string;
  } else {
    targetVideoFilePath = videoFile[0].path;
  }
  console.log("targetVideoFilePath", targetVideoFilePath);

  notice.info({
    title: "开始进行压制，根据不同设置需要消耗大量时间，CPU，GPU，请勿关闭软件",
    duration: 5000,
  });

  try {
    await createMergeVideoAssTask(targetVideoFilePath, targetAssFilePath, videoIndex);
  } catch (err) {
    notice.error({
      title: `转换失败：\n${err}`,
    });
    return;
  } finally {
    if (clientOptions.value.removeTempFile) {
      if (canRemoveAssFile) window.api.trashItem(targetAssFilePath);
      if (canRemoveVideo) window.api.trashItem(targetVideoFilePath);
    }
  }

  // 完成后的处理
  notice.info({
    title: `压制已完成，约耗时${((Date.now() - startTime) / 1000 / 60).toFixed(2)}分钟`,
    duration: 5000,
  });
  new window.Notification("压制已完成");
  if (clientOptions.value.removeCompletedTask) {
    fileList.value = [];
  }
  if (clientOptions.value.openTargetDirectory) {
    if (options.value.saveRadio === 2) {
      window.api.openPath(options.value.savePath);
    } else {
      window.api.openPath(fileList.value[videoIndex].dir);
    }
  }
};

// 压制任务
const createMergeVideoAssTask = async (
  videoFilePath: string,
  assFilePath: string,
  index: number,
) => {
  const videoFile = window.api.formatFile(videoFilePath);
  const assFile = window.api.formatFile(assFilePath);

  return new Promise((resolve) => {
    const i = index;

    window.api.mergeAssMp4(
      toRaw(videoFile),
      toRaw(assFile),
      toRaw(options.value),
      toRaw(ffmpegOptions.value),
    );

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
      reject(err);
    });

    window.api.onTaskProgressUpdate((_event, progress) => {
      console.log(progress);

      fileList.value[i].percentage = progress.percentage;
    });
  });
};

// 转码任务
const create2Mp4Task = async (file: File, index: number) => {
  return new Promise((resolve) => {
    const i = index;

    window.api.convertVideo2Mp4(toRaw(file), toRaw(options.value));

    window.api.onTaskStart((_event, command) => {
      console.log("start", command, index);
      fileList.value[i].percentage = 0;
      fileList.value[i].percentageStatus = "info";
    });
    window.api.onTaskEnd((_event, path) => {
      fileList.value[i].percentage = 100;
      fileList.value[i].percentageStatus = "success";
      resolve(path);
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

// @ts-ignore
const ffmpegOptions: Ref<FfmpegOptions> = ref({});
const handleFfmpegSettingChange = (value: FfmpegOptions) => {
  ffmpegOptions.value = value;
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
