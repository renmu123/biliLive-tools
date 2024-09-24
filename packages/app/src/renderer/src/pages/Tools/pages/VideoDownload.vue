<template>
  <div class="container">
    <n-spin :show="loading">
      <h2>支持B站以及斗鱼录播下载</h2>
      <div class="input">
        <n-input
          v-model:value="url"
          :style="{ width: '80%' }"
          placeholder="请输入视频链接，比如：https://www.bilibili.com/video/BV1u94y1K7nr、https://v.douyu.com/show/brN0MmQqKl6MpyxA"
          @keyup.enter="download"
        />
        <n-button type="primary" ghost :disabled="!url" @click="download"> 下载 </n-button>
      </div>
      <DownloadConfirm
        v-model:visible="visible"
        v-model:selectIds="selectCids"
        :detail="archiveDeatil"
        @confirm="confirm"
      ></DownloadConfirm>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { useUserInfoStore } from "@renderer/stores";
import DownloadConfirm from "@renderer/components/DownloadConfirm.vue";
import { sanitizeFileName } from "@renderer/utils";
import { biliApi, commonApi } from "@renderer/apis";
import path from "path-browserify";

const notice = useNotification();
const { userInfo } = storeToRefs(useUserInfoStore());
const url = ref("");
const archiveDeatil = ref<{
  vid: string;
  title: string;
  pages: { cid: number | string; part: string; editable: boolean; metadata?: any }[];
}>({
  vid: "",
  title: "",
  pages: [],
});

const selectCids = ref<(number | string)[]>([]);

const uid = computed(() => {
  return userInfo.value.uid;
});

function extractBVNumber(videoUrl: string): string | null {
  const bvMatch = videoUrl.match(/\/BV([A-Za-z0-9]+)/);

  if (bvMatch && bvMatch[1]) {
    return `BV${bvMatch[1]}`;
  } else {
    return null;
  }
}

const videoType = ref<"bili" | "douyu">("bili");
const parse = async () => {
  const formatUrl = url.value.trim();
  if (!formatUrl) return;

  if (formatUrl.includes("douyu")) {
    videoType.value = "douyu";
    await handleDouyu(formatUrl);
  } else if (formatUrl.includes("bilibili")) {
    videoType.value = "bili";
    await handleBili(formatUrl);
  }
};

/**
 * 解析b站视频
 */
const handleBili = async (formatUrl: string) => {
  const bvid = extractBVNumber(formatUrl);
  if (!bvid) {
    throw new Error("请输入正确的b站视频链接");
  }
  selectCids.value = [];
  const data = await biliApi.getArchiveDetail(bvid, uid.value);
  archiveDeatil.value = {
    vid: data.View.bvid,
    title: data.View.title,
    pages: data.View.pages.map((item) => {
      item["editable"] = false;
      item.part = sanitizeFileName(item.part);
      return item as unknown as { cid: number; part: string; editable: boolean };
    }),
  };
  selectCids.value = data.View.pages.map((item) => item.cid);
};

/**
 * 解析斗鱼视频
 */
const handleDouyu = async (formatUrl: string) => {
  const douyuMatch = formatUrl.match(/show\/([A-Za-z0-9]+)/);
  if (!douyuMatch) {
    throw new Error("请输入正确的斗鱼视频链接");
  }
  try {
    const data = await commonApi.douyuVideoParse(formatUrl);
    archiveDeatil.value = {
      vid: "111",
      title: data[0].seo_title,
      pages: data.map((item) => {
        let room_title = item.ROOM.name;
        if (room_title.startsWith("【") && room_title.split("：").length > 1) {
          room_title = room_title.split("：").slice(1).join("：");
        }
        const metadata = {
          user_name: item.ROOM.author_name,
          room_id: item.DATA.content.room_id,
          room_title: room_title,
          live_start_time: new Date(item.DATA.liveShow.starttime * 1000).toISOString(),
          video_start_time: new Date(item.DATA.content.start_time * 1000).toISOString(),
          platform: "douyu",
          vid: item.ROOM.vid,
        };
        return {
          cid: item.decodeData,
          part: item.seo_title,
          editable: false,
          metadata,
        };
      }),
    };
    selectCids.value = archiveDeatil.value.pages.map((item) => item.cid);
  } catch (e) {
    console.log(e);
    throw new Error("解析失败，请检查链接是否正确");
  }
};

const download = async () => {
  if (!url.value) return;
  if (!url.value.trim()) {
    throw new Error("请输入合法的视频链接");
  }
  loading.value = true;
  try {
    await parse();
    visible.value = true;
  } finally {
    loading.value = false;
  }
};

const confirm = async (options: { ids: (number | string)[]; savePath: string }) => {
  const selectPages = archiveDeatil.value.pages.filter((item) => options.ids.includes(item.cid));

  for (const page of selectPages) {
    if (videoType.value === "douyu") {
      await commonApi.douyuVideoDownload(
        path.join(options.savePath, `${sanitizeFileName(page.part)}.mp4`),
        page.cid as string,
        {
          danmu: true,
          ...page.metadata,
        },
      );
    } else if (videoType.value === "bili") {
      biliApi.download(
        {
          output: path.join(options.savePath, `${sanitizeFileName(page.part)}.mp4`),
          cid: page.cid as number,
          bvid: archiveDeatil.value.vid,
        },
        uid.value,
      );
    }
  }
  notice.success({
    title: "已加入队列",
    duration: 1000,
  });
};

const visible = ref(false);
const loading = ref(false);
</script>

<style scoped lang="less">
.container {
  // display: flex;
  // justify-content: center;
  // flex-direction: column;
  // align-items: center;
  width: 80%;
  margin: 0 auto;
  margin-top: 60px;
}
.input {
  display: flex;
  align-items: center;
}
</style>
