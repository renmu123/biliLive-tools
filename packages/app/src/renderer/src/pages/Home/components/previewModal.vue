<template>
  <n-modal v-model:show="showModal">
    <n-card style="width: 80%" :bordered="false" role="dialog" aria-modal="true">
      <Artplayer
        ref="videoRef"
        style="aspect-ratio: 16 / 9"
        :option="{}"
        @ready="handleVideoReady"
      ></Artplayer>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import Artplayer from "@renderer/components/Artplayer/Index.vue";

import type ArtplayerType from "artplayer";

interface Props {
  files: {
    video: string;
    danmu: string;
  };
}

const showModal = defineModel<boolean>("visible", { required: true, default: false });
const props = withDefaults(defineProps<Props>(), {
  files: () => {
    return {
      video: "",
      danmu: "",
    };
  },
});
const videoRef = ref<InstanceType<typeof Artplayer> | null>(null);

watch(
  () => props.files,
  async (files) => {
    if (files.danmu) {
      console.log(files.danmu);
      const content = await window.api.common.readFile(props.files.danmu);
      videoRef.value?.switchAss(content);
    }
  },
  { deep: true },
);

const videoInstance = ref<ArtplayerType | null>(null);
const handleVideoReady = async (instance: ArtplayerType) => {
  videoInstance.value = instance;
  if (props.files.video) {
    videoRef.value?.switchUrl(props.files.video, props.files.video.endsWith(".flv") ? "flv" : "");
  }
  if (props.files.danmu) {
    const content = await window.api.common.readFile(props.files.danmu);
    videoRef.value?.switchAss(content);
  }
};
</script>

<style scoped></style>
