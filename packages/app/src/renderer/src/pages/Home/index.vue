<!-- 压制&上传 -->
<template>
  <div>
    <div class="flex justify-center column align-center" style="margin-bottom: 20px">
      <div class="flex" style="gap: 10px">
        <n-button title="仅供参考，以实际渲染为主！" @click="preview"> 预览 </n-button>
        <n-button
          type="primary"
          style="display: none"
          title="某些情况下你可能需要这个功能"
          @click="sendToWebhook"
        >
          发送至webhook
        </n-button>
        <n-button type="primary" @click="handleConvert" title="启动！(ctrl+enter)">
          启动！
        </n-button>
        <!-- <n-button type="primary" @click="hotProgressConvert"> 测试高能弹幕进度条生成 </n-button> -->
      </div>
    </div>

    <FileArea
      v-model="fileList"
      :extensions="['flv', 'mp4', 'ass', 'xml', 'm4s', 'ts', 'mkv']"
      desc="将视频和弹幕压制到一个文件中，请选择视频以及弹幕文件，如果为xml将自动转换为ass"
      :max="2"
    ></FileArea>
    <n-tabs type="segment" style="margin-top: 10px" class="tabs">
      <n-tab-pane name="common-setting" tab="基础设置" display-directive="show:lazy">
        <div class="flex column">
          <div></div>
          <div style="margin-top: 10px">
            <!-- <n-checkbox v-model:checked="clientOptions.removeOrigin"> 完成后移除源文件 </n-checkbox> -->
            <n-checkbox v-model:checked="clientOptions.hotProgress"> 高能进度条 </n-checkbox>
            <n-checkbox v-model:checked="clientOptions.autoUpload"> 完成后自动上传 </n-checkbox>
            <template v-if="clientOptions.autoUpload">
              <n-button ghost type="primary" @click="appendVideoVisible = true">
                续传 <span v-if="aid">(已选择)</span>
              </n-button>
              <n-checkbox
                v-model:checked="clientOptions.removeOriginAfterUploadCheck"
                style="margin-left: 10px"
              >
                审核后通过删除源文件
              </n-checkbox>
            </template>

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
          <n-checkbox v-model:checked="simpledMode"> 简易配置 </n-checkbox>
          <n-button v-if="danmuPresetId !== 'default'" text type="error" @click="deleteDanmu"
            >删除</n-button
          >
          <ButtonGroup :options="actionBtns" @click="handleActionClick">保存</ButtonGroup>
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

    <AppendVideoDialog v-model:visible="appendVideoVisible" v-model="aid"></AppendVideoDialog>
    <PreviewModal
      v-model:visible="previewModalVisible"
      :files="previewFiles"
      :hotProgress="{
        visible: clientOptions.hotProgress,
        sampling: clientOptions.hotProgressSample,
        height: clientOptions.hotProgressHeight,
        color: clientOptions.hotProgressColor,
        fillColor: clientOptions.hotProgressFillColor,
      }"
    ></PreviewModal>
    <sendWebhookModal v-model:visible="webhookVisible" :files="previewFiles"></sendWebhookModal>
  </div>
</template>

<script setup lang="ts">
import { useStorage, toReactive } from "@vueuse/core";

import FileArea from "@renderer/components/FileArea.vue";
import DanmuFactorySetting from "@renderer/components/DanmuFactorySetting.vue";
import BiliSetting from "@renderer/components/BiliSetting.vue";
import ffmpegSetting from "./components/ffmpegSetting.vue";
import PreviewModal from "./components/previewModal.vue";
import sendWebhookModal from "./components/sendWebhookModal.vue";
import { useConfirm, useBili } from "@renderer/hooks";
import { useDanmuPreset, useUserInfoStore, useAppConfig, useQueueStore } from "@renderer/stores";
import { danmuPresetApi, taskApi, commonApi } from "@renderer/apis";
import hotkeys from "hotkeys-js";
import { deepRaw, uuid } from "@renderer/utils";
import { cloneDeep } from "lodash-es";
import { showSaveDialog } from "@renderer/utils/fileSystem";
import ButtonGroup from "@renderer/components/ButtonGroup.vue";
import { usePresetFile } from "@renderer/hooks/danmuPreset";

import type { File, FfmpegOptions, DanmuConfig, FfmpegPreset } from "@biliLive-tools/types";

defineOptions({
  name: "Home",
});

onActivated(() => {
  hotkeys("ctrl+enter", function () {
    handleConvert();
  });
});
onDeactivated(() => {
  hotkeys.unbind();
});
onUnmounted(() => {
  hotkeys.unbind();
});

const notice = useNotification();
const confirm = useConfirm();
const { danmuPresetsOptions, danmuPresetId, danmuPreset } = storeToRefs(useDanmuPreset());
const { getDanmuPresets } = useDanmuPreset();
const { userInfo } = storeToRefs(useUserInfoStore());
const { appConfig } = storeToRefs(useAppConfig());
const quenuStore = useQueueStore();

const { handlePresetOptions, presetOptions } = useBili();
const isWeb = computed(() => window.isWeb);

const fileList = ref<
  (File & {
    taskId?: string;
  })[]
>([]);

const clientOptions = toReactive(
  computed({
    get: () => appConfig.value.tool.home,
    set: (value) => {
      appConfig.value.tool.home = value;
    },
  }),
);

type ClientOptions = typeof appConfig.value.tool.home;

const preHandle = async (files: File[], clientOptions: ClientOptions, danmuConfig: DanmuConfig) => {
  if (files.length === 0) {
    return false;
  }

  if (ffmpegOptions.value.encoder === "copy") throw new Error("视频编码不能为copy");
  if (clientOptions.autoUpload) await biliUpCheck();

  const videoFile = files.find(
    (item) =>
      item.ext === ".flv" ||
      item.ext === ".mp4" ||
      item.ext === ".m4s" ||
      item.ext === ".ts" ||
      item.ext === ".mkv",
  );
  const danmuFile = files.find((item) => item.ext === ".xml" || item.ext === ".ass");

  if (!videoFile) {
    notice.error({
      title: "请选择一个flv、mp4、m4s、ts、mkv文件",
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

  if (danmuFile.ext === ".xml") {
    // 弹幕处理
    const videoMeta = await taskApi.readVideoMeta(videoFile.path);
    const videoStream = videoMeta?.streams?.find((stream) => stream.codec_type === "video");
    const { width, height } = videoStream || {};

    if (
      width &&
      !danmuConfig.resolutionResponsive &&
      danmuConfig.resolution[0] !== width &&
      danmuConfig.resolution[1] !== height
    ) {
      const [status] = await confirm.warning({
        content: `目标视频分辨率为${width}*${height}，与设置的弹幕分辨率不一致，是否继续？`,
        showCheckbox: true,
        showAgainKey: "danmuResolution",
      });
      if (!status) return false;
    }
  }

  return {
    inputVideoFile: videoFile,
    inputDanmuFile: danmuFile,
  };
};

const handleConvert = async () => {
  const files = toRaw(fileList.value);
  const rawClientOptions = toRaw(clientOptions);

  const data = await preHandle(files, rawClientOptions, danmuPreset.value.config);
  if (!data) return;
  if (clientOptions.autoUpload && !aid.value) {
    if (presetOptions.value.config.copyright === 2 && !presetOptions.value.config.source) {
      notice.error({
        title: `稿件类型为转载时转载来源不能为空`,
        duration: 1000,
      });
      return;
    }
  }
  // 视频验证
  // const outputPath = await window.api.showSaveDialog({
  //   defaultPath: `${data.inputVideoFile.name}-弹幕版.mp4`,
  //   filters: [
  //     { name: "视频文件", extensions: ["mp4"] },
  //     { name: "所有文件", extensions: ["*"] },
  //   ],
  // });
  const outputPath = await showSaveDialog({
    defaultPath: `${data.inputVideoFile.name}-弹幕版.mp4`,
  });
  if (!outputPath) return;

  const { inputVideoFile, inputDanmuFile } = data;
  await taskApi.burn(
    {
      videoFilePath: inputVideoFile.path,
      subtitleFilePath: inputDanmuFile.path,
    },
    outputPath,
    {
      danmaOptions: danmuPreset.value.config,
      ffmpegOptions: ffmpegOptions.value,
      hotProgressOptions: {
        interval: rawClientOptions.hotProgressSample,
        height: rawClientOptions.hotProgressHeight,
        color: rawClientOptions.hotProgressColor,
        fillColor: rawClientOptions.hotProgressFillColor,
      },
      hasHotProgress: rawClientOptions.hotProgress,
      override: true,
      uploadOptions: {
        upload: rawClientOptions.autoUpload,
        config: presetOptions.value.config,
        aid: aid.value,
        filePath: outputPath,
        uid: userInfo.value.uid!,
        removeOriginAfterUploadCheck: rawClientOptions.removeOriginAfterUploadCheck,
      },
    },
  );
  fileList.value = [];
};

const biliUpCheck = async () => {
  const hasLogin = !!userInfo.value.uid;
  if (!hasLogin) {
    throw new Error(`请先进行登录`);
  }

  return true;
};

// 续传任务
const appendVideoVisible = ref(false);
const aid = ref();

// @ts-ignore
const ffmpegOptions: Ref<FfmpegOptions> = ref({});
const handleFfmpegSettingChange = (preset: FfmpegPreset) => {
  ffmpegOptions.value = preset.config;
};

const simpledMode = useStorage("simpledMode", false);

const handleDanmuChange = (value: DanmuConfig) => {
  danmuPreset.value.config = value;
};

window?.api?.onMainNotify((_event, data) => {
  notice[data.type]({
    title: data.content,
    duration: 5000,
  });
});

// 预览
const previewModalVisible = ref(false);
const previewFiles = ref({
  video: "",
  danmu: "",
  type: "",
});
const preview = async () => {
  const files = toRaw(fileList.value);
  const rawClientOptions = toRaw(clientOptions);
  const rawDanmuConfig = deepRaw(danmuPreset.value.config);

  const data = await preHandle(files, rawClientOptions, rawDanmuConfig);
  if (!data) return;

  if (isWeb.value) {
    const { videoId, type } = await commonApi.applyVideoId(data.inputVideoFile.path);
    const videoUrl = await commonApi.getVideo(videoId);
    previewFiles.value.video = videoUrl;
    previewFiles.value.type = type;
  } else {
    previewFiles.value.video = data.inputVideoFile.path;
    if (data.inputVideoFile.path.endsWith(".flv")) {
      previewFiles.value.type = "flv";
    }
  }

  previewModalVisible.value = true;

  if (data.inputDanmuFile.path.endsWith(".xml")) {
    previewFiles.value.danmu = "";
    // TODO: 有bug
    const { output } = await taskApi.convertXml2Ass(
      data.inputDanmuFile.path,
      "随便取个名字",
      rawDanmuConfig,
      {
        removeOrigin: false,
        saveRadio: 2,
        savePath: "",
        temp: true,
        sync: true,
      },
    );

    previewFiles.value.danmu = output;
  } else if (data.inputDanmuFile.path.endsWith(".ass")) {
    previewFiles.value.danmu = data.inputDanmuFile.path;
  }
};

const webhookVisible = ref(false);
const sendToWebhook = () => {
  const videoFile = fileList.value.find(
    (item) =>
      item.ext === ".flv" || item.ext === ".mp4" || item.ext === ".m4s" || item.ext === ".ts",
  );
  const danmuFile = fileList.value.find((item) => item.ext === ".xml" || item.ext === ".ass");

  if (!videoFile) {
    notice.error({
      title: "请选择一个flv、mp4、m4s、ts文件",
      duration: 1000,
    });
    return;
  }

  previewFiles.value.video = videoFile.path;
  previewFiles.value.danmu = danmuFile?.path || "";

  webhookVisible.value = true;
  return;
};

let eventSource: EventSource | null = null;
async function getRunningTaskNum() {
  if (eventSource && eventSource?.readyState !== 2) return;
  eventSource = await commonApi.getRunningTaskNum();

  eventSource.onmessage = function (event) {
    const data = JSON.parse(event.data || "{}");
    quenuStore.setRunningTaskNum(data.num);
  };
}
onActivated(() => {
  getRunningTaskNum();
});

// 弹幕预设相关
const { exportPreset, importPreset } = usePresetFile();
const actionBtns = ref([
  { label: "另存为", key: "saveAnother" },
  { label: "重命名", key: "rename" },
  { label: "导出", key: "export" },
  { label: "导入", key: "import" },
]);
const handleActionClick = async (key?: string | number) => {
  switch (key) {
    case "saveAnother":
      saveAsDanmu();
      break;
    case "rename":
      renameDanmu();
      break;
    case "export":
      exportPreset(danmuPreset.value.config, danmuPreset.value.name);
      break;
    case "import":
      importPreset();
      break;
    case undefined:
      saveDanmuPreset();
      break;
  }
};

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
  const [status] = await confirm.warning({
    content: "是否确认删除该预设？",
  });
  if (!status) return;
  await danmuPresetApi.remove(danmuPresetId.value);
  // @ts-ignore
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

  await danmuPresetApi.save(preset);
  nameModelVisible.value = false;
  notice.success({
    title: "保存成功",
    duration: 1000,
  });
  getDanmuPresets();
  if (isRename.value) {
    danmuPreset.value.name = tempPresetName.value;
  }
};

const saveDanmuPreset = async () => {
  const preset = cloneDeep(danmuPreset.value);

  await danmuPresetApi.save(preset);
  notice.success({
    title: "保存成功",
    duration: 1000,
  });
  getDanmuPresets();
};
</script>

<style scoped lang="less">
.radio-group {
  :deep(.n-radio) {
    align-items: center;
  }
}
</style>
