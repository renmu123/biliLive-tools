import router from "@renderer/routers";
import { commonApi } from "@renderer/apis";
import { recordHistoryApi } from "@renderer/apis";

export async function toVideoPlayerPage(opts: {
  videoFilePath: string;
  danmaId?: string;
}): Promise<void>;
export async function toVideoPlayerPage(opts: {
  videoFilePath?: string;
  danmaId?: string;
  videoId: string;
  videoType: string;
}): Promise<void>;
export async function toVideoPlayerPage(opts: {
  videoFilePath?: string;
  danmaId?: string;
  videoId?: string;
  videoType?: string;
}) {
  if (!opts.videoFilePath && !opts.videoId) {
    throw new Error("缺少视频文件路径或视频ID");
  }
  // 如果 videoId 存在但 videoType 不存在，报错
  if (opts.videoId && opts.videoType === undefined) {
    throw new Error("存在videoId时必选视频类型");
  }
  let videoId = opts.videoId;
  let videoType = opts.videoType;
  let danmaId = opts.danmaId;

  // 如果没有 videoId，但有 videoFilePath，则调用接口申请 videoId
  if (!videoId && opts.videoFilePath) {
    const data = await commonApi.applyVideoId(opts.videoFilePath);
    videoId = data.videoId;
    videoType = data.type;
  }

  if (!danmaId && opts.videoFilePath) {
    const data = await recordHistoryApi.getDanmaFileInfo(opts.videoFilePath);
    danmaId = data.danmaFileId || undefined;
  }

  if (videoId && videoType !== undefined) {
    if (videoType === "ts") {
      throw new Error("ts文件暂不支持播放");
    }

    const query: Record<string, string> = {
      videoId,
      type: videoType,
    };
    if (danmaId) {
      query.danmaId = danmaId;
    }

    if (window.isWeb) {
      const url = router.resolve({
        name: "VideoPlayer",
        query,
      }).href;
      window.open(url, "_blank");
    } else {
      window.api.common.createSubWindow({
        routeName: "videoPlayer",
        hideAside: true,
        query,
      });
    }
  } else {
    throw new Error("无法播放");
  }
}
