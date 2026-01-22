<template>
  <div id="cut-tool" class="container">
    <!-- 上侧区域 -->
    <div class="upper-section">
      <!-- 左侧视频区域 -->
      <VideoPlayer
        ref="videoPlayerRef"
        :video-path="files.videoPath"
        :heatmap-options="clientOptions"
        @ready="handleVideoReady"
        @duration-change="handleVideoDurationChange"
        @files-dropped="handleDroppedFiles"
      />

      <!-- 右侧分段列表区域 -->
      <div class="segment-section">
        <div class="btns page-header">
          <ButtonGroup :options="projectMenuItems" @click="handleProjectMenuClick" size="small"
            >添加/替换</ButtonGroup
          >

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
    <ConfigPanel
      :client-options="clientOptions"
      v-model:hot-progress-visible="hotProgressVisible"
      v-model:show-video-time="showVideoTime"
      v-model:danma-search-mask="danmaSearchMask"
      v-model:waveform-visible="waveformVisible"
      :waveform-loading="waveformLoading"
    />
  </div>
  <DanmuFactorySettingDailog
    v-model:visible="xmlConvertVisible"
    v-model="videoVCutOptions.danmuPresetId"
    :show-preset="true"
    @confirm="handleConfirmConvertDanmu"
    @cancel="handleCancelConvertDanmu"
  ></DanmuFactorySettingDailog>
  <ExportModal v-model="exportVisible" :files="files"></ExportModal>
  <WaveformAnalyzerDialog
    v-model:visible="waveformAnalyzerDialogVisible"
    v-model="waveformAnalyzerConfig"
    @confirm="waveformAnalyzerConfirm"
  />
</template>

<script setup lang="ts">
defineOptions({
  name: "videoCut",
});
import { toReactive } from "@vueuse/core";
import { supportedVideoExtensions } from "@renderer/utils";
import ButtonGroup from "@renderer/components/ButtonGroup.vue";
import DanmuFactorySettingDailog from "@renderer/components/DanmuFactorySettingDailog.vue";
import { useSegmentStore, useAppConfig } from "@renderer/stores";
import ExportModal from "./components/ExportModal.vue";
import SegmentList from "./components/SegmentList.vue";
import VideoPlayer from "./components/VideoPlayer.vue";
import ConfigPanel from "./components/ConfigPanel.vue";
import WaveformAnalyzerDialog from "./components/WaveformAnalyzerDialog.vue";
import { useStorage } from "@vueuse/core";
import { showFileDialog } from "@renderer/utils/fileSystem";
import { useConfirm } from "@renderer/hooks";
import { commonApi, taskApi } from "@renderer/apis";
import { useDrive } from "@renderer/hooks/drive";
import { useProjectManager } from "./hooks";
import { useVideoPlayer } from "./composables/useVideoPlayer";
import { useDanmu } from "./composables/useDanmu";
import { useWaveform } from "./composables/useWaveform";
import { useKeyboardShortcuts } from "./composables/useKeyboardShortcuts";

import type { DanmuConfig } from "@biliLive-tools/types";

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

const waveformAnalyzerConfig = useStorage("cut-waveform-analyzer-config-new", {
  energyPercentile: 50, // 能量百分位阈值 (0-100)
  minSegmentDuration: 25, // 最小片段时长（秒）
  maxGapDuration: 15, // 最大间隔时长（秒）
  smoothWindowSize: 4, // 平滑窗口大小（秒）
});
const waveformAnalyzerDialogVisible = ref(false);

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
  handleProjectAction,
  projectMenuOptions,
  saveProject,
  saveProjectAs,
  loadProjectFile,
  resetProjectState,
  readProjectFile,
} = useProjectManager(files);

const { appConfig } = storeToRefs(useAppConfig());

const segmentStore = useSegmentStore();
const { undo, redo, clear: clearCuts, getCombinedLyrics } = useSegmentStore();
const { selectedCuts } = storeToRefs(useSegmentStore());

const videoVCutOptions = toReactive(
  computed({
    get: () => appConfig.value.tool.videoCut,
    set: (value) => {
      appConfig.value.tool.videoCut = value;
    },
  }),
);

const projectMenuItems = computed(() => {
  const list = [
    { label: "导入项目文件", key: "importProject" },
    { label: "加载弹幕", key: "importDanmu" },
    ...projectMenuOptions.value,
    { label: "关闭", key: "closeVideo", disabled: !files.value.videoPath },
  ];
  if (!isWeb.value) {
    list.push({
      label: "分割线",
      key: "divider1",
      type: "divider",
    });
    list.push({
      label: "打开独立窗口",
      key: "openSubWindow",
    });
  }
  // 其他操作
  list.push({
    label: "分割线",
    key: "divider2",
    type: "divider",
  });
  list.push({
    label: "快速歌切",
    key: "openQuickSongCut",
  });
  return list;
});
const confirm = useConfirm();

// 初始化 composables
const {
  videoInstance,
  videoRef: videoPlayerRef,
  loadVideo: loadVideoCore,
  togglePlay,
  handleVideoReady,
} = useVideoPlayer(isWeb);
const { duration: videoDuration } = storeToRefs(useSegmentStore());
const {
  danmaList,
  xmlConvertVisible,
  convertDanmuLoading,
  loadDanmuFile,
  confirmAndConvertDanmu: confirmConvert,
  closeConvertDialog,
  generateDanmakuData,
} = useDanmu(videoInstance, videoPlayerRef, videoDuration, showVideoTime);
const { waveformLoading, waveformVisible, initWaveform, destroyWaveform } =
  useWaveform(videoInstance);

provide("videoInstance", videoInstance);

// 声明 videoRef 用于获取 VideoPlayer 组件实例
const videoRef = ref<any>(null);

// 同步 videoRef 到 videoPlayerRef
watch(
  videoRef,
  (newVal) => {
    if (newVal) {
      videoPlayerRef.value = newVal.videoRef;
    }
  },
  { immediate: true },
);

/**
 * 处理拖拽文件变化
 * @param droppedFiles 文件列表
 */
const handleDroppedFiles = (droppedFiles: any[]) => {
  if (!droppedFiles.length) return;
  const file = droppedFiles[0];
  const { path, ext } = file;

  // 根据文件类型进行不同处理
  if (ext === ".llc") {
    loadProject(path);
  } else {
    loadProject(path);
  }
};

const handleDanmuFile = async (filePath: string) => {
  if (filePath.endsWith(".xml")) {
    if (!files.value.videoPath) {
      notice.error({
        title: "请先加载视频文件",
        duration: 2000,
      });
      return;
    }
  } else if (filePath.endsWith(".ass")) {
    if (!files.value.videoPath) {
      notice.error({
        title: "请先加载视频文件",
        duration: 2000,
      });
      return;
    }
    files.value.originDanmuPath = filePath;
    files.value.danmuPath = filePath;
  } else {
    throw new Error("不支持的弹幕文件格式");
  }

  await loadDanmuFile(filePath);
};

/**
 * 调用文件选择对话框，选择并加载文件
 */
const selectLoadFile = async (extensions: string[]) => {
  const selectedFiles = await showFileDialog({
    extensions,
  });
  if (!selectedFiles || selectedFiles.length === 0) return;

  const filePath = selectedFiles[0];
  if (filePath.endsWith(".xml")) {
    await handleDanmuFile(filePath);
  } else if (filePath.endsWith(".ass")) {
    await handleDanmuFile(filePath);
  } else if (filePath.endsWith(".llc")) {
    await loadProject(filePath);
  } else {
    await loadProject(filePath);
  }
};

/**
 * 加载项目
 */
const loadProject = async (filePath: string) => {
  let videoPath: string;
  let projectFile: string | undefined;
  if (filePath.endsWith(".llc")) {
    projectFile = filePath;
    // 如果是项目文件，那么先读取项目文件内容，获得媒体文件路径
    const projectData = await readProjectFile(filePath);
    const mediaFileName = projectData.mediaFileName;
    const possibleVideoPath = window.path.join(window.path.dirname(filePath), mediaFileName);
    const exists = await commonApi.fileExists(possibleVideoPath);
    if (exists) {
      videoPath = possibleVideoPath;
    } else {
      alert("项目关联的视频文件不存在，无法加载");
      return;
    }
  } else {
    // 这里就是视频文件了
    videoPath = filePath;
    const { dir, name } = window.path.parse(filePath);
    const possibleProjectFile = window.path.join(dir, `${name}-proj.llc`);
    const exists = await commonApi.fileExists(possibleProjectFile);
    if (exists) {
      projectFile = possibleProjectFile;
    }
  }
  loadVideo(videoPath);
  if (projectFile) {
    await loadProjectFile(projectFile);
    const combinedLyrics = getCombinedLyrics();
    // @ts-ignore
    videoInstance?.value?.artplayerPluginSubtitle?.setContent(combinedLyrics, "srt");
  }
};

/**
 * 加载视频文件
 * @param path 视频文件路径
 */
const loadVideo = async (path: string) => {
  files.value.originVideoPath = path;
  destroyWaveform();

  const videoUrl = await loadVideoCore(path);
  files.value.videoPath = videoUrl;

  autoLoadDanmuFile(path);
};

/**
 * 关闭所有资源（视频、弹幕、项目等）
 */
const closeAllResources = async () => {
  const [status] = await confirm.warning({
    content: "是否确认关闭？相关数据将被清理，且无法恢复",
  });
  if (!status) return;

  // 清理视频
  await loadVideo("");
  videoPlayerRef.value?.clearFiles();

  // 清理弹幕
  files.value.danmuPath = null;
  files.value.originDanmuPath = null;

  // 清理项目状态
  resetProjectState();

  // 清理切片数据
  clearCuts();

  // 重置时间戳
  // @ts-ignore
  if (videoInstance.value?.artplayerTimestamp) {
    // @ts-ignore
    videoInstance.value.artplayerTimestamp.setTimestamp(0);
  }
};

const handleProjectMenuClick = async (key?: string | number) => {
  if (!key) {
    selectLoadFile([...supportedVideoExtensions, "xml", "ass"]);
    return;
  }

  if (key === "closeVideo") {
    await closeAllResources();
  } else if (key === "importDanmu") {
    await selectLoadFile(["ass", "xml"]);
  } else if (key === "openSubWindow") {
    openSubWindow();
  } else if (key === "importProject") {
    await selectLoadFile(["llc"]);
  } else if (key === "openQuickSongCut") {
    openWaveformAnalyzerDialog();
  } else {
    handleProjectAction(key);
  }
};

/**
 * 自动加载与视频同名的弹幕文件
 * @param videoPath 视频文件路径
 */
const autoLoadDanmuFile = async (videoPath: string) => {
  const { dir, name } = window.path.parse(videoPath);

  // 优先查找 .ass 文件
  const assFilepath = window.path.join(dir, `${name}.ass`);
  if (await commonApi.fileExists(assFilepath)) {
    await loadDanmuFile(assFilepath);
    return;
  }

  // 其次查找 .xml 文件
  const xmlFilepath = window.path.join(dir, `${name}.xml`);
  if (await commonApi.fileExists(xmlFilepath)) {
    await loadDanmuFile(xmlFilepath);
  }
};

/**
 * 视频时长变化
 */
const handleVideoDurationChange = (duration: number) => {
  videoDuration.value = duration;

  initWaveform(files.value.originVideoPath);
};

/**
 * 关闭弹幕转换对话框
 */
const handleCancelConvertDanmu = () => {
  closeConvertDialog();
};

/**
 * 确认并执行弹幕转换
 */
const handleConfirmConvertDanmu = async (config: DanmuConfig) => {
  const [output, original] = await confirmConvert(config);
  files.value.danmuPath = output;
  files.value.originDanmuPath = original;
  await generateDanmakuData(original);
};

const exportVisible = ref(false);
/**
 * 导出切片
 */
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

// 键盘快捷键
useKeyboardShortcuts(
  {
    onUndo: () => undo(),
    onRedo: () => redo(),
    onSave: () => saveProject(),
    onSaveAs: () => saveProjectAs(),
    onExport: () => exportCuts(),
    onTogglePlay: () => togglePlay(),
  },
  videoInstance,
);

const { videoCutDrive } = useDrive();
onMounted(() => {
  if (!isWeb.value) {
    videoCutDrive();
  }
});

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

const openWaveformAnalyzerDialog = () => {
  waveformAnalyzerDialogVisible.value = true;
};

const waveformAnalyzerConfirm = async () => {
  const result = await taskApi.analyzerWaveform(
    files.value.videoPath as string,
    waveformAnalyzerConfig.value,
  );
  segmentStore.clear();
  segmentStore.init(
    result.output.map((seg: any) => ({
      start: seg.startTime,
      end: seg.endTime,
      name: "",
      checked: true,
    })),
  );
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
</style>
