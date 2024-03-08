<!-- 压制&上传 -->
<template>
  <div>
    <div class="flex justify-center column align-center" style="margin-bottom: 20px">
      <div class="flex" style="gap: 10px">
        <n-button type="primary" @click="handleConvert"> 立即转换 </n-button>
        <!-- <n-button type="primary" @click="testNofity"> 测试发送通知 </n-button> -->
        <!-- <n-button type="primary" @click="hotProgressConvert"> 测试高能弹幕进度条生成 </n-button> -->
      </div>
    </div>

    <FileArea
      v-model="fileList"
      :extensions="['flv', 'mp4', 'ass', 'xml', 'm4s']"
      desc="请选择视频以及弹幕文件，如果为xml将自动转换为ass"
      :max="2"
    ></FileArea>
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
            <n-checkbox v-model:checked="clientOptions.removeOrigin"> 完成后移除源文件 </n-checkbox>
            <n-checkbox v-model:checked="clientOptions.openFolder"> 完成后打开文件夹 </n-checkbox>
            <n-checkbox v-model:checked="clientOptions.autoUpload"> 完成后自动上传 </n-checkbox>
            <n-checkbox v-model:checked="clientOptions.hotProgress"> 高能进度条 </n-checkbox>

            <div
              v-if="clientOptions.hotProgress"
              style="display: flex; gap: 20px; align-items: center; margin-top: 20px"
            >
              <div>
                采样间隔
                <n-input-number
                  v-model:value="clientOptions.hotProgressSample"
                  placeholder="单位秒"
                  min="1"
                  style="width: 140px"
                >
                  <template #suffix> 秒 </template></n-input-number
                >
              </div>
              <div>
                高度
                <n-input-number
                  v-model:value="clientOptions.hotProgressHeight"
                  placeholder="单位像素"
                  min="10"
                  style="width: 140px"
                >
                  <template #suffix> 像素 </template></n-input-number
                >
              </div>
              <div>
                <div>默认颜色</div>
                <n-color-picker
                  v-model:value="clientOptions.hotProgressColor"
                  style="width: 140px"
                />
              </div>
              <div>
                <div>覆盖颜色</div>
                <n-color-picker
                  v-model:value="clientOptions.hotProgressFillColor"
                  style="width: 140px"
                />
              </div>
            </div>
          </div>
        </div>
      </n-tab-pane>
      <n-tab-pane name="upload-setting" tab="上传设置" display-directive="show">
        <BiliSetting
          v-model="clientOptions.uploadPresetId"
          @change="handlePresetOptions"
        ></BiliSetting>
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
          <n-button
            v-if="danmuPresetId !== 'default'"
            ghost
            quaternary
            type="error"
            @click="deleteDanmu"
            >删除</n-button
          >
          <n-button type="primary" @click="renameDanmu">重命名</n-button>
          <n-button type="primary" @click="saveAsDanmu">另存为</n-button>
          <n-button type="primary" @click="saveDanmuPreset">保存</n-button>
        </div>
      </n-tab-pane>
      <n-tab-pane name="ffmpeg-setting" tab="ffmpeg设置" display-directive="show">
        <ffmpegSetting
          v-model="clientOptions.ffmpegPresetId"
          @change="handleFfmpegSettingChange"
        ></ffmpegSetting>
      </n-tab-pane>
    </n-tabs>

    <n-modal v-model:show="nameModelVisible">
      <n-card style="width: 600px" :bordered="false" role="dialog" aria-modal="true">
        <n-input
          v-model:value="tempPresetName"
          placeholder="请输入预设名称"
          maxlength="15"
          @keyup.enter="saveConfirm"
        />
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
import { useDanmuPreset, useUserInfoStore, useAppConfig } from "@renderer/stores";

import { deepRaw, uuid } from "@renderer/utils";
import { cloneDeep } from "lodash-es";

import type {
  File,
  FfmpegOptions,
  DanmuConfig,
  BiliupPreset,
  FfmpegPreset,
  hotProgressOptions,
} from "../../../../types";

const notice = useNotification();
const confirm = useConfirm();
const { danmuPresetsOptions, danmuPresetId, danmuPreset } = storeToRefs(useDanmuPreset());
const { getDanmuPresets } = useDanmuPreset();
const { userInfo } = storeToRefs(useUserInfoStore());
const { appConfig } = storeToRefs(useAppConfig());

const { handlePresetOptions, presetOptions } = useBili();

const fileList = ref<
  (File & {
    percentage?: number;
    percentageStatus?: "success" | "info" | "error";
    taskId?: string;
  })[]
>([]);

const clientOptions = appConfig.value.tool.home;

const handleConvert = async () => {
  convert();
};

type ClientOptions = typeof appConfig.value.tool.home;

const preHandle = async (
  files: File[],
  clientOptions: ClientOptions,
  danmuConfig: DanmuConfig,
  presetOptions: any,
) => {
  if (files.length === 0) {
    return false;
  }

  if (clientOptions.autoUpload) {
    await biliUpCheck(presetOptions);
  }

  const videoFile = files.find(
    (item) => item.ext === ".flv" || item.ext === ".mp4" || item.ext === ".m4s",
  );
  const danmuFile = files.find((item) => item.ext === ".xml" || item.ext === ".ass");
  const hasXmlFile = files.some((item) => item.ext === ".xml");

  if (!videoFile) {
    notice.error({
      title: "请选择一个flv、mp4、m4s文件",
      duration: 1000,
    });
    return false;
  }
  if (!danmuFile) {
    notice.error({
      title: "请选择一个xml或者ass文件",
      duration: 1000,
    });
    return false;
  }
  if (clientOptions.hotProgress && !hasXmlFile) {
    notice.error({
      title: "只有xml文件支持高能进度条",
      duration: 1000,
    });
    return false;
  }
  // 弹幕处理
  const videoMeta = await window.api.readVideoMeta(videoFile.path);
  const videoStream = videoMeta.streams.find((stream) => stream.codec_type === "video");
  const { width, height } = videoStream || {};
  if (danmuConfig.resolutionResponsive) {
    danmuConfig.resolution[0] = width!;
    danmuConfig.resolution[1] = height!;
  }

  if (width && danmuConfig.resolution[0] !== width && danmuConfig.resolution[1] !== height) {
    const status = await confirm.warning({
      content: `目标视频分辨率为${width}*${height}，与设置的弹幕分辨率不一致，是否继续？`,
    });
    if (!status) return false;
  }

  // 视频验证
  const file = await window.api.showSaveDialog({
    defaultPath: `${videoFile.name}-弹幕版.mp4`,
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
    videoWidth: width,
    duration: videoMeta.format.duration,
  };
};

const convert = async () => {
  const files = toRaw(fileList.value);
  const rawClientOptions = toRaw(clientOptions);
  const rawDanmuConfig = deepRaw(danmuPreset.value.config);
  const rawPresetOptions = toRaw(presetOptions.value);
  const rawFfmpegOptions = toRaw(ffmpegOptions.value);

  const data = await preHandle(files, rawClientOptions, rawDanmuConfig, rawPresetOptions);
  if (!data) return;
  let { inputDanmuFile } = data;
  const rawInputDanmuFile = inputDanmuFile;
  const { inputVideoFile, outputPath, videoWidth, duration } = data;
  // console.log("inputDanmuFile", inputDanmuFile, inputVideoFile, outputPath, rawOptions);

  if (inputDanmuFile.ext === ".xml") {
    // xml文件转换
    const targetAssFile = await handleXmlFile(
      inputDanmuFile,
      { ...rawClientOptions, removeOrigin: false },
      rawDanmuConfig,
    );
    console.log("targetAssFilePath", targetAssFile);
    inputDanmuFile = targetAssFile;
  }

  let hotProgressInput: string | undefined = undefined;
  if (rawClientOptions.hotProgress) {
    hotProgressInput = await genHotProgress(inputDanmuFile.path, {
      width: videoWidth!,
      duration: duration!,
      interval: rawClientOptions.hotProgressSample,
      height: rawClientOptions.hotProgressHeight,
      color: rawClientOptions.hotProgressColor,
      fillColor: rawClientOptions.hotProgressFillColor,
    });
  }

  // 压制任务
  const output = await handleVideoMerge(
    {
      inputVideoFilePath: inputVideoFile?.path,
      inputAssFilePath: inputDanmuFile.path,
      inputHotProgressFilePath: hotProgressInput,
      outputPath: outputPath,
      rawInputDanmuFile: rawInputDanmuFile,
    },
    rawClientOptions,
    rawFfmpegOptions,
  );

  if (rawClientOptions.autoUpload) {
    await upload(output, rawPresetOptions);
  }

  if (rawClientOptions.removeOrigin) {
    window.api.trashItem(inputVideoFile.path);
    window.api.trashItem(rawInputDanmuFile.path);
  }
  if (rawClientOptions.openFolder) {
    window.api.common.showItemInFolder(outputPath);
  }
};

// const hotProgressConvert = async () => {
//   const input = toRaw(fileList.value)[0].path;
//   const file = await genHotProgress(input, {
//     width: 1920,
//     duration: 60 * 60 * 2,
//     interval: clientOptions.value.hotProgressSample,
//     height: clientOptions.value.hotProgressHeight,
//     color: clientOptions.value.hotProgressColor,
//     fillColor: clientOptions.value.hotProgressFillColor,
//   });
//   console.log("file", file);
// };

/**
 * 处理高能进度条
 */
const genHotProgress = async (input: string, options: hotProgressOptions): Promise<string> => {
  return new Promise((resolve, reject) => {
    const outputPath = `${window.path.join(window.api.common.getTempPath(), uuid())}.mp4`;
    window.api.danmu.genHotProgress(input, outputPath, options).then((result: any) => {
      const taskId = result.taskId;
      window.api.task.on(taskId, "end", (data) => {
        console.log("end", data);
        notice.success({
          title: "高能进度条转换成功",
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

// 处理xml文件
const handleXmlFile = async (danmuFile: File, options: ClientOptions, danmuConfig: DanmuConfig) => {
  const isEmpty = await window.api.danmu.isEmptyDanmu(danmuFile.path);
  if (isEmpty) {
    const msg = "弹幕文件中不存在弹幕，无需压制";
    notice.warning({
      title: msg,
      duration: 1000,
    });
    throw new Error(msg);
  }
  notice.warning({
    title: "开始转换xml",
    duration: 1000,
  });

  const outputPath = `${window.path.join(window.api.common.getTempPath(), uuid())}.ass`;
  // console.log("outputPath", outputPath);
  const targetAssFilePath = await convertDanmu2Ass(
    {
      input: danmuFile.path,
      output: outputPath,
    },
    options,
    danmuConfig,
  );

  return window.api.formatFile(targetAssFilePath);
};

/**
 * xml文件转换为ass
 */
const convertDanmu2Ass = async (
  fileOptions: {
    input: string;
    output: string;
  },
  options: ClientOptions,
  config: DanmuConfig,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    window.api.danmu.convertXml2Ass([fileOptions], config, options).then((result: any) => {
      if (result[0].output) {
        resolve(result[0].output);
      } else {
        const taskId = result[0].taskId;
        window.api.task.on(taskId, "end", (data) => {
          // console.log("end", data);
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
    inputHotProgressFilePath: string | undefined;
    rawInputDanmuFile: File;
  },
  options: ClientOptions,
  ffmpegOptions: FfmpegOptions,
) => {
  const { inputVideoFilePath, inputAssFilePath, outputPath, inputHotProgressFilePath } =
    convertOptions;
  notice.info({
    title: "已加入队列，根据不同设置压制需要消耗大量时间，CPU，GPU，期间请勿关闭本软件",
    duration: 3000,
  });

  let output: string;
  try {
    output = await createMergeVideoAssTask(
      inputVideoFilePath,
      inputAssFilePath,
      inputHotProgressFilePath,
      outputPath,
      deepRaw(options),
      ffmpegOptions,
    );
  } catch (err) {
    let msg = "转换失败";
    if (err) {
      msg = msg + err;
    }
    throw new Error(msg);
  } finally {
    if (convertOptions.rawInputDanmuFile.ext === ".xml") {
      window.api.trashItem(convertOptions.inputAssFilePath);
    }
  }

  return output;
};

// 压制任务
const createMergeVideoAssTask = async (
  videoFilePath: string,
  assFilePath: string,
  hotProgressFilePath: string | undefined,
  outputPath: string,
  options: ClientOptions,
  ffmpegOptions: FfmpegOptions,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    window.api
      .mergeAssMp4(
        {
          videoFilePath: videoFilePath,
          assFilePath: assFilePath,
          outputPath: outputPath,
          hotProgressFilePath: hotProgressFilePath,
        },
        { ...options, removeOrigin: false },
        ffmpegOptions,
      )
      .then(({ taskId, output }: { taskId?: string; output?: string }) => {
        if (!taskId) return resolve(output as string);
        fileList.value = [];

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
  const hasLogin = !!userInfo.value.uid;
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

  await window.api.bili.uploadVideo(userInfo.value.uid, [file], presetOptions.config);
};

// @ts-ignore
const ffmpegOptions: Ref<FfmpegOptions> = ref({});
const handleFfmpegSettingChange = (preset: FfmpegPreset) => {
  ffmpegOptions.value = preset.config;
};

const simpledMode = ref(true);

const handleDanmuChange = (value: DanmuConfig) => {
  danmuPreset.value.config = value;
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

const saveDanmuPreset = async () => {
  const preset = cloneDeep(danmuPreset.value);

  await window.api.danmu.savePreset(preset);
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

window.api.onBiliUploadClose((_event, code, pathArray) => {
  console.log("window close", code);
  if (code == 0) {
    notice.success({
      title: `${pathArray.join(",")} 上传成功`,
      duration: 3000,
    });
  } else {
    notice.error({
      title: `${pathArray.join(",")} 上传失败`,
      duration: 3000,
    });
  }
});

// const testNofity = () => {
//   window.api.task.notify("我是标题", "我是内容请31312313213");
// };
</script>

<style scoped lang="less">
.radio-group {
  :deep(.n-radio) {
    align-items: center;
  }
}
</style>
