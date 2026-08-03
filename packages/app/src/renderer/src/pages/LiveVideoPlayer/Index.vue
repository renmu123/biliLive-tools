<template>
  <Artplayer
    ref="videoRef"
    style="aspect-ratio: 16 / 9"
    :option="{
      fullscreen: true,
      url: query.url,
    }"
    is-live
    :plugins="['danmuku', 'hls']"
    @ready="handleVideoReady"
  ></Artplayer>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import Artplayer from "@renderer/components/Artplayer/Index.vue";
import { useTitle } from "@vueuse/core";
import { getDanmaStream } from "@renderer/apis/common";

import type ArtplayerType from "artplayer";

interface Props {
  id: string;
  url: string;
  owner: string;
}

const route = useRoute() as unknown as { query: Props };
const query = route.query;
useTitle(`${query.owner} 直播中`);
// const logs = ref("");

let eventSource: EventSource | null = null;
// const videoRef = ref<InstanceType<typeof Artplayer> | null>(null);

async function streamLogs() {
  eventSource = await getDanmaStream(query.id);

  eventSource.onmessage = function (event) {
    const data = JSON.parse(event.data);
    if (!videoInstance.value) return;
    if (!data.text) return;
    let mode = 0;

    if ([1, 2, 3].includes(data.mode ?? "")) {
      mode = 0;
    } else if (data.mode === 4) {
      mode = 2;
    } else if (data.mode === 5) {
      mode = 1;
    }

    // @ts-ignore
    videoInstance?.value?.artplayerPluginDanmuku?.emit({
      // mode，0: 滚动(默认)，1: 顶部，2: 底部
      mode: mode,
      text: data.text,
      color: data.color,
      border: false,
    });
  };

  // eventSource.onerror = function () {};
}

onMounted(() => {
  streamLogs();
});

const videoInstance = ref<ArtplayerType | null>(null);
const handleVideoReady = async (instance: ArtplayerType) => {
  // console.log("video ready", instance);
  videoInstance.value = instance;
  if (query.url) {
    // videoRef.value?.switchUrl(props.videoUrl, props.videoUrl.endsWith(".flv") ? "flv" : "");
    // instance.play();
  }
  // if (props.files.video) {
  //   videoRef.value?.switchUrl(props.files.video, props.files.video.endsWith(".flv") ? "flv" : "");
  // }
  // if (props.files.danmu) {
  //   const content = await window.api.common.readFile(props.files.danmu);
  //   videoRef.value?.switchAss(content);
  // }
};
</script>

<style scoped lang="less"></style>
