<template>
  <div class="container">
    <div class="input">
      <n-input
        v-model:value="url"
        :style="{ width: '80%' }"
        placeholder="请输入b站视频链接，比如：https://www.bilibili.com/video/BV1u94y1K7nr"
      />
      <n-button type="primary" ghost @click="parse"> 解析 </n-button>
      <n-button type="primary" ghost @click="download"> 下载 </n-button>
    </div>

    <div v-if="archiveDeatil.title" class="detail">
      <p>标题：{{ archiveDeatil.title }}</p>
      <p>分P：</p>
      <n-checkbox-group v-model:value="selectCids">
        <n-space item-style="display: flex;" align="center">
          <n-checkbox
            v-for="item in archiveDeatil.pages"
            :key="item.cid"
            :label="item.part"
            :value="item.cid"
          />
        </n-space>
      </n-checkbox-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserInfoStore } from "@renderer/stores";
import { storeToRefs } from "pinia";

const { userInfo } = storeToRefs(useUserInfoStore());
const url = ref("https://www.bilibili.com/video/BV1u94y1K7nr");
const archiveDeatil = ref<{
  title: string;
  pages: { cid: number; part: string }[];
}>({
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
  console.log(url.value);
  const bvid = extractBVNumber(url.value);
  if (!bvid) {
    notice.error({
      title: "请输入正确的b站视频链接",
      duration: 1000,
    });
    return;
  }
  selectCids.value = [];
  const data = await window.api.bili.getArchiveDetail(bvid, uid.value);
  console.log(data);
  archiveDeatil.value = {
    title: data.View.title,
    pages: data.View.pages,
  };
  if (data.View.pages.length === 1) {
    selectCids.value = [data.View.pages[0].cid];
  }
};

const download = () => {
  if (selectCids.value.length === 0) {
    notice.error({
      title: "请选择分P",
      duration: 1000,
    });
    return;
  }
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
}
.input {
  margin-top: 20px;
}
</style>
