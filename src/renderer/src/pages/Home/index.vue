<!-- 首页 -->
<template>
  <div>
    <div class="flex justify-center column align-center" style="margin-bottom: 20px">
      <div class="flex" style="gap: 10px">
        <n-button type="primary" @click="handleConvert"> 立即转换 </n-button>
        <n-button v-if="disabled" type="error" @click="killTask"> 结束任务 </n-button>
      </div>
      <p v-if="timemark">预计剩余处理时间：{{ timemark }}</p>
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
        </n-tab-pane>
        <n-tab-pane name="danmukufactory-setting" tab="弹幕设置" display-directive="show">
          <div class="flex" style="gap: 10px; align-items: center">
            <span style="flex: none">预设</span>
            <n-select
              v-model:value="danmuPresetId"
              :options="danmuPresetsOptions"
              placeholder="选择预设"
            />
          </div>

          <DanmuFactorySetting
            v-if="danmuPreset.id"
            v-model="danmuPreset.config"
            :simpled-mode="simpledMode"
            @change="handleDanmuChange"
          ></DanmuFactorySetting>
          <div
            class="footer flex"
            style="text-align: right; gap: 10px; justify-content: flex-end; align-items: center"
          >
            <n-checkbox v-model:checked="simpledMode"> 简易模式 </n-checkbox>
            <n-button v-if="danmuPresetId !== 'default'" type="error" @click="deleteDanmu"
              >删除</n-button
            >
            <n-button type="primary" @click="renameDanmu">重命名</n-button>
            <n-button type="primary" @click="saveAsDanmu">另存为</n-button>
          </div>
        </n-tab-pane>
        <n-tab-pane name="ffmpeg-setting" tab="ffmpeg设置" display-directive="show">
          <ffmpegSetting @change="handleFfmpegSettingChange"></ffmpegSetting>
        </n-tab-pane>
      </n-tabs>
    </n-scrollbar>

    <n-modal v-model:show="nameModelVisible">
      <n-card style="width: 600px" :bordered="false" role="dialog" aria-modal="true">
        <n-input v-model:value="tempPresetName" placeholder="请输入预设名称" maxlength="15" />
        <template #footer>
          <div style="text-align: right">
            <n-button @click="nameModelVisible = false">取消</n-button>
            <n-button type="primary" style="margin-left: 10px" @click="saveConfirm">确认</n-button>
          </div>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "Home",
});

import { storeToRefs } from "pinia";
import FileArea from "@renderer/components/FileArea.vue";
import DanmuFactorySetting from "@renderer/components/DanmuFactorySetting.vue";
import BiliSetting from "@renderer/components/BiliSetting.vue";

import ffmpegSetting from "./components/ffmpegSetting.vue";
import { useConfirm, useBili } from "@renderer/hooks";
import { useDanmuPreset } from "@renderer/stores";

import { deepRaw, uuid, formatSeconds } from "@renderer/utils";
import { cloneDeep } from "lodash-es";

import type { DanmuOptions, File, FfmpegOptions, DanmuConfig } from "../../../../types";

const notice = useNotification();
const confirm = useConfirm();
const { danmuPresetsOptions, danmuPresetId, danmuPreset } = storeToRefs(useDanmuPreset());
const { getDanmuPresets } = useDanmuPreset();

const { handlePresetOptions, presetOptions } = useBili();

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

  if (clientOptions.value.upload) {
    const valid = await biliUpCheck();
    if (!valid) {
      notice.error({
        title: `请点击左侧头像处进行登录`,
        duration: 3000,
      });
      return;
    }
  }

  const videoIndex = fileList.value.findIndex((item) => item.ext === ".flv" || item.ext === ".mp4");
  const videoFiles = videoIndex === -1 ? [] : [fileList.value[videoIndex]];

  const assIndex = fileList.value.findIndex((item) => item.ext === ".xml" || item.ext === ".ass");
  const assFile = assIndex === -1 ? [] : [fileList.value[assIndex]];

  if (videoFiles.length === 0) {
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

  const videoMeta = await window.api.readVideoMeta(videoFiles[0]?.path);
  const videoStream = videoMeta.streams.find((stream) => stream.codec_type === "video");

  // xml文件转换
  const { canRemoveAssFile, targetAssFilePath } = await handleXmlFile(assFile, videoStream);

  // 视频转化
  const { canRemoveVideo, targetVideoFilePath } = await handleVideoFile(videoFiles, videoIndex);

  // 压制任务
  const output = await handleVideoMerge({
    targetVideoFilePath,
    targetAssFilePath,
    videoIndex,
    canRemoveAssFile,
    canRemoveVideo,
  });
  console.log(output, output);

  if (clientOptions.value.upload) {
    await upload([{ path: output }]);
  }

  if (clientOptions.value.openTargetDirectory) {
    if (options.value.saveRadio === 2) {
      window.api.openPath(options.value.savePath);
    } else {
      window.api.openPath(fileList.value[videoIndex].dir);
    }
  }
  if (clientOptions.value.removeCompletedTask) {
    fileList.value = [];
  }
};

// 处理xml文件
const handleXmlFile = async (assFile: any, videoStream: any) => {
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
      if (!status) throw new Error("已取消");
    } else {
      canRemoveAssFile = true;
    }

    const { width, height } = videoStream || {};
    console.log(width, height);
    const danmuConfig = (await window.api.danmu.getPreset(danmuPresetId.value)).config;
    if (width && danmuConfig.resolution[0] !== width && danmuConfig.resolution[1] !== height) {
      const status = await confirm.warning({
        content: `目标视频为${width}*${height}，与设置的弹幕的分辨率不一致，如需更改分辨率可以去”弹幕设置“处进行修改，是否继续？`,
      });
      if (!status) throw new Error("已取消");
    }

    notice.warning({
      title: "开始转换xml",
      duration: 3000,
    });
    const result = await window.api.danmu.convertDanmu2Ass(
      [toRaw(assFile[0])],
      danmuPresetId.value,
      toRaw(options.value),
    );
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
      title: "弹幕文件路径中存在空格时会压制错误",
      duration: 3000,
    });
    throw new Error("弹幕文件路径中存在空格时会压制错误");
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

const startTime = ref(0);
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

  startTime.value = Date.now();
  let output: string;
  try {
    output = await createMergeVideoAssTask(targetVideoFilePath, targetAssFilePath, videoIndex);
  } catch (err) {
    notice.error({
      title: `转换失败：\n${err}`,
    });
    throw new Error(`转换失败：\n${err}`);
  } finally {
    if (clientOptions.value.removeTempFile) {
      if (canRemoveAssFile) window.api.trashItem(targetAssFilePath);
      if (canRemoveVideo) window.api.trashItem(targetVideoFilePath);
    }
  }

  const msg = `压制已完成，约耗时${formatSeconds(
    Number(((Date.now() - startTime.value) / 1000).toFixed(0)),
  )}`;
  // 完成后的处理
  notice.success({
    title: msg,
    duration: 10000,
  });
  new window.Notification(msg);

  return output;
};

// 预计剩余处理时间
const timemark = ref();
// 压制任务
const createMergeVideoAssTask = async (
  videoFilePath: string,
  assFilePath: string,
  index: number,
): Promise<string> => {
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
              const duration = (Date.now() - startTime.value) / 1000;
              const speed = duration / progress.percentage;
              timemark.value = formatSeconds(
                Number((speed * (100 - progress.percentage)).toFixed(0)),
              );
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

const biliUpCheck = async () => {
  const hasLogin = await window.api.checkBiliCookie();
  if (!hasLogin) {
    notice.error({
      title: `请先登录`,
      duration: 3000,
    });
    return;
  }

  await window.api.validateBiliupConfig(deepRaw(presetOptions.value.config));

  return true;
};
// 上传任务
const upload = async (files: { path: string }[]) => {
  const valid = await biliUpCheck();
  if (!valid) return;
  console.log("files", files);

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

const handleDanmuChange = (value: DanmuConfig) => {
  danmuPreset.value.config = value;
  saveDanmuConfig();
};
const saveDanmuConfig = async () => {
  window.api.danmu.savePreset(toRaw(danmuPreset.value));
};

// 弹幕预设相关
const nameModelVisible = ref(false);
const tempPresetName = ref("");
const isRename = ref(false);
const renameDanmu = async () => {
  tempPresetName.value = danmuPreset.value.name;
  isRename.value = true;
  nameModelVisible.value = true;
};
const saveAsDanmu = async () => {
  isRename.value = false;
  tempPresetName.value = "";
  nameModelVisible.value = true;
};
const deleteDanmu = async () => {
  const status = await confirm.warning({
    content: "是否确认删除该预设？",
  });
  if (!status) return;
  await window.api.danmu.deletePreset(danmuPresetId.value);
  danmuPresetId.value = "default";
  await getDanmuPresets();
};

const saveConfirm = async () => {
  if (!tempPresetName.value) {
    notice.warning({
      title: "预设名称不得为空",
      duration: 2000,
    });
    return;
  }
  const preset = cloneDeep(danmuPreset.value);
  if (!isRename.value) preset.id = uuid();
  preset.name = tempPresetName.value;

  await window.api.danmu.savePreset(preset);
  nameModelVisible.value = false;
  notice.success({
    title: "保存成功",
    duration: 1000,
  });
  getDanmuPresets();
};

watch(
  () => danmuPresetId.value,
  async (value) => {
    danmuPreset.value = await window.api.danmu.getPreset(value);
  },
  {
    immediate: true,
  },
);

// 杀死任务
const killTask = () => {
  fileList.value.forEach((item) => {
    if (item.taskId) {
      window.api.killTask(item.taskId);
    }
  });
  new Error("任务已取消");
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
