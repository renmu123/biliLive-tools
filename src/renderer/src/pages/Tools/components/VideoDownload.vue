<template>
  <div class="container">
    <div class="input">
      <Tip
        :size="22"
        tip="此功能仅方便快速下载某些素材，并非专业下载器，不会提供过多功能，目前仅支持下载最高清晰度视频（不支持4K）<br/>如果你在寻找专业下载器，可以尝试其他开源项目，如：https://github.com/BilibiliVideoDownload/BilibiliVideoDownload"
      ></Tip>

      <n-input
        v-model:value="url"
        :style="{ width: '80%' }"
        placeholder="请输入b站视频链接，比如：https://www.bilibili.com/video/BV1u94y1K7nr"
      />
      <n-button type="primary" ghost @click="download"> 下载 </n-button>
    </div>
    <DownloadConfirm
      v-model:visible="visible"
      v-model:selectIds="selectCids"
      :detail="archiveDeatil"
      @confirm="confirm"
    ></DownloadConfirm>
  </div>
</template>

<script setup lang="ts">
import { useUserInfoStore } from "@renderer/stores";
import { storeToRefs } from "pinia";
import DownloadConfirm from "@renderer/components/DownloadConfirm.vue";
import { sanitizeFileName } from "@renderer/utils";

const { userInfo } = storeToRefs(useUserInfoStore());
const url = ref("");
const archiveDeatil = ref<{
  bvid: string;
  title: string;
  pages: { cid: number; part: string; editable: boolean }[];
}>({
  bvid: "",
  title: "",
  pages: [],
});

const selectCids = ref<number[]>([]);

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
const notice = useNotification();

const parse = async () => {
  const formatUrl = url.value.trim();

  console.log(formatUrl);
  if (!formatUrl) {
    throw new Error("请输入b站视频链接");
  }
  const bvid = extractBVNumber(formatUrl);
  if (!bvid) {
    throw new Error("请输入正确的b站视频链接");
  }
  selectCids.value = [];
  const data = await window.api.bili.getArchiveDetail(bvid, uid.value);
  archiveDeatil.value = {
    bvid: data.View.bvid,
    title: data.View.title,
    pages: data.View.pages.map((item) => {
      item["editable"] = false;
      item.part = sanitizeFileName(item.part);
      return item as unknown as { cid: number; part: string; editable: boolean };
    }),
  };

  if (data.View.pages.length === 1) {
    selectCids.value = [data.View.pages[0].cid];
  }
};

const download = async () => {
  await parse();
  visible.value = true;
};

const confirm = (options: { ids: number[]; savePath: string }) => {
  const selectPages = archiveDeatil.value.pages.filter((item) => options.ids.includes(item.cid));

  for (const page of selectPages) {
    window.api.bili.download(
      {
        output: window.path.join(options.savePath, `${page.part}.mp4`),
        cid: page.cid,
        bvid: archiveDeatil.value.bvid,
      },
      uid.value,
    );
  }
  notice.success({
    title: "已加入队列",
    duration: 1000,
  });
};

const visible = ref(false);
</script>

<style scoped lang="less">
.container {
  // display: flex;
  // justify-content: center;
  // flex-direction: column;
  // align-items: center;
  width: 80%;
  margin: 0 auto;
}
.input {
  margin-top: 20px;
  display: flex;
  align-items: center;
}
</style>
