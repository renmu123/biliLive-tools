<template>
  <div id="cut-tool" class="container">
    <div class="btns page-header">
      <ButtonGroup
        title="请选择项目文件，兼容LosslessCut项目文件"
        :options="exportOptions"
        @click="handleProjectBtnClick"
        v-if="!isWeb"
        >导入项目文件</ButtonGroup
      >
      <n-button type="primary" @click="handleVideoChange"> {{ videoTitle }} </n-button>
      <n-button
        class="cut-add-danmu"
        type="primary"
        :disabled="!files.videoPath"
        @click="handleDanmuChange"
      >
        {{ danmuTitle }}
      </n-button>

      <n-button class="cut-export" type="info" :disabled="!files.videoPath" @click="exportCuts">
        导出切片
      </n-button>
    </div>

    <div class="content">
      <div v-show="files.videoPath" class="video cut-video">
        <Artplayer
          v-show="files.videoPath"
          ref="videoRef"
          :option="{
            fullscreen: true,
            plugins: {
              heatmap: {
                option: clientOptions,
              },
            },
          }"
          :plugins="['ass', 'heatmap']"
          @ready="handleVideoReady"
          @video:durationchange="handleVideoDurationChange"
        ></Artplayer>
        <div
          v-if="clientOptions.showSetting"
          style="display: flex; gap: 20px; align-items: center; margin-top: 20px"
        >
          <n-checkbox v-model:checked="hotProgressVisible"></n-checkbox>
          <div>
            <n-input-number
              v-model:value="clientOptions.sampling"
              placeholder="单位秒"
              min="1"
              style="width: 140px"
            >
              <template #suffix> 秒 </template></n-input-number
            >
          </div>
          <div>
            <n-input-number
              v-model:value="clientOptions.height"
              placeholder="单位像素"
              min="10"
              style="width: 140px"
            >
              <template #suffix> 像素 </template></n-input-number
            >
          </div>
          <div>
            <n-color-picker v-model:value="clientOptions.color" style="width: 140px" />
          </div>
          <div>
            <n-color-picker v-model:value="clientOptions.fillColor" style="width: 140px" />
          </div>
          <n-checkbox v-model:checked="danmaSearchMask">弹幕搜索栏遮罩</n-checkbox>
        </div>
      </div>

      <FileArea
        v-show="!files.videoPath"
        v-model="fileList"
        :style="{ height: '100%' }"
        class="video empty cut-file-area"
        :extensions="['llc', 'flv', 'mp4', 'm4s', 'ts', 'mkv']"
        :max="1"
        @change="handleFileChange"
      >
        <template #desc>
          请导入视频或<a href="https://github.com/mifi/lossless-cut" target="_blank">lossless-cut</a
          >项目文件，如果你不会使用，请先<span title="鸽了">查看教程</span>
        </template>
      </FileArea>
      <div class="cut-list">
        <SegmentList
          :danma-list="danmaList"
          :files="files"
          :danmaSearchMask="danmaSearchMask"
        ></SegmentList>
      </div>
    </div>
  </div>
  <DanmuFactorySettingDailog
    v-model:visible="xmlConvertVisible"
    v-model="videoVCutOptions.danmuPresetId"
    :show-preset="true"
    @confirm="danmuConfirm"
  ></DanmuFactorySettingDailog>
  <ExportModal v-model="exportVisible" :files="files"></ExportModal>
</template>

<script setup lang="ts">
defineOptions({
  name: "videoCut",
});
import { supportedVideoExtensions } from "@renderer/utils";
import Artplayer from "@renderer/components/Artplayer/Index.vue";
import ButtonGroup from "@renderer/components/ButtonGroup.vue";
import DanmuFactorySettingDailog from "@renderer/components/DanmuFactorySettingDailog.vue";
import { useSegmentStore, useAppConfig } from "@renderer/stores";
import ExportModal from "./components/ExportModal.vue";
import SegmentList from "./components/SegmentList.vue";
import { useStorage } from "@vueuse/core";
import { showFileDialog } from "@renderer/utils/fileSystem";
import { taskApi, commonApi } from "@renderer/apis";

import { useLlcProject } from "./hooks";
import { useDrive } from "@renderer/hooks/drive";
import hotkeys from "hotkeys-js";
import { useElementSize, toReactive } from "@vueuse/core";
import { sortBy } from "lodash-es";

import type ArtplayerType from "artplayer";
import type { DanmuConfig, DanmuItem } from "@biliLive-tools/types";

onActivated(() => {
  // 撤销
  hotkeys("ctrl+z", function () {
    undo();
  });
  // 重做
  hotkeys("ctrl+shift+z", function () {
    redo();
  });
  // 保存
  hotkeys("ctrl+s", function () {
    saveProject();
  });
  // 另存为
  hotkeys("ctrl+shift+s", function () {
    saveAsAnother();
  });
  // 导出
  hotkeys("ctrl+enter", function () {
    exportCuts();
  });
  // 播放/暂停
  hotkeys("space", function (event) {
    // @ts-ignore
    if (event?.target?.tagName === "BUTTON") return;
    // @ts-ignore
    if (event?.target?.className.includes("artplayer")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    videoToggle();
  });
  // 慢速快进
  hotkeys("ctrl+left", function () {
    if (!videoInstance.value) return;
    videoInstance.value.backward = 1;
  });
  // 慢速后退
  hotkeys("ctrl+right", function () {
    if (!videoInstance.value) return;

    videoInstance.value.forward = 1;
  });
});

onDeactivated(() => {
  hotkeys.unbind();
});
onUnmounted(() => {
  hotkeys.unbind();
});

const notice = useNotification();
const isWeb = ref(window.isWeb);

const files = ref<{
  videoPath: string | null;
  danmuPath: string | null;
  originDanmuPath: string | null;
}>({
  videoPath: null,
  danmuPath: null,
  originDanmuPath: null,
});
const videoTitle = computed(() => {
  return files.value.videoPath ? "替换视频" : "添加视频";
});
const danmuTitle = computed(() => {
  return files.value.danmuPath ? "替换弹幕" : "添加弹幕";
});

const {
  selectedCuts,
  handleProjectClick,
  mediaPath,
  options: exportBtns,
  saveProject,
  saveAsAnother,
  handleProject,
} = useLlcProject(files);

const { duration: videoDuration, rawCuts } = storeToRefs(useSegmentStore());
const { appConfig } = storeToRefs(useAppConfig());

const { undo, redo } = useSegmentStore();

const videoVCutOptions = toReactive(
  computed({
    get: () => appConfig.value.tool.videoCut,
    set: (value) => {
      appConfig.value.tool.videoCut = value;
    },
  }),
);

const exportOptions = computed(() => {
  return [
    ...exportBtns.value,
    { label: "关闭视频", key: "closeVideo", disabled: !files.value.videoPath },
  ];
});

const handleProjectBtnClick = (key?: string | number) => {
  if (key === "closeVideo") {
    handleVideo("");
    fileList.value = [];
    rawCuts.value = [];
  } else {
    handleProjectClick(key);
  }
};

watchEffect(async () => {
  if (mediaPath.value) {
    const videoPath = mediaPath.value;
    await handleVideo(videoPath);

    if (!isWeb.value) {
      const { dir, name } = window.path.parse(mediaPath.value);
      const assFilepath = window.path.join(dir, `${name}.ass`);
      if (await window.api.exits(assFilepath)) {
        handleDanmu(assFilepath);
      } else {
        const xmlFilepath = window.path.join(dir, `${name}.xml`);
        if (await window.api.exits(xmlFilepath)) {
          handleDanmu(xmlFilepath);
        }
      }
    }
  }
});

const videoRef = ref<InstanceType<typeof Artplayer> | null>(null);
// @ts-ignore
const { width: videoWidth } = useElementSize(videoRef);

const videoInstance = ref<ArtplayerType | null>(null);
provide("videoInstance", videoInstance);
const handleVideoReady = (instance: ArtplayerType) => {
  videoInstance.value = instance;
};

const handleVideoChange = async () => {
  const files = await showFileDialog({ extensions: supportedVideoExtensions });
  if (!files) return;

  const path = files?.[0];
  path && handleVideo(path);
};

const handleVideo = async (path: string) => {
  if (isWeb.value) {
    const { videoId, type } = await commonApi.applyVideoId(path);
    const videoUrl = await commonApi.getVideo(videoId);
    console.log(videoUrl);
    files.value.videoPath = videoUrl;
    await videoRef.value?.switchUrl(videoUrl, type as any);
  } else {
    files.value.videoPath = path;
    await videoRef.value?.switchUrl(path, path.endsWith(".flv") ? "flv" : "");
  }

  if (files.value.danmuPath) {
    const content = await commonApi.readAss(files.value.danmuPath);
    videoRef?.value?.switchAss(content);
  }
};

/**
 * 视频时长变化
 */
const handleVideoDurationChange = (duration: number) => {
  videoDuration.value = duration;
};

// 弹幕相关
const xmlConvertVisible = ref(false);
const tempXmlFile = ref("");
const convertDanmuLoading = ref(false);
const handleDanmuChange = async () => {
  const files = await showFileDialog({ extensions: ["ass", "xml"] });
  if (!files) return;

  const path = files?.[0];
  path && handleDanmu(path);
};

/**
 * 处理弹幕
 */
const handleDanmu = async (path: string) => {
  files.value.originDanmuPath = path;

  if (path.endsWith(".ass")) {
    const content = await commonApi.readAss(path);
    files.value.danmuPath = path;

    videoRef.value?.switchAss(content);
  } else {
    // 如果是xml文件则弹框提示，要求转换为ass文件
    xmlConvertVisible.value = true;
    tempXmlFile.value = path;
    convertDanmuLoading.value = true;
  }
  generateDanmakuData(path);
};

const danmuConfirm = async (config: DanmuConfig) => {
  if (config.resolutionResponsive) {
    const width = videoInstance.value?.video.videoWidth;
    const height = videoInstance.value?.video.videoHeight;
    config.resolution[0] = width!;
    config.resolution[1] = height!;
  }
  const { output } = await taskApi.convertXml2Ass(tempXmlFile.value, "随便填", config, {
    copyInput: true,
    removeOrigin: false,
    saveRadio: 2,
    temp: true,
    savePath: "",
    sync: true,
  });
  const content = await commonApi.readAss(output);
  convertDanmuLoading.value = false;
  files.value.danmuPath = output;
  videoRef.value?.switchAss(content);
};

const danmaList = ref<DanmuItem[]>([]);
/**
 * 生成高能进度条数据和sc等数据
 */
const generateDanmakuData = async (file: string) => {
  if (file.endsWith(".ass")) {
    danmaList.value = [];
  } else if (file.endsWith(".xml")) {
    const data = await commonApi.parseDanmu(file);
    danmaList.value = sortBy([...data.sc, ...data.danmu], "ts");
  } else {
    throw new Error("不支持的文件类型");
  }

  if (!videoDuration.value) return;
  const data = await commonApi.genTimeData(file);

  // @ts-ignore
  videoInstance.value && videoInstance.value.artplayerPluginHeatmap.setData(data);
};

const exportVisible = ref(false);
const exportCuts = async () => {
  if (selectedCuts.value.length === 0) {
    notice.error({
      title: "没有需要导出的切片",
      duration: 1000,
    });
    return;
  }
  if (!files.value.videoPath) {
    notice.error({
      title: "请先选择视频文件",
      duration: 1000,
    });
    return;
  }

  if (convertDanmuLoading.value) {
    notice.error({
      title: "弹幕转换中，请稍后",
      duration: 1000,
    });
    return;
  }
  exportVisible.value = true;
};

/**
 * 视频状态切换
 */
const videoToggle = () => {
  if (!videoInstance.value) return;
  if (!videoInstance.value.url) return;
  videoInstance.value.toggle();
};

const fileList = ref<any[]>([]);
const handleFileChange = (fileList: any[]) => {
  if (!fileList.length) return;
  const file = fileList[0];
  const { path, ext } = file;

  if (ext === ".llc") {
    handleProject(path);
  } else {
    handleVideo(path);
  }
};

const { videoCutDrive } = useDrive();
onMounted(() => {
  videoCutDrive();
});

const clientOptions = useStorage("cut-hotprogress", {
  showSetting: true,
  sampling: 10,
  height: 50,
  fillColor: "#f9f5f3",
  color: "#333333",
});
const hotProgressVisible = useStorage("cut-hotprogress-visible", true);
const danmaSearchMask = useStorage("cut-danma-search-mask", true);

watch(
  clientOptions,
  () => {
    if (!videoInstance.value) return;
    // @ts-ignore
    if (!videoInstance.value.artplayerPluginHeatmap) return;
    // @ts-ignore
    videoInstance.value.artplayerPluginHeatmap.setOptions(clientOptions.value);
  },
  {
    deep: true,
  },
);

watch(hotProgressVisible, () => {
  if (!videoInstance.value) return;
  // @ts-ignore
  if (!videoInstance.value.artplayerPluginHeatmap) return;

  // @ts-ignore
  if (hotProgressVisible.value) {
    // @ts-ignore
    videoInstance.value.artplayerPluginHeatmap.show();
  } else {
    // @ts-ignore
    videoInstance.value.artplayerPluginHeatmap.hide();
  }
});
</script>

<style scoped lang="less">
.btns {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  gap: 10px;
}

.content {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  .video {
    width: 80%;
    aspect-ratio: 16 / 9;
    position: relative;

    &.empty {
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 22px;
    }
  }
  .cut-list {
    display: inline-block;
    flex: 1;
  }
}
</style>
