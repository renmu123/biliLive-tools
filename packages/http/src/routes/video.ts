import path from "node:path";

import Router from "koa-router";
import douyu from "@biliLive-tools/shared/task/douyu.js";
import huya from "@biliLive-tools/shared/task/huya.js";
import biliApi from "@biliLive-tools/shared/task/bili.js";
import log from "@biliLive-tools/shared/utils/log.js";
import videoSub from "@biliLive-tools/shared/task/videoSub.js";

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
        return {
          name: item.ROOM.name,
          partId: item.ROOM.vid,
          isEditing: false,
          extra: {
            decodeData: item.decodeData,
            user_name: item?.ROOM?.author_name,
            room_id: item?.DATA?.content.room_id,
            room_title: item?.DATA?.content.title,
            live_start_time: new Date(item?.DATA?.liveShow?.starttime * 1000).toISOString(),
            video_start_time: new Date(item?.DATA?.content?.start_time * 1000).toISOString(),
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
    return {
      videoId: bvid,
      platform: "bilibili",
      title: data.View.title,
      resolutions: [],
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
  } else if (options.platform === "bilibili") {
    if (!options?.extra?.bvid) {
      throw new Error("bvid is required for bilibili download");
    }
    await biliApi.download({
      bvid: options.extra.bvid,
      cid: Number(options.id),
      output: filepath,
      override: options.override,
      onlyAudio: options.onlyAudio,
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
