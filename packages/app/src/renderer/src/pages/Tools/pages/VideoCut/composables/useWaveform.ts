import { ref, type Ref } from "vue";
import { taskApi } from "@renderer/apis";
import WaveSurfer from "wavesurfer.js";
import ZoomPlugin from "wavesurfer.js/dist/plugins/zoom.esm.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";

import type Artplayer from "artplayer";

export function useWaveform(videoInstance: Ref<Artplayer | null>) {
  const ws = ref<WaveSurfer | null>(null);
  const waveformLoading = ref(false);

  /**
   * 初始化波形图
   */
  const initWaveform = async (rawVideoFile: string | null) => {
    if (ws.value) return;
    if (!rawVideoFile) return;
    if (!videoInstance.value) return;

    // TODO: 还要测试m4s
    // if (!videoInstance.value?.url.endsWith("mp4")) {
    //   return { error: "波形图仅支持mp4格式的视频" };
    // }
    waveformLoading.value = true;
    const res = await taskApi.extractAudio(rawVideoFile);
    console.log("Extracted audio path:", res);
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
      url: res.output,
      // peaks: [res.output.data],
      plugins: [regions],
      // duration: videoInstance.value!.duration,
      // minPxPerSec: 5,
    });

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
