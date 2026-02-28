import { ref, type Ref } from "vue";
import { commonApi } from "@renderer/apis";
import type Artplayer from "artplayer";

export function useVideoPlayer(isWeb: Ref<boolean>) {
  const videoInstance = ref<Artplayer | null>(null);
  const videoRef = ref<any>(null);

  /**
   * 加载视频文件
   * @param path 视频文件路径
   */
  const loadVideo = async (path: string) => {
    if (isWeb.value) {
      const { videoId, type } = await commonApi.applyVideoId(path);
      const videoUrl = await commonApi.getVideo(videoId);
      await videoRef.value?.switchUrl(videoUrl, type as any);
      return videoUrl;
    } else {
      await videoRef.value?.switchUrl(path, path.endsWith(".flv") ? "flv" : "");
      return path;
    }
  };

  /**
   * 视频状态切换
   */
  const togglePlay = () => {
    if (!videoInstance.value?.url) return;
    videoInstance.value.toggle();
  };

  /**
   * 视频播放器就绪回调
   */
  const handleVideoReady = (instance: Artplayer) => {
    videoInstance.value = instance;
  };

  return {
    videoInstance,
    videoRef,
    loadVideo,
    togglePlay,
    handleVideoReady,
  };
}
