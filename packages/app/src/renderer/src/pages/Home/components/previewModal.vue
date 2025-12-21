<template>
  <n-modal v-model:show="showModal">
    <n-card style="width: 80%" :bordered="false" role="dialog" aria-modal="true">
      <Artplayer
        ref="videoRef"
        style="aspect-ratio: 16 / 9"
        :option="{
          fullscreen: true,
          plugins: {
            heatmap: {
              option: props.hotProgress,
            },
          },
        }"
        :plugins="['ass', 'heatmap', 'danmuku']"
        @ready="handleVideoReady"
      ></Artplayer>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import Artplayer from "@renderer/components/Artplayer/Index.vue";
import { commonApi, danmaApi } from "@renderer/apis";

import type ArtplayerType from "artplayer";

interface Props {
  files: {
    video: string;
    danmu: string;
    type: string;
  };
  hotProgress: {
    visible: boolean;
    sampling: number;
    height: number;
    fillColor: string;
    color: string;
  };
}

const showModal = defineModel<boolean>("visible", { required: true, default: false });
const props = withDefaults(defineProps<Props>(), {
  files: () => {
    return {
      video: "",
      danmu: "",
      type: "",
    };
  },
});
const videoRef = ref<InstanceType<typeof Artplayer> | null>(null);

watch(
  () => props.files.danmu,
  async () => {
    initDanma();
  },
);

const initDanma = async () => {
  if (!props.files.danmu) return;

  if (props.files.danmu.endsWith(".ass")) {
    const content = await commonApi.readDanma(props.files.danmu);
    videoRef.value?.switchAss(content);
  } else if (props.files.danmu.endsWith(".xml")) {
    const content = await danmaApi.parseForArtPlayer(props.files.danmu);
    videoRef.value?.switchDanmuku(content);
  } else {
    throw new Error("不支持的弹幕格式");
  }

  if (props.hotProgress.visible) {
    const data = await commonApi.genTimeData(props.files.danmu);
    // @ts-ignore
    videoInstance.value && videoInstance.value.artplayerPluginHeatmap.setData(data);
    setTimeout(() => {
      // @ts-ignore
      videoInstance.value.artplayerPluginHeatmap.setOptions(props.hotProgress);

      // @ts-ignore
      videoInstance.value?.artplayerPluginHeatmap.show();
    }, 200);
  } else {
    // @ts-ignore
    videoInstance.value?.artplayerPluginHeatmap.hide();
  }
};

const videoInstance = ref<ArtplayerType | null>(null);
const handleVideoReady = async (instance: ArtplayerType) => {
  videoInstance.value = instance;
  if (props.files.video) {
    videoRef.value?.switchUrl(props.files.video, props.files.type as any);
  }
  initDanma();
};
</script>

<style scoped></style>
