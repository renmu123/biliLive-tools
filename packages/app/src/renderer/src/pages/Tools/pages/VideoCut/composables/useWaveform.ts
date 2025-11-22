import { ref, type Ref } from "vue";
import WaveSurfer from "wavesurfer.js";
import ZoomPlugin from "wavesurfer.js/dist/plugins/zoom.esm.js";
import type Artplayer from "artplayer";

export function useWaveform(videoInstance: Ref<Artplayer | null>) {
  const ws = ref<WaveSurfer | null>(null);
  const waveformLoading = ref(false);

  /**
   * 初始化波形图
   */
  const initWaveform = async () => {
    if (ws.value) return;

    // TODO: 还要测试m4s
    if (!videoInstance.value?.url.endsWith("mp4")) {
      return { error: "波形图仅支持mp4格式的视频" };
    }

    waveformLoading.value = true;

    ws.value = WaveSurfer.create({
      container: "#waveform",
      waveColor: "#4F4A85",
      progressColor: "#383351",
      height: 64,
      normalize: false,
      dragToSeek: true,
      hideScrollbar: true,
      media: videoInstance.value!.video,
    });

    ws.value.registerPlugin(
      ZoomPlugin.create({
        // the amount of zoom per wheel step, e.g. 0.5 means a 50% magnification per scroll
        scale: 0.01,
        // Optionally, specify the maximum pixels-per-second factor while zooming
        maxZoom: 200,
      }),
    );

    ws.value.once("decode", () => {
      waveformLoading.value = false;
    });

    return { error: null };
  };

  /**
   * 销毁波形图
   */
  const destroyWaveform = () => {
    if (ws.value) {
      ws.value.destroy();
      ws.value = null;
    }
  };

  return {
    ws,
    waveformLoading,
    initWaveform,
    destroyWaveform,
  };
}
