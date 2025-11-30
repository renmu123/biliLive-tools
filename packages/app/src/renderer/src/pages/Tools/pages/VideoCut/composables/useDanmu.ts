import { ref, type Ref } from "vue";
import { commonApi, taskApi } from "@renderer/apis";
import { sortBy } from "lodash-es";
import type { DanmuConfig, DanmuItem } from "@biliLive-tools/types";
import type Artplayer from "artplayer";

export function useDanmu(
  videoInstance: Ref<Artplayer | null>,
  videoRef: Ref<any>,
  videoDuration: Ref<number>,
  showVideoTime: Ref<boolean>,
) {
  const danmaList = ref<DanmuItem[]>([]);
  const xmlConvertVisible = ref(false);
  const tempXmlFile = ref("");
  const convertDanmuLoading = ref(false);

  /**
   * 加载弹幕文件
   * @param path 弹幕文件路径（.ass 或 .xml）
   */
  const loadDanmuFile = async (path: string) => {
    if (path.endsWith(".ass")) {
      const content = await commonApi.readDanma(path);
      videoRef.value?.switchAss(content);
      return path;
    } else {
      // 如果是xml文件则弹框提示，要求转换为ass文件
      xmlConvertVisible.value = true;
      tempXmlFile.value = path;
      convertDanmuLoading.value = true;
    }
    await generateDanmakuData(path);
    return path;
  };

  /**
   * 确认并执行弹幕转换
   * @param config 弹幕配置
   */
  const confirmAndConvertDanmu = async (config: DanmuConfig) => {
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
      const content = await commonApi.readDanma(output);
      videoRef.value?.switchAss(content);
      return output;
    } finally {
      convertDanmuLoading.value = false;
    }
  };

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
        videoInstance.value?.artplayerTimestamp?.setTimestamp(
          data.metadata.video_start_time * 1000,
        );
        if (showVideoTime.value === false) {
          // @ts-ignore
          videoInstance.value?.artplayerTimestamp?.hide();
        } else {
          // @ts-ignore
          videoInstance.value?.artplayerTimestamp?.show();
        }
      }
    } else {
      throw new Error("不支持的文件类型");
    }

    if (!videoDuration.value) return;
    const data = await commonApi.genTimeData(file);

    // @ts-ignore
    videoInstance.value?.artplayerPluginHeatmap?.setData(data);
  };

  /**
   * 重新加载弹幕（当视频实例或配置变化时）
   */
  const reloadDanmu = async (danmuPath: string | null) => {
    if (!danmuPath) return;
    const content = await commonApi.readDanma(danmuPath);
    videoRef.value?.switchAss(content);
  };

  return {
    danmaList,
    xmlConvertVisible,
    convertDanmuLoading,
    loadDanmuFile,
    confirmAndConvertDanmu,
    generateDanmakuData,
    reloadDanmu,
  };
}
