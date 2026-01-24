import path from "node:path";

import Router from "@koa/router";
import douyu from "@biliLive-tools/shared/video/douyu.js";
import huya from "@biliLive-tools/shared/video/huya.js";
import kuaishou from "@biliLive-tools/shared/video/kuaishou.js";
import douyin from "@biliLive-tools/shared/video/douyin.js";
import biliApi from "@biliLive-tools/shared/task/bili.js";
import log from "@biliLive-tools/shared/utils/log.js";
import videoSub from "@biliLive-tools/shared/video/videoSub.js";
import { replaceExtName } from "@biliLive-tools/shared/utils/index.js";

import type { VideoAPI } from "../types/video.js";

const router = new Router({
  prefix: "/video",
});

router.post("/parse", async (ctx) => {
  let url = ctx.request.body.url;
  if (!url) {
    throw new Error("url is required");
  }
  url = url.trim();
  ctx.body = await parseVideo({ url });
});

router.post("/download", async (ctx) => {
  let options = ctx.request.body;

  ctx.body = await downloadVideo(options);
});

router.post("/sub/parse", async (ctx) => {
  let data = ctx.request.body;
  if (!data.url) {
    throw new Error("url is required");
  }
  const res = await videoSub.parse(data.url);
  ctx.body = res;
});

router.post("/sub/add", async (ctx) => {
  let data = ctx.request.body;

  const res = videoSub.add(data);
  ctx.body = res;
});

router.post("/sub/remove", async (ctx) => {
  let data = ctx.request.body;
  if (!data.id) {
    throw new Error("id is required");
  }
  const res = videoSub.remove(data.id);
  ctx.body = res;
});

router.post("/sub/update", async (ctx) => {
  let data = ctx.request.body;
  if (!data.id || !data.name || !data.platform || !data.subId) {
    throw new Error("id, name, platform, subId is required");
  }
  const res = videoSub.update(data);
  ctx.body = res;
});

router.get("/sub/list", async (ctx) => {
  const res = videoSub.list();
  ctx.body = res;
});
router.post("/sub/check", async (ctx) => {
  const data = ctx.request.body;
  const res = await videoSub.check(data.id);
  ctx.body = res;
});

async function parseVideo({
  url,
}: VideoAPI["parseVideo"]["Args"]): Promise<VideoAPI["parseVideo"]["Resp"]> {
  if (url.includes("v.douyu.com/show")) {
    const douyuMatch = url.match(/show\/([A-Za-z0-9]+)/);
    if (!douyuMatch) {
      throw new Error("请输入正确的斗鱼视频链接");
    }
    const videos = await douyu.parseVideo(url);
    if (videos.length === 0) {
      log.error("斗鱼解析失败", videos, url);
      throw new Error("解析失败");
    }

    const resolutions: {
      value: string;
      label: string;
    }[] = (await douyu.getAvailableStreams(videos[0].decodeData)).map((item) => ({
      value: item.stream_type,
      label: item.name,
    }));
    resolutions.unshift({
      value: "highest",
      label: "最高",
    });

    return {
      videoId: videos[0].ROOM.vid,
      platform: "douyu",
      title: videos[0].DATA.content.title,
      resolutions: resolutions,
      parts: videos.map((item) => {
        let liveStartTime = item?.DATA?.liveShow?.starttime;
        let videoStartTime = item?.DATA?.content?.start_time;
        if (!liveStartTime) {
          // @ts-ignore
          liveStartTime = item?.DATA?.content?.create_time;
        }
        if (!videoStartTime) {
          // @ts-ignore
          videoStartTime = item?.DATA?.content?.create_time;
        }
        return {
          name: item.ROOM.name,
          partId: item.ROOM.vid,
          isEditing: false,
          extra: {
            decodeData: item.decodeData,
            user_name: item?.ROOM?.author_name,
            room_id: item?.DATA?.content.room_id,
            room_title: item?.DATA?.content.title,
            live_start_time: new Date(liveStartTime * 1000).toISOString(),
            video_start_time: new Date(videoStartTime * 1000).toISOString(),
          },
        };
      }),
    };
  } else if (/https?:\/\/live.bilibili.com\/\d+/.test(url)) {
    const liveId = path.basename(new URL(url).pathname);
    const user = await biliApi.getRoomInfo(Number(liveId));
    const data = await biliApi.getSliceList(Number(user.uid));
    return {
      videoId: liveId,
      platform: "bilibiliLive",
      title: "直播录像",
      resolutions: [],
      parts: data.replay_info.map((item) => {
        return {
          name: `${new Date(item.start_time * 1000).toLocaleString()} 场直播`,
          partId: item.live_key.toString(),
          isEditing: false,
          extra: {
            liveKey: item.live_key,
            startTime: item.start_time,
            endTime: item.end_time,
            uid: user.uid,
          },
        };
      }),
    };
  } else if (url.includes("bilibili")) {
    const bvid = extractBVNumber(url);
    if (!bvid) {
      throw new Error("请输入正确的b站视频链接");
    }
    const data = await biliApi.getArchiveDetail(bvid);
    const res = await biliApi.getPlayUrl(bvid, data.View.pages[0].cid);
    const resolutions: {
      value: string;
      label: string;
    }[] = [{ value: "highest", label: "最高" }];

    const supportFormats = res.support_formats.map((item) => {
      return {
        value: String(item.quality),
        label: item.new_description,
      };
    });
    resolutions.push(...supportFormats);

    return {
      videoId: bvid,
      platform: "bilibili",
      title: data.View.title,
      resolutions: resolutions,
      parts: data.View.pages.map((item) => {
        return {
          name: item.part,
          partId: item.cid.toString(),
          isEditing: false,
          extra: { bvid: bvid },
        };
      }),
    };
  } else if (url.includes("huya.com/video/play")) {
    // https://www.huya.com/video/play/1043151558.html
    const huyaMatch = url.match(/play\/([0-9]+)\.html/);
    if (!huyaMatch) {
      throw new Error("请输入正确的虎牙视频链接");
    }
    const videoId = huyaMatch[1];

    const data = await huya.parseVideo(videoId);

    const resolutions = data.moment.videoInfo.definitions.map((item) => ({
      value: item.definition,
      label: item.defName,
    }));
    resolutions.unshift({
      value: "highest",
      label: "最高",
    });
    return {
      videoId: videoId,
      platform: "huya",
      title: data.moment.title,
      resolutions: resolutions,
      parts: [
        {
          partId: videoId,
          name: data.moment.title,
          isEditing: false,
        },
      ],
    };
  } else if (url.includes("kuaishou.com/playback")) {
    const kuaishouMatch = url.match(/playback\/([A-Za-z0-9]+)/);
    if (!kuaishouMatch) {
      throw new Error("请输入正确的快手视频链接");
    }
    const videoId = kuaishouMatch[1];
    const data = await kuaishou.parseVideo(videoId);
    return {
      videoId: videoId,
      platform: "kuaishou",
      title: "直播录像",
      resolutions: [],
      parts: [
        {
          partId: videoId,
          name: `${new Date(data.currentWork.createTime).toLocaleString()} 场直播`,
          isEditing: false,
          extra: {
            url: data.currentWork.playUrlV2.h264,
          },
        },
      ],
    };
  } else if (url.includes("www.douyin.com/vsdetail")) {
    const douyinMatch = url.match(/vsdetail\/([A-Za-z0-9]+)/);
    if (!douyinMatch) {
      throw new Error("请输入正确的抖音回放链接");
    }
    const videoId = douyinMatch[1];
    const data = await douyin.parseVideo(videoId);
    console.log(data);
    const resolutions = data.resolutions.map((item) => ({
      value: item.value,
      label: item.label,
    }));
    resolutions.unshift({
      value: "highest",
      label: "最高",
    });
    return {
      videoId: videoId,
      platform: "douyinLive",
      title: data.title,
      resolutions: resolutions,
      parts: [
        {
          partId: videoId,
          name: data.title,
          isEditing: false,
          extra: {
            resolutions: data.resolutions,
          },
        },
      ],
    };
  } else {
    throw new Error("暂不支持该链接");
  }
}

async function downloadVideo(options: VideoAPI["downloadVideo"]["Args"]) {
  const filepath = path.join(options.savePath, options.filename);

  if (options.platform === "douyu") {
    if (!options?.extra?.decodeData) {
      throw new Error("decodeData is required for douyu download");
    }
    if (options.onlyDanmu) {
      const danmuOutput = replaceExtName(filepath, ".xml");
      await douyu.downloadDanmu(options.id, danmuOutput, options.override, {
        platform: "douyu",
        user_name: options?.extra?.user_name,
        room_id: options?.extra?.room_id,
        room_title: options?.extra?.room_title,
        live_start_time: options?.extra?.live_start_time,
        video_start_time: options?.extra?.video_start_time,
      });
    }
    await douyu.download(filepath, options?.extra?.decodeData, {
      danmu: options.danmu,
      resoltion: options.resolution ?? "highest",
      override: options.override,
      vid: options.id,
      danmuMeta: {
        platform: "douyu",
        user_name: options?.extra?.user_name,
        room_id: options?.extra?.room_id,
        room_title: options?.extra?.room_title,
        live_start_time: options?.extra?.live_start_time,
        video_start_time: options?.extra?.video_start_time,
      },
    });
  } else if (options.platform === "bilibiliLive") {
    if (
      !options?.extra?.liveKey ||
      !options?.extra?.startTime ||
      !options?.extra?.endTime ||
      !options?.extra?.uid
    ) {
      throw new Error("liveKey, startTime, endTime, liveId is required for bilibiliLive download");
    }
    // B站剪辑录播回放
    const stream = await biliApi.getSliceStream({
      live_key: options.extra.liveKey,
      start_time: options.extra.startTime,
      end_time: options.extra.endTime,
      live_uid: options.extra.uid,
    });
    const streams = stream.list;
    if (!streams) {
      throw new Error("无法找到对应的流");
    }
    for (const stream of streams) {
      await biliApi.sliceDownload(filepath, stream.stream, {
        override: options.override,
      });
    }
  } else if (options.platform === "bilibili") {
    // B站视频
    if (!options?.extra?.bvid) {
      throw new Error("bvid is required for bilibili download");
    }
    await biliApi.download({
      bvid: options.extra.bvid,
      cid: Number(options.id),
      output: filepath,
      override: options.override,
      onlyAudio: options.onlyAudio,
      danmu: options.danmu,
      qn: options.resolution === "highest" ? undefined : Number(options.resolution),
    });
  } else if (options.platform === "huya") {
    const data = await huya.parseVideo(options.id);
    let m3u8Url = data.moment.videoInfo.definitions.find(
      (item) => item.definition === options.resolution,
    )?.m3u8;
    if (!m3u8Url) {
      m3u8Url = data.moment.videoInfo.definitions[0]?.m3u8;
    }
    if (!m3u8Url) {
      throw new Error("无法找到对应的流");
    }
    await huya.download(filepath, m3u8Url, {
      override: options.override,
    });
  } else if (options.platform === "kuaishou") {
    if (!options?.extra?.url) {
      throw new Error("url is required for kuaishou download");
    }
    await kuaishou.download(filepath, options.extra.url, {
      override: options.override,
    });
  } else if (options.platform === "douyinLive") {
    console.log(options);
    if (!options?.extra?.resolutions || options?.extra?.resolutions.length === 0) {
      throw new Error("resolutions is required for douyinLive download");
    }
    let url = options?.extra?.resolutions.find((item) => item.value === options.resolution)?.url;
    if (!url) {
      url = options?.extra?.resolutions[0]?.url;
    }
    if (url) {
      await douyin.download(filepath, url, {
        override: options.override,
      });
    }
  } else {
    throw new Error("暂不支持该平台");
  }
}

function extractBVNumber(videoUrl: string): string | null {
  const bvMatch = videoUrl.match(/\/BV([A-Za-z0-9]+)/);

  if (bvMatch && bvMatch[1]) {
    return `BV${bvMatch[1]}`;
  } else {
    return null;
  }
}

export default router;
