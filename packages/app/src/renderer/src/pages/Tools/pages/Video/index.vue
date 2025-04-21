<template>
  <div class="container">
    <n-spin :show="loading">
      <h2>支持B站视频、斗鱼录播、虎牙录播下载；斗鱼、虎牙录播订阅</h2>
      <div class="input">
        <n-input
          v-model:value="url"
          :style="{ width: '80%' }"
          placeholder="请输入视频链接或者直播间链接，比如：https://www.bilibili.com/video/BV1u94y1K7nr、https://v.douyu.com/show/brN0MmQqKl6MpyxA、https://www.huya.com/video/play/1043151558.html"
          @keyup.enter="download"
        />
        <n-button type="primary" ghost :disabled="!url" @click="download"> 下载 </n-button>
        <n-button type="primary" :disabled="!url" @click="subscribe"> 订阅 </n-button>
      </div>

      <SubVideoList
        :list="subVideoList"
        @remove="getSuscribeList"
        @edit="handleEdit"
      ></SubVideoList>
      <DownloadConfirm
        v-model:visible="visible"
        v-model:select-ids="selectCids"
        :detail="data"
        :c-options="downloadOptions"
        @confirm="confirm"
      ></DownloadConfirm>
      <SubscribeModal
        v-model:visible="subscribeVisible"
        :data="subData"
        @update="getSuscribeList"
        @add="getSuscribeList"
      ></SubscribeModal>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "BiliDownload",
});
import DownloadConfirm from "./components/DownloadModal.vue";
import SubscribeModal from "./components/SubscribeModal.vue";
import SubVideoList from "./components/SubVideoList.vue";
import { sanitizeFileName } from "@renderer/utils";
import { taskApi } from "@renderer/apis";
import { videoApi } from "@renderer/apis";

import type { VideoAPI } from "@biliLive-tools/http/types/video.js";

const notice = useNotification();
const url = ref("");
const downloadOptions = ref({
  hasDanmuOptions: false,
  hasAudioOnlyOptions: false,
});

const selectCids = ref<(number | string)[]>([]);

const data = ref<VideoAPI["parseVideo"]["Resp"]>({
  platform: "bilibili",
  videoId: "",
  title: "",
  resolutions: [],
  parts: [],
});

const parse = async () => {
  const videoInfo = await taskApi.parseVideo(url.value);
  videoInfo.parts = videoInfo.parts.map((item) => {
    item.name = sanitizeFileName(item.name);
    return item;
  });
  data.value = videoInfo;
  selectCids.value = videoInfo.parts.map((item) => item.partId);

  if (videoInfo.platform === "bilibili") {
    downloadOptions.value = {
      hasDanmuOptions: true,
      hasAudioOnlyOptions: true,
    };
  } else if (videoInfo.platform === "douyu") {
    downloadOptions.value = {
      hasDanmuOptions: true,
      hasAudioOnlyOptions: false,
    };
  } else if (videoInfo.platform === "huya") {
    downloadOptions.value = {
      hasDanmuOptions: true,
      hasAudioOnlyOptions: false,
    };
  }
};

const subData = ref<VideoAPI["SubList"]["Resp"][0]>({
  id: 0,
  platform: "douyu",
  enable: true,
  lastRunTime: 0,
  roomId: "",
  options: {
    quality: "highest",
    danma: false,
    sendWebhook: false,
  },
  name: "",
  subId: "",
});
const subscribeVisible = ref(false);
const subscribe = async () => {
  const res = await videoApi.subParse(url.value);
  subscribeVisible.value = true;
  subData.value = res;
};

const subVideoList = ref<VideoAPI["SubList"]["Resp"]>([]);
const getSuscribeList = async () => {
  const res = await videoApi.listSub();
  subVideoList.value = res;
};
getSuscribeList();

const download = async () => {
  if (!url.value) return;
  if (!url.value.trim()) {
    throw new Error("请输入视频链接");
  }
  loading.value = true;
  try {
    await parse();
    visible.value = true;
  } finally {
    loading.value = false;
  }
};

const confirm = async (options: {
  ids: (number | string)[];
  savePath: string;
  danmu: "none" | "xml";
  resoltion: string | "highest";
  override: boolean;
  onlyAudio: boolean;
}) => {
  const parts = data.value.parts.filter((item) => options.ids.includes(item.partId));
  const names = parts.map((item) => item.name);
  if (names.some((item) => !item)) {
    notice.error({
      title: "文件名不能为空",
      duration: 1000,
    });
    return;
  }
  if (new Set(names).size !== names.length) {
    notice.error({
      title: "文件名不能重复",
      duration: 1000,
    });
    return;
  }

  for (const part of parts) {
    await taskApi.downloadVideo({
      id: part.partId,
      platform: data.value.platform,
      savePath: options.savePath,
      filename: `${sanitizeFileName(part.name)}.mp4`,
      resolution: options.resoltion,
      extra: part.extra,
      danmu: options.danmu,
      override: options.override,
      onlyAudio: options.onlyAudio,
    });
  }
  notice.success({
    title: "已加入队列",
    duration: 1000,
  });
  visible.value = false;
};

const visible = ref(false);
const loading = ref(false);

const handleEdit = (item: VideoAPI["SubList"]["Resp"][0]) => {
  subscribeVisible.value = true;
  subData.value = {
    id: item.id,
    platform: item.platform,
    options: item.options,
    name: item.name,
    subId: item.id.toString(),
    enable: item.enable,
    lastRunTime: item.lastRunTime,
    roomId: item.roomId,
  };
};
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
