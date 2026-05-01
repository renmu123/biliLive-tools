import router from "@renderer/routers";
import { commonApi } from "@renderer/apis";

export async function toVideoPlayerPage(opts: {
  videoFilePath: string;
  // danmaFilePath?: string;
}): Promise<void>;
export async function toVideoPlayerPage(opts: {
  videoFilePath?: string;
  // danmaFilePath?: string;
  videoId: string;
  videoType: string;
}): Promise<void>;
export async function toVideoPlayerPage(opts: {
  videoFilePath?: string;
  // danmaFilePath?: string;
  videoId?: string;
  videoType?: string;
}) {
  if (!opts.videoFilePath && !opts.videoId) {
    throw new Error("缺少视频文件路径或视频ID");
  }
  // 如果 videoId 存在但 videoType 不存在，报错
  if (opts.videoId && !opts.videoType) {
    throw new Error("存在videoId时必选视频类型");
  }
  let videoId = opts.videoId;
  let videoType = opts.videoType;

  // 如果没有 videoId，但有 videoFilePath，则调用接口申请 videoId
  if (!videoId && opts.videoFilePath) {
    const data = await commonApi.applyVideoId(opts.videoFilePath);
    videoId = data.videoId;
    videoType = data.type;
  }

  if (videoId && videoType) {
    if (videoType === "ts") {
      throw new Error("ts文件暂不支持播放");
    }

    if (window.isWeb) {
      const url = router.resolve({
        name: "VideoPlayer",
        query: {
          videoId,
          type: videoType,
        },
      }).href;
      window.open(url, "_blank");
    } else {
      window.api.common.createSubWindow({
        routeName: "videoPlayer",
        hideAside: true,
        query: {
          videoId,
          type: videoType,
        },
      });
    }
  } else {
    throw new Error("无法播放");
  }
}
