<template>
  <n-modal v-model:show="showModal">
    <n-card style="width: 80%" :bordered="false" role="dialog" aria-modal="true">
      <Artplayer
        ref="videoRef"
        style="aspect-ratio: 16 / 9"
        :option="{
          fullscreen: true,
          url: props.videoUrl,
        }"
        is-live
        :plugins="['danmuku', 'hls']"
        @ready="handleVideoReady"
      ></Artplayer>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import Artplayer from "@renderer/components/Artplayer/Index.vue";

import { getDanmaStream } from "@renderer/apis/common";
import type ArtplayerType from "artplayer";

interface Props {
  id: string;
  videoUrl: string;
}

const showModal = defineModel<boolean>("visible", { required: true, default: false });
const props = defineProps<Props>();

// const logs = ref("");

let eventSource: EventSource | null = null;
const videoRef = ref<InstanceType<typeof Artplayer> | null>(null);

async function streamLogs() {
  eventSource = await getDanmaStream(props.id);

  eventSource.onmessage = function (event) {
    const data = JSON.parse(event.data);
    if (!videoInstance.value) return;

    // @ts-ignore
    videoInstance?.value?.artplayerPluginDanmuku?.emit({
      // TODO:差一个mode，0: 滚动(默认)，1: 顶部，2: 底部
      text: data.text,
      color: data.color,
      border: false,
    });
  };

  // eventSource.onerror = function () {};
}
watch(
  () => showModal.value,
  (value) => {
    if (value) {
      streamLogs();
    } else {
      eventSource?.close();
    }
  },
);

const videoInstance = ref<ArtplayerType | null>(null);
const handleVideoReady = async (instance: ArtplayerType) => {
  // console.log("video ready", instance);
  videoInstance.value = instance;
  if (props.videoUrl) {
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
