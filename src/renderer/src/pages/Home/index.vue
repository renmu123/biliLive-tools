<!-- 压制&上传 -->
<template>
  <div>
    <div class="flex justify-center column align-center" style="margin-bottom: 20px">
      <div class="flex" style="gap: 10px">
        <n-button type="primary" @click="handleConvert"> 立即转换 </n-button>
      </div>
    </div>

    <FileArea
      v-model="fileList"
      :extensions="['flv', 'mp4', 'ass', 'xml']"
      desc="请选择视频以及弹幕文件，如果为xml将自动转换为ass"
      :max="2"
    ></FileArea>
    <n-scrollbar style="max-height: calc(100vh - 350px)">
      <n-tabs type="segment" style="margin-top: 10px" class="tabs">
        <n-tab-pane name="common-setting" tab="基础设置" display-directive="show:lazy">
          <div class="flex column">
            <div></div>
            <div style="margin-top: 10px">
              <!-- <n-radio-group v-model:value="options.override">
                <n-space>
                  <n-radio :value="true"> 覆盖文件 </n-radio>
                  <n-radio :value="false"> 跳过存在文件 </n-radio>
                </n-space>
              </n-radio-group> -->
              <n-checkbox v-model:checked="options.removeOrigin"> 完成后移除源文件 </n-checkbox>

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

import { deepRaw, uuid } from "@renderer/utils";
import { cloneDeep } from "lodash-es";

import type { File, FfmpegOptions, DanmuConfig, BiliupPreset } from "../../../../types";

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

type MergeOptions = {
  removeOrigin: boolean;
};

const options = ref<MergeOptions>({
  removeOrigin: false, // 完成后移除源文件
});
const clientOptions = ref({
  // saveOriginPath: false, // 保存到原始文件夹并自动重命名
  openTargetDirectory: false, // 转换完成后打开目标文件夹
  upload: false, // 上传
});

const handleConvert = async () => {
  convert();
};

const preHandle = async (
  files: File[],
  clientOptions: any,
  options: MergeOptions,
  danmuPresetId: string,
  presetOptions: any,
) => {
  if (files.length === 0) {
    return false;
  }

  if (clientOptions.upload) {
    await biliUpCheck(presetOptions);
  }

  const videoFile = files.find((item) => item.ext === ".flv" || item.ext === ".mp4");
  const danmuFile = files.find((item) => item.ext === ".xml" || item.ext === ".ass");

  if (!videoFile) {
    notice.error({
      title: "请选择一个flv或者mp4文件",
      duration: 3000,
    });
    return false;
  }
  if (!danmuFile) {
    notice.error({
      title: "请选择一个xml或者ass文件",
      duration: 3000,
    });
    return false;
  }
  // 弹幕处理
  const videoMeta = await window.api.readVideoMeta(videoFile.path);
  const videoStream = videoMeta.streams.find((stream) => stream.codec_type === "video");
  const { width, height } = videoStream || {};
  console.log(width, height);
  const danmuConfig = (await window.api.danmu.getPreset(danmuPresetId)).config;
  if (width && danmuConfig.resolution[0] !== width && danmuConfig.resolution[1] !== height) {
    const status = await confirm.warning({
      content: `目标视频为${width}*${height}，与设置的弹幕的分辨率不一致，如需更改分辨率可以去”弹幕设置“处进行修改，是否继续？`,
    });
    if (!status) return false;
  }

  // 视频验证
  const file = await window.api.showSaveDialog({
    filters: [
      { name: "视频文件", extensions: ["mp4"] },
      { name: "所有文件", extensions: ["*"] },
    ],
  });
  if (!file) return false;

  return {
    inputVideoFile: videoFile,
    inputDanmuFile: danmuFile,
    outputPath: file,
    rawOptions: options,
  };
};

const convert = async () => {
  const files = toRaw(fileList.value);
  const rawClientOptions = toRaw(clientOptions.value);
  const rawDanmuPresetId = toRaw(danmuPresetId.value);
  const rawPresetOptions = toRaw(presetOptions.value);
  const rawFfmpegOptions = toRaw(ffmpegOptions.value);

  const data = await preHandle(
    files,
    rawClientOptions,
    toRaw(options.value),
    rawDanmuPresetId,
    rawPresetOptions,
  );
  if (!data) return;
  let { inputDanmuFile } = data;
  const { inputVideoFile, outputPath, rawOptions } = data;
  console.log("inputDanmuFile", inputDanmuFile, inputVideoFile, outputPath, rawOptions);

  if (inputDanmuFile.ext === ".xml") {
    // xml文件转换
    const targetAssFile = await handleXmlFile(inputDanmuFile, rawOptions, rawDanmuPresetId);
    console.log("targetAssFilePath", targetAssFile);
    inputDanmuFile = targetAssFile;
  }
  if (inputDanmuFile.path.includes(" ")) {
    throw new Error("弹幕文件路径中存在空格时会压制错误");
  }

  // 压制任务
  const output = handleVideoMerge(
    {
      inputVideoFilePath: inputVideoFile?.path,
      inputAssFilePath: inputDanmuFile.path,
      outputPath: outputPath,
    },
    rawOptions,
    rawFfmpegOptions,
  );

  fileList.value = [];
  if (rawClientOptions.upload) {
    await upload(await output, rawPresetOptions);
  }

  if (rawClientOptions.openTargetDirectory) {
    window.api.openPath(outputPath);
  }
};

// 处理xml文件
const handleXmlFile = async (danmuFile: File, options: MergeOptions, danmuPresetId: string) => {
  notice.warning({
    title: "开始转换xml",
    duration: 3000,
  });

  const outputPath = `${window.path.join(window.api.common.getTempPath(), uuid())}.ass`;
  console.log("outputPath", outputPath);
  const targetAssFilePath = await convertDanmu2Ass(
    {
      input: danmuFile.path,
      output: outputPath,
    },
    options,
    danmuPresetId,
  );

  return window.api.formatFile(targetAssFilePath);
};

const convertDanmu2Ass = (
  fileOptions: {
    input: string;
    output: string;
  },
  options: MergeOptions,
  danmuPresetId: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    window.api.danmu.convertDanmu2Ass([fileOptions], danmuPresetId, options).then((result: any) => {
      if (result[0].output) {
        resolve(result[0].output);
      } else {
        const taskId = result[0].taskId;
        window.api.task.on(taskId, "end", (data) => {
          console.log("end", data);
          notice.success({
            title: "xml文件转换成功",
            duration: 3000,
          });
          resolve(data.output);
        });

        window.api.task.on(taskId, "error", (data) => {
          reject(data.err);
        });
      }
    });
  });
};

// 视频压制
const handleVideoMerge = async (
  convertOptions: {
    inputVideoFilePath: string;
    inputAssFilePath: string;
    outputPath: string;
  },
  options: MergeOptions,
  ffmpegOptions: FfmpegOptions,
) => {
  const { inputVideoFilePath, inputAssFilePath, outputPath } = convertOptions;
  notice.info({
    title: "已加入队列，根据不同设置压制需要消耗大量时间，CPU，GPU，期间请勿关闭本软件",
    duration: 3000,
  });

  let output: string;
  try {
    output = await createMergeVideoAssTask(
      inputVideoFilePath,
      inputAssFilePath,
      outputPath,
      deepRaw(options),
      ffmpegOptions,
    );
  } catch (err) {
    throw new Error(`转换失败：\n${err}`);
  }

  return output;
};

// 压制任务
const createMergeVideoAssTask = async (
  videoFilePath: string,
  assFilePath: string,
  outputPath: string,
  options: MergeOptions,
  ffmpegOptions: FfmpegOptions,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    window.api
      .mergeAssMp4(
        {
          videoFilePath: videoFilePath,
          assFilePath: assFilePath,
          outputPath: outputPath,
        },
        options,
        ffmpegOptions,
      )
      .then(({ taskId, output }: { taskId?: string; output?: string }) => {
        if (!taskId) return resolve(output as string);
        notice.info({
          title: "已加入任务队列，可在任务列表中查看进度",
          duration: 3000,
        });

        window.api.task.on(taskId, "end", (data) => {
          console.log("end", data);
          notice.success({
            title: "压制成功",
            duration: 3000,
          });
          resolve(data.output);
        });

        window.api.task.on(taskId, "error", (data) => {
          reject(data.err);
        });
      });
  });
};

const biliUpCheck = async (presetOptions: BiliupPreset) => {
  const hasLogin = await window.api.bili.checkCookie();
  if (!hasLogin) {
    throw new Error(`请点击左侧头像进行登录`);
  }

  await window.api.bili.validUploadParams(presetOptions.config);

  return true;
};
// 上传任务
const upload = async (file: string, presetOptions: BiliupPreset) => {
  const valid = await biliUpCheck(presetOptions);
  if (!valid) return;

  await window.api.bili.uploadVideo([file], presetOptions.config);
  window.api.onBiliUploadClose((_event, code) => {
    console.log("window close", code);
    if (code == 0) {
      notice.success({
        title: `上传成功`,
        duration: 3000,
      });
    } else {
      throw new Error(`上传失败`);
    }
  });
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

// async function getDir() {
//   const path = await window.api.openDirectory();
//   options.value.savePath = path;
// }

window.api.onMainNotify((_event, data) => {
  notice[data.type]({
    title: data.content,
    duration: 5000,
  });
});
</script>

<style scoped lang="less">
.radio-group {
  :deep(.n-radio) {
    align-items: center;
  }
}
</style>
