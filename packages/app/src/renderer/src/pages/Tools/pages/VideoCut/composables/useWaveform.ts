import { ref, type Ref, watch } from "vue";
import { useStorage } from "@vueuse/core";
import { useNotification } from "naive-ui";
import { taskApi } from "@renderer/apis";
import WaveSurfer from "wavesurfer.js";
import ZoomPlugin from "wavesurfer.js/dist/plugins/zoom.esm.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";

import type Artplayer from "artplayer";

export function useWaveform(videoInstance: Ref<Artplayer | null>) {
  const notice = useNotification();
  const ws = ref<WaveSurfer | null>(null);
  const waveformLoading = ref(false);
  const waveformVisible = useStorage("cut-waveform-visible", true);

  // 存储当前视频文件路径，用于状态切换时重新初始化
  let currentVideoFile: string | null = null;

  // 存储事件监听器的引用，用于清理
  let videoTimeUpdateHandler: (() => void) | null = null;
  let videoPlayHandler: (() => void) | null = null;
  let videoPauseHandler: (() => void) | null = null;
  let waveformInteractionHandler: ((time: number) => void) | null = null;

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

    ws.value = WaveSurfer.create({
      container: "#waveform",
      waveColor: "#4F4A85",
      progressColor: "#383351",
      height: 64,
      normalize: false,
      dragToSeek: true,
      hideScrollbar: true,
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
        // the amount of zoom per wheel step, e.g. 0.5 means a 50% magnification per scroll
        scale: 0.02,
        // Optionally, specify the maximum pixels-per-second factor while zooming
        maxZoom: 200,
      }),
    );

    ws.value.once("decode", () => {
      waveformLoading.value = false;

      // regions.addRegion({
      //   id: "region1",
      //   start: 0,
      //   end: 8,
      //   content: "Resize me",
      //   color: "rgb(79, 74, 133)",
      //   drag: false,
      //   resize: true,
      // });
      // regions.addRegion({
      //   start: 10,
      //   end: 18,
      //   content: "Resize me",
      //   color: "rgb(79, 74, 133)",
      //   drag: false,
      //   resize: true,
      // });
      // ws.value?.zoom(50);

      // regions.on("region-updated", (region) => {
      //   console.log("Updated region", region);
      // });
      // console.log("Waveform decoded", regions.getRegions());
      // regions.getRegions()[0].remove();
      // console.log("Waveform decoded2", regions.getRegions());
    });

    return { error: null };
  };

  /**
   * 销毁波形图
   */
  const destroyWaveform = () => {
    // 先清理监听器
    cleanupSyncWithVideo();

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
