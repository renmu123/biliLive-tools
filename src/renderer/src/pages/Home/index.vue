<!-- 首页 -->
<template>
  <div>
    <div class="flex justify-center column align-center" style="margin-bottom: 20px">
      <div>
        <n-button type="primary" @click="handleConvert"> 立即转换 </n-button>
        <n-button v-if="disabled" type="primary" style="margin-left: 10px" @click="killTask">
          结束任务
        </n-button>
        <n-button type="primary" style="margin-left: 10px" @click="login"> 登录 </n-button>
      </div>
      <p>{{ hasLogin ? "已获取到登录信息" : "" }}</p>
      <p v-if="timemark">已处理视频时间：{{ timemark }}</p>
    </div>

    <FileArea
      v-model="fileList"
      :extensions="['flv', 'mp4', 'ass', 'xml']"
      desc="请选择录播以及弹幕文件，如果为flv以及xml将自动转换为mp4以及ass"
      :max="2"
      :disabled="disabled"
    ></FileArea>
    <n-scrollbar style="max-height: calc(100vh - 350px)">
      <n-tabs type="segment" style="margin-top: 10px" class="tabs">
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
              <n-checkbox v-model:checked="clientOptions.upload"> 完成后自动上传 </n-checkbox>
            </div>
          </div>
        </n-tab-pane>
        <n-tab-pane name="upload-setting" tab="上传设置" display-directive="show">
          <BiliSetting @change="handlePresetOptions"></BiliSetting>
          <BiliLoginDialog v-model="loginDialogVisible" :succeess="loginStatus"> </BiliLoginDialog>
        </n-tab-pane>
        <n-tab-pane name="danmukufactory-setting" tab="弹幕设置" display-directive="show">
          <DanmuFactorySetting
            :simpled-mode="simpledMode"
            @change="handleDanmuChange"
          ></DanmuFactorySetting>
          <div class="footer" style="text-align: right">
            <n-checkbox v-model:checked="simpledMode"> 简易模式 </n-checkbox>
            <n-button type="primary" class="btn" @click="saveDanmuConfig"> 确认 </n-button>
          </div>
        </n-tab-pane>
        <n-tab-pane name="ffmpeg-setting" tab="ffmpeg设置" display-directive="show">
          <ffmpegSetting @change="handleFfmpegSettingChange"></ffmpegSetting>
        </n-tab-pane>
      </n-tabs>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "Home",
});

import FileArea from "@renderer/components/FileArea.vue";
import DanmuFactorySetting from "@renderer/components/DanmuFactorySetting.vue";
import BiliSetting from "@renderer/components/BiliSetting.vue";
import BiliLoginDialog from "@renderer/components/BiliLoginDialog.vue";

import ffmpegSetting from "./components/ffmpegSetting.vue";
import { useConfirm, useBili } from "@renderer/hooks";
import { deepRaw } from "@renderer/utils";

import type { DanmuOptions, File, FfmpegOptions, DanmuConfig } from "../../../../types";

const notice = useNotification();
const confirm = useConfirm();
const { hasLogin, handlePresetOptions, login, loginStatus, loginDialogVisible, presetOptions } =
  useBili();

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
  removeTempFile: false, // 移除临时文件
  upload: false, // 上传
});

const disabled = ref(false);

const handleConvert = async () => {
  disabled.value = true;
  try {
    await convert();
  } finally {
    disabled.value = false;
  }
};

const convert = async () => {
  if (fileList.value.length === 0) {
    return;
  }
  const valid = await biliUpCheck(fileList.value);
  if (!valid) return;

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

  // xml文件转换
  const { canRemoveAssFile, targetAssFilePath } = await handleXmlFile(assFile);

  // 视频转化
  const { canRemoveVideo, targetVideoFilePath } = await handleVideoFile(videoFile, videoIndex);

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
  notice.success({
    title: `压制已完成，约耗时${((Date.now() - startTime) / 1000 / 60).toFixed(2)}分钟`,
    duration: 10000,
  });
  new window.Notification(
    `压制已完成，约耗时${((Date.now() - startTime) / 1000 / 60).toFixed(2)}分钟`,
  );

  if (clientOptions.value.upload) {
    await upload([{ path: `${videoFile[0].name}-弹幕版.mp4` }]);
  }

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

// 处理xml文件
const handleXmlFile = async (assFile: any) => {
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
      if (!status) throw new Error("取消");
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
      throw new Error("xml文件转换失败，请检查文件");
    }
    notice.success({
      title: "xml文件转换成功",
      duration: 3000,
    });
    targetAssFilePath = successResult[0].output;
  } else {
    targetAssFilePath = assFile[0].path;
  }
  if (targetAssFilePath.includes(" ")) {
    notice.error({
      title: "弹幕文件路径中不允许存在空格",
      duration: 3000,
    });
    throw new Error("弹幕文件路径中不允许存在空格");
  }
  console.log("targetAssFilePath", targetAssFilePath);
  return {
    canRemoveAssFile,
    targetAssFilePath,
  };
};

// 处理视频文件
const handleVideoFile = async (videoFile: any, videoIndex: number) => {
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
      throw new Error("目前文件已存在，无需进行压制");
    } else {
      const status = await confirm.warning({
        content: `目标文件夹已存在 ${videoFile[0].name}-弹幕版.mp4 文件，继续将会覆盖此文件`,
      });
      if (!status) throw new Error("取消");
    }
  }
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
      if (!status) throw new Error("取消");
    } else {
      canRemoveVideo = true;
    }

    notice.warning({
      title: "开始转换flv",
      duration: 3000,
    });
    try {
      const result = await create2Mp4Task(videoFile[0], videoIndex);

      notice.success({
        title: "文件转码成功",
        duration: 3000,
      });
      targetVideoFilePath = result as string;
    } catch (err) {
      notice.error({
        title: "文件转码失败，请检查文件",
        duration: 3000,
      });
      throw new Error("文件转码失败，请检查文件");
    }
  } else {
    targetVideoFilePath = videoFile[0].path;
  }
  console.log("targetVideoFilePath", targetVideoFilePath);

  return { canRemoveVideo, targetVideoFilePath };
};

// 视频压制
const handleVideoMerge = async (options: {
  targetVideoFilePath: string;
  targetAssFilePath: string;
  videoIndex: number;
  canRemoveAssFile: boolean;
  canRemoveVideo: boolean;
}) => {
  const { targetVideoFilePath, targetAssFilePath, videoIndex, canRemoveAssFile, canRemoveVideo } =
    options;
  notice.info({
    title: "开始进行压制，根据不同设置需要消耗大量时间，CPU，GPU，请勿关闭软件",
    duration: 5000,
  });

  const startTime = Date.now();
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
  notice.success({
    title: `压制已完成，约耗时${((Date.now() - startTime) / 1000 / 60).toFixed(2)}分钟`,
    duration: 10000,
  });
  new window.Notification(
    `压制已完成，约耗时${((Date.now() - startTime) / 1000 / 60).toFixed(2)}分钟`,
  );
};

// 已处理时间
const timemark = ref();
// 压制任务
const createMergeVideoAssTask = async (
  videoFilePath: string,
  assFilePath: string,
  index: number,
) => {
  const videoFile = window.api.formatFile(videoFilePath);
  const assFile = window.api.formatFile(assFilePath);

  return new Promise((resolve, reject) => {
    const i = index;

    window.api
      .mergeAssMp4(
        toRaw(videoFile),
        toRaw(assFile),
        toRaw(options.value),
        toRaw(ffmpegOptions.value),
      )
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
              timemark.value = "";
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
              timemark.value = progress.timemark;
            }
          });
        },
      );
  });
};

// 转码任务
const create2Mp4Task = async (file: File, index: number) => {
  return new Promise((resolve, reject) => {
    const i = index;

    window.api
      .convertVideo2Mp4(toRaw(file), toRaw(options.value))
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
          console.log(taskId, status, text);
          if (status === "error") {
            reject(text);
          }
          fileList.value[i].taskId = currentTaskId;

          window.api.onTaskStart((_event, { command, taskId }) => {
            if (taskId === currentTaskId) {
              console.log("start", command, index);
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

const biliUpCheck = async (files: { path: string }[]) => {
  const hasLogin = await window.api.checkBiliCookie();
  if (!hasLogin) {
    notice.error({
      title: `请先登录`,
      duration: 3000,
    });
    return;
  }

  if (files.length === 0) {
    notice.error({
      title: `至少选择一个文件`,
      duration: 3000,
    });
    return;
  }
  await window.api.validateBiliupConfig(deepRaw(presetOptions.value.config));
  notice.info({
    title: `开始上传`,
    duration: 3000,
  });

  return true;
};
// 上传任务
const upload = async (files: { path: string }[]) => {
  const valid = await biliUpCheck(files);
  if (!valid) return;

  disabled.value = true;
  try {
    await window.api.uploadVideo(
      toRaw(files.map((file) => file.path)),
      deepRaw(presetOptions.value.config),
    );
    window.api.onBiliUploadClose((_event, code) => {
      console.log("window close", code);
      if (code == 0) {
        notice.success({
          title: `上传成功`,
          duration: 3000,
        });
      } else {
        notice.error({
          title: `上传失败`,
          duration: 3000,
        });
      }
    });
  } finally {
    disabled.value = false;
  }
};

// @ts-ignore
const ffmpegOptions: Ref<FfmpegOptions> = ref({});
const handleFfmpegSettingChange = (value: FfmpegOptions) => {
  ffmpegOptions.value = value;
};

const simpledMode = ref(true);
// @ts-ignore
const danmuConfig: Ref<DanmuConfig> = ref({
  resolution: [],
  msgboxsize: [],
  msgboxpos: [],
});

const handleDanmuChange = (value: DanmuConfig) => {
  danmuConfig.value = value;
};
const saveDanmuConfig = async () => {
  await window.api.saveDanmuConfig(toRaw(danmuConfig.value));
};

// 杀死任务
const killTask = () => {
  fileList.value.forEach((item) => {
    if (item.taskId) {
      window.api.killTask(item.taskId);
    }
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

.tabs {
}
</style>
