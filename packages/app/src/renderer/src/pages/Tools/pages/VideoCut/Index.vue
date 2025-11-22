<template>
  <div id="cut-tool" class="container">
    <!-- 上侧区域 -->
    <div class="upper-section">
      <!-- 左侧视频区域 -->
      <div class="video-section">
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
                timestamp: {
                  // position: { top: '10px', right: '10px' },
                  // visible: false,
                  timestamp: 0,
                },
              },
            }"
            :plugins="['ass', 'heatmap', 'timestamp']"
            @ready="handleVideoReady"
            @video:durationchange="handleVideoDurationChange"
            @video:canplay="handleVideoCanPlay"
          ></Artplayer>
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
            请导入视频或<a href="https://github.com/mifi/lossless-cut" target="_blank"
              >lossless-cut</a
            >项目文件，如果你不会使用，请先<span title="鸽了"
              >查看教程，如果视频无法播放，请尝试转封装为mp4</span
            >
          </template>
        </FileArea>
      </div>

      <!-- 右侧分段列表区域 -->
      <div class="segment-section">
        <div class="btns page-header">
          <ButtonGroup :options="exportOptions" @click="handleProjectBtnClick" size="small">{{
            videoTitle
          }}</ButtonGroup>
          <n-button
            class="cut-add-danmu"
            type="primary"
            :disabled="!files.videoPath"
            @click="handleDanmuChange"
            size="small"
          >
            {{ danmuTitle }}
          </n-button>

          <n-button
            class="cut-export"
            type="info"
            :disabled="!files.videoPath"
            @click="exportCuts"
            size="small"
          >
            导出
          </n-button>
        </div>
        <div class="segment-list-container">
          <SegmentList
            :danma-list="danmaList"
            :files="files"
            :danmaSearchMask="danmaSearchMask"
          ></SegmentList>
        </div>
      </div>
    </div>

    <!-- 下侧配置项区域 -->
    <div class="config-section">
      <div v-show="waveformVisible" class="waveform-container">
        <div v-if="waveformLoading" class="waveform-loading">
          <n-spin size="small" />
          <span>波形图加载中...</span>
        </div>
        <div id="waveform"></div>
      </div>
      <div v-if="clientOptions.showSetting" class="config-content">
        <n-checkbox v-model:checked="hotProgressVisible">高能进度条</n-checkbox>
        <template v-if="hotProgressVisible">
          <div class="config-item">
            <span>采样间隔：</span>
            <n-input-number
              v-model:value="clientOptions.sampling"
              placeholder="单位秒"
              min="1"
              style="width: 120px"
            >
              <template #suffix> 秒 </template>
            </n-input-number>
          </div>
          <div class="config-item">
            <span>高度：</span>
            <n-input-number
              v-model:value="clientOptions.height"
              placeholder="单位像素"
              min="10"
              style="width: 120px"
            >
              <template #suffix> 像素 </template>
            </n-input-number>
          </div>
          <div class="config-item">
            <!-- <span>颜色：</span> -->
            <n-color-picker v-model:value="clientOptions.color" style="width: 80px" />
          </div>
          <div class="config-item">
            <!-- <span>填充颜色：</span> -->
            <n-color-picker v-model:value="clientOptions.fillColor" style="width: 80px" />
          </div>
        </template>
        <n-checkbox v-model:checked="showVideoTime" title="仅供参考，得加载弹幕才成"
          >显示时间戳</n-checkbox
        >
        <n-checkbox v-model:checked="danmaSearchMask">弹幕搜索栏遮罩</n-checkbox>
        <n-checkbox v-model:checked="waveformVisible">波形图</n-checkbox>
      </div>
    </div>
  </div>
  <DanmuFactorySettingDailog
    v-model:visible="xmlConvertVisible"
    v-model="videoVCutOptions.danmuPresetId"
    :show-preset="true"
    @confirm="danmuConfirm"
    @cancel="convertDanmuLoading = false"
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
import { useConfirm } from "@renderer/hooks";
import WaveSurfer from "wavesurfer.js";
import ZoomPlugin from "wavesurfer.js/dist/plugins/zoom.esm.js";

import { useLlcProject } from "./hooks";
import { useDrive } from "@renderer/hooks/drive";
import hotkeys from "hotkeys-js";
import { useElementSize, toReactive } from "@vueuse/core";
import { sortBy } from "lodash-es";

// import type ArtplayerType from "artplayer";
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
  hotkeys("ctrl+s", function (event) {
    event.preventDefault();
    saveProject(files.value.originVideoPath);
  });
  // 另存为
  hotkeys("ctrl+shift+s", function (event) {
    event.preventDefault();
    saveAsAnother(files.value.originVideoPath);
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
  originVideoPath: string | null;
}>({
  videoPath: null,
  danmuPath: null,
  originDanmuPath: null,
  originVideoPath: null,
});
const videoTitle = computed(() => {
  return files.value.videoPath ? "替换视频" : "添加视频";
});
const danmuTitle = computed(() => {
  return files.value.danmuPath ? "替换弹幕" : "添加弹幕";
});

const openSubWindow = async () => {
  if (isWeb.value) {
    notice.warning({
      title: "网页版不支持打开新窗口~",
      duration: 2000,
    });
    return;
  }
  await window.api.common.createSubWindow();
};

const {
  selectedCuts,
  handleProjectClick,
  mediaPath,
  options: exportBtns,
  saveProject,
  saveAsAnother,
  handleProject,
  clean: cleanProject,
} = useLlcProject(files);

const { duration: videoDuration, rawCuts } = storeToRefs(useSegmentStore());
const { appConfig } = storeToRefs(useAppConfig());

const { undo, redo, clearHistory } = useSegmentStore();

const videoVCutOptions = toReactive(
  computed({
    get: () => appConfig.value.tool.videoCut,
    set: (value) => {
      appConfig.value.tool.videoCut = value;
    },
  }),
);

const exportOptions = computed(() => {
  const list = [
    { label: "导入项目文件", key: "importProject" },
    ...exportBtns.value,
    { label: "关闭", key: "closeVideo", disabled: !files.value.videoPath },
  ];
  if (!isWeb.value) {
    list.push({
      label: "打开独立窗口",
      key: "openSubWindow",
    });
  }
  return list;
});
const confirm = useConfirm();

const handleProjectBtnClick = async (key?: string | number) => {
  if (!key) {
    handleVideoChange();
    return;
  }

  if (key === "closeVideo") {
    const [status] = await confirm.warning({
      content: "是否确认关闭？相关数据将被清理，且无法恢复",
    });
    if (!status) return;

    handleVideo("");
    files.value.danmuPath = null;
    files.value.originDanmuPath = null;
    fileList.value = [];
    rawCuts.value = [];
    clearHistory();
    cleanProject();
    // @ts-ignore
    videoInstance.value.artplayerTimestamp.setTimestamp(0);
  } else if (key === "openSubWindow") {
    openSubWindow();
  } else {
    handleProjectClick(key, files.value.originVideoPath);
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

const videoInstance = ref<Artplayer | null>(null);
provide("videoInstance", videoInstance);
const handleVideoReady = (instance: Artplayer) => {
  videoInstance.value = instance;
  console.log("video ready", instance);
};

const handleVideoChange = async () => {
  const files = await showFileDialog({ extensions: supportedVideoExtensions });
  if (!files) return;

  const path = files?.[0];
  path && handleVideo(path);
};

const handleVideo = async (path: string) => {
  files.value.originVideoPath = path;
  if (ws) {
    ws.destroy();
    ws = null;
  }
  if (isWeb.value) {
    const { videoId, type } = await commonApi.applyVideoId(path);
    const videoUrl = await commonApi.getVideo(videoId);
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

let ws: WaveSurfer | null = null;
const waveformLoading = ref(false);
const handleVideoCanPlay = async () => {
  if (ws) return;
  // TODO: 还要测试m4s
  if (!videoInstance.value?.url.endsWith("mp4")) {
    notice.info({
      title: "波形图仅支持mp4格式的视频",
      duration: 2000,
    });
    waveformVisible.value = false;
    return;
  }
  waveformLoading.value = true;
  ws = WaveSurfer.create({
    container: "#waveform",
    waveColor: "#4F4A85",
    progressColor: "#383351",
    height: 64,
    normalize: false,
    dragToSeek: true,
    hideScrollbar: true,
    media: videoInstance.value!.video,
  });
  ws.registerPlugin(
    ZoomPlugin.create({
      // the amount of zoom per wheel step, e.g. 0.5 means a 50% magnification per scroll
      scale: 0.01,
      // Optionally, specify the maximum pixels-per-second factor while zooming
      maxZoom: 200,
    }),
  );
  ws.once("decode", () => {
    waveformLoading.value = false;
  });
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
  try {
    const { output } = await taskApi.convertXml2Ass(tempXmlFile.value, "随便填", config, {
      copyInput: true,
      removeOrigin: false,
      saveRadio: 2,
      temp: true,
      savePath: "",
      sync: true,
    });
    const content = await commonApi.readAss(output);
    files.value.danmuPath = output;
    videoRef.value?.switchAss(content);
  } finally {
    convertDanmuLoading.value = false;
  }
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
    if (data?.metadata?.video_start_time) {
      // @ts-ignore
      videoInstance.value.artplayerTimestamp.setTimestamp(data.metadata.video_start_time * 1000);
      switchShowVideoTime();
    }
  } else {
    throw new Error("不支持的文件类型");
  }

  if (!videoDuration.value) return;
  const data = await commonApi.genTimeData(file);

  // @ts-ignore
  videoInstance.value && videoInstance.value.artplayerPluginHeatmap.setData(data);
  setHotProgressVisible(hotProgressVisible.value);
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
  if (!isWeb.value) {
    videoCutDrive();
  }
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
const showVideoTime = useStorage("cut-show-video-time", true);
const waveformVisible = useStorage("cut-waveform-visible", true);

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

const setHotProgressVisible = (visible: boolean) => {
  if (!videoInstance.value) return;
  // @ts-ignore
  if (!videoInstance.value.artplayerPluginHeatmap) return;

  if (visible) {
    // @ts-ignore
    videoInstance.value.artplayerPluginHeatmap.show();
  } else {
    // @ts-ignore
    videoInstance.value.artplayerPluginHeatmap.hide();
  }
};

watch(hotProgressVisible, () => {
  setHotProgressVisible(hotProgressVisible.value);
});

watch(showVideoTime, () => {
  switchShowVideoTime();
});
const switchShowVideoTime = () => {
  if (!videoInstance.value) return;
  // @ts-ignore
  if (!videoInstance.value.artplayerTimestamp) return;

  // @ts-ignore
  if (showVideoTime.value) {
    // @ts-ignore
    videoInstance.value.artplayerTimestamp.show();
  } else {
    // @ts-ignore
    videoInstance.value.artplayerTimestamp.hide();
  }
};
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.upper-section {
  flex: 1;
  display: flex;
  gap: 10px;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.video-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;

  .video {
    width: 100%;
    height: 100%;
    position: relative;

    &.empty {
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 22px;
      &.cut-file-area {
        box-sizing: border-box;
      }
    }
  }
}

.segment-section {
  width: 245px;
  display: flex;
  flex-direction: column;
  min-height: 0;

  .btns {
    display: flex;
    justify-content: center;
    margin-bottom: 10px;
    gap: 6px;
    flex-shrink: 0;
  }
  .segment-list-container {
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 6px;
    scrollbar-gutter: stable;
    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(144, 147, 153, 0.3);
      border-radius: 3px;

      &:hover {
        background: rgba(144, 147, 153, 0.5);
      }
    }
  }
}

.config-section {
  flex-shrink: 0;
  border-top: 1px solid var(--border-color);
  padding: 15px 00px;
  background: #f9fafb;

  @media screen and (prefers-color-scheme: dark) {
    background: #1e1e1e;
  }
  // background: var(--n-color);

  .waveform-container {
    position: relative;
    min-height: 64px;
  }

  .waveform-loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    z-index: 1;

    span {
      font-size: 14px;
      color: #666;

      @media screen and (prefers-color-scheme: dark) {
        color: #999;
      }
    }
  }

  .config-content {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
    padding: 0 10px;
  }

  .config-item {
    display: flex;
    align-items: center;
    gap: 8px;

    span {
      white-space: nowrap;
      font-size: 14px;
    }
  }
}
</style>
