import { ref, type Ref, watch } from "vue";
import { useStorage } from "@vueuse/core";
import { useNotification } from "naive-ui";
import { taskApi } from "@renderer/apis";
import WaveSurfer from "wavesurfer.js";
import ZoomPlugin from "wavesurfer.js/dist/plugins/zoom.esm.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import { useSegmentStore } from "@renderer/stores";

import type Artplayer from "artplayer";
import type { Region } from "wavesurfer.js/dist/plugins/regions.esm.js";

/**
 * 生成有辨识度的颜色
 * 使用 HSL 色彩空间,固定饱和度和亮度,通过黄金角度分割色相环
 */
const generateDistinctColor = (index: number): string => {
  const goldenRatio = 0.618033988749895;
  const hue = (index * goldenRatio * 360) % 360;
  const saturation = 65; // 饱和度 65%
  const lightness = 60; // 亮度 60%
  const alpha = 0.5; // 透明度
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
};

export function useWaveform(videoInstance: Ref<Artplayer | null>) {
  const notice = useNotification();
  const ws = ref<WaveSurfer | null>(null);
  const waveformLoading = ref(false);
  const waveformVisible = useStorage("cut-waveform-visible", true);

  // 存储当前视频文件路径，用于状态切换时重新初始化
  let currentVideoFile: string | null = null;

  // 存储 regions plugin 引用
  let regionsPlugin: ReturnType<typeof RegionsPlugin.create> | null = null;

  // 标记是否正在同步，避免循环触发
  let isSyncing = false;

  // 存储事件监听器的引用，用于清理
  let videoTimeUpdateHandler: (() => void) | null = null;
  let videoPlayHandler: (() => void) | null = null;
  let videoPauseHandler: (() => void) | null = null;
  let waveformInteractionHandler: ((time: number) => void) | null = null;
  let segmentEventHandler: ((data: any) => void) | null = null;

  /**
   * 设置视频与波形图的联动
   */
  const setupSyncWithVideo = () => {
    if (!ws.value || !videoInstance.value) return;

    // 视频播放时同步波形图进度
    videoTimeUpdateHandler = () => {
      if (videoInstance.value && ws.value) {
        ws.value.setTime(videoInstance.value.currentTime);
      }
    };

    // 视频播放时，波形图也播放
    // videoPlayHandler = () => {
    //   ws.value?.play();
    // };

    // // 视频暂停时，波形图也暂停
    // videoPauseHandler = () => {
    //   ws.value?.pause();
    // };

    // 监听视频事件
    videoInstance.value.on("video:timeupdate", videoTimeUpdateHandler);
    // videoInstance.value.on("video:play", videoPlayHandler);
    // videoInstance.value.on("video:pause", videoPauseHandler);

    // 波形图拖拽/点击时同步视频进度
    waveformInteractionHandler = (time: number) => {
      if (videoInstance.value) {
        videoInstance.value.currentTime = time;
      }
    };

    ws.value.on("interaction", waveformInteractionHandler);
    // ws.value.on("seeking", waveformInteractionHandler);
  };

  /**
   * 清除视频与波形图的联动监听器
   */
  const cleanupSyncWithVideo = () => {
    if (videoInstance.value && videoTimeUpdateHandler) {
      videoInstance.value.off("video:timeupdate", videoTimeUpdateHandler);
      videoTimeUpdateHandler = null;
    }
    if (videoInstance.value && videoPlayHandler) {
      videoInstance.value.off("video:play", videoPlayHandler);
      videoPlayHandler = null;
    }
    if (videoInstance.value && videoPauseHandler) {
      videoInstance.value.off("video:pause", videoPauseHandler);
      videoPauseHandler = null;
    }
    if (ws.value && waveformInteractionHandler) {
      ws.value.un("interaction", waveformInteractionHandler);
      ws.value.un("seeking", waveformInteractionHandler);
      waveformInteractionHandler = null;
    }
  };

  /**
   * 初始化波形图
   */
  const initWaveform = async (rawVideoFile: string | null) => {
    // 保存当前视频文件路径
    currentVideoFile = rawVideoFile;

    if (ws.value) return;
    if (!rawVideoFile) return;
    if (!videoInstance.value) return;
    if (waveformLoading.value) return;
    if (!waveformVisible.value) return;

    // 如果时长大于2小时，则不生成波形图
    if (videoInstance.value.duration > 2 * 60 * 60) {
      console.warn("Video duration exceeds 2 hours, skipping waveform generation.");
      return { error: "视频时长超过2小时，不支持波形图生成。" };
    }

    waveformLoading.value = true;
    let output = "";
    try {
      const res = await taskApi.extractAudio(rawVideoFile);
      output = res.output;
      console.log("Extracted audio path:", res);
    } catch (error) {
      waveformLoading.value = false;
      console.error("Error extracting audio for waveform:", error);
      return { error: "提取音频失败，无法生成波形图。" };
    }
    const regions = RegionsPlugin.create();
    regionsPlugin = regions;

    ws.value = WaveSurfer.create({
      container: "#waveform",
      waveColor: "#4F4A85",
      progressColor: "#383351",
      height: 64,
      normalize: false,
      dragToSeek: true,
      hideScrollbar: false,
      // media: videoInstance.value!.video,
      url: output,
      // peaks: [res.output.data],
      plugins: [regions],
      // duration: videoInstance.value!.duration,
      // minPxPerSec: 5,
    });
    setupSyncWithVideo();

    ws.value.registerPlugin(
      ZoomPlugin.create({
        exponentialZooming: true,
      }),
    );

    const segmentStore = useSegmentStore();
    const { cuts } = storeToRefs(segmentStore);

    ws.value.once("decode", () => {
      waveformLoading.value = false;

      let index = 0;
      // 初始化现有的 segments 为 regions
      for (const cut of cuts.value) {
        regions.addRegion({
          drag: false,
          resize: true,
          minLength: 1,

          start: cut.start,
          end: cut.end,
          color: generateDistinctColor(index++),
          content: cut.name,
          id: cut.id,
        });
      }

      // 监听 region 更新事件，同步到 segment store
      regions.on("region-updated", (region: Region) => {
        if (isSyncing) return;
        isSyncing = true;
        segmentStore.updateSegment(region.id, {
          start: region.start,
          end: region.end,
        });
        isSyncing = false;
      });
      // 监听 region 删除事件
      regions.on("region-removed", (region: Region) => {
        if (isSyncing) return;
        isSyncing = true;
        segmentStore.removeSegment(region.id);
        isSyncing = false;
      });
      regions.on("region-double-clicked", (region: Region) => {
        // // 禁止用户直接创建 region
        // region.remove();
        if (videoInstance.value) {
          videoInstance.value.currentTime = region.start;
        }
      });

      // 监听 segment store 事件，同步到 regions
      segmentEventHandler = (data: { type: string; segment?: any; id?: string }) => {
        if (isSyncing || !regionsPlugin) return;
        isSyncing = true;

        try {
          if (data.type === "add" && data.segment) {
            // 新增 segment，添加 region
            const currentIndex = regionsPlugin.getRegions().length;
            regionsPlugin.addRegion({
              drag: false,
              resize: true,
              minLength: 1,

              start: data.segment.start,
              end: data.segment.end,
              color: generateDistinctColor(currentIndex),
              content: data.segment.name,
              id: data.segment.id,
            });
          } else if (data.type === "remove" && data.id) {
            // 删除 segment，移除 region
            const region = regionsPlugin.getRegions().find((r) => r.id === data.id);
            if (region) {
              region.remove();
            }
          } else if (data.type === "update" && data.segment) {
            // 更新 segment，更新 region
            const region = regionsPlugin.getRegions().find((r) => r.id === data.segment.id);
            if (region) {
              if (region.start !== data.segment.start || region.end !== data.segment.end) {
                region.setOptions({ start: data.segment.start, end: data.segment.end });
              }
              if (region.content?.textContent !== data.segment.name) {
                region.setOptions({ content: data.segment.name });
              }
            }
          } else if (data.type === "clear") {
            // 清空 segments，清空 regions
            regionsPlugin.clearRegions();
          }
        } finally {
          isSyncing = false;
        }
      };

      segmentStore.on(segmentEventHandler);
    });

    return { error: null };
  };

  /**
   * 销毁波形图
   */
  const destroyWaveform = () => {
    // 先清理监听器
    cleanupSyncWithVideo();

    // 清理 segment store 事件监听器
    if (segmentEventHandler) {
      const segmentStore = useSegmentStore();
      segmentStore.off(segmentEventHandler);
      segmentEventHandler = null;
    }

    // 清理 regions 引用
    regionsPlugin = null;

    // 再销毁波形图实例
    if (ws.value) {
      ws.value.destroy();
      ws.value = null;
      waveformLoading.value = false;
    }
  };

  /**
   * 监听 waveformVisible 状态变化
   */
  watch(waveformVisible, async (visible) => {
    if (visible && currentVideoFile) {
      // 当可见性切换为 true 且有视频文件时，初始化波形图
      const result = await initWaveform(currentVideoFile);
      if (result?.error) {
        notice.info({
          title: result.error,
          duration: 2000,
        });
        waveformVisible.value = false;
      }
    }
  });

  return {
    ws,
    waveformLoading,
    waveformVisible,
    initWaveform,
    destroyWaveform,
  };
}
