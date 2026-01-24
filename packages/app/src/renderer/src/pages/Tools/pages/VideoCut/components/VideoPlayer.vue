<template>
  <div class="video-section">
    <div v-show="videoPath" class="video cut-video">
      <Artplayer
        v-show="videoPath"
        ref="videoRef"
        :option="{
          fullscreen: true,
          plugins: {
            heatmap: {
              option: heatmapOptions,
            },
            timestamp: {
              timestamp: 0,
            },
          },
        }"
        :plugins="['ass', 'heatmap', 'timestamp', 'subtitle']"
        @ready="handleReady"
        @video:durationchange="handleDurationChange"
        @video:canplay="handleCanPlay"
      ></Artplayer>
    </div>

    <FileArea
      v-show="!videoPath"
      v-model="fileList"
      :style="{ height: '100%' }"
      class="video empty cut-file-area"
      :extensions="supportedExtensions"
      :max="1"
      @change="$emit('filesDropped', $event)"
    >
      <template #desc>
        请导入视频或<a href="https://github.com/mifi/lossless-cut" target="_blank">lossless-cut</a
        >项目文件，如果你不会使用，请先<span title="鸽了"
          >查看教程，如果视频无法播放，请尝试转封装为mp4</span
        >
      </template>
    </FileArea>
  </div>
</template>

<script setup lang="ts">
import { ref, type PropType } from "vue";
import Artplayer from "@renderer/components/Artplayer/Index.vue";
import FileArea from "@renderer/components/FileArea.vue";
import type ArtplayerType from "artplayer";

const props = defineProps({
  videoPath: {
    type: String as PropType<string | null>,
    default: null,
  },
  heatmapOptions: {
    type: Object,
    required: true,
  },
  supportedExtensions: {
    type: Array as PropType<string[]>,
    default: () => ["llc", "flv", "mp4", "m4s", "ts", "mkv"],
  },
});

const emit = defineEmits<{
  ready: [instance: ArtplayerType];
  durationChange: [duration: number];
  canPlay: [];
  filesDropped: [files: any[]];
}>();

const videoRef = ref<InstanceType<typeof Artplayer> | null>(null);
const fileList = ref<any[]>([]);

const handleReady = (instance: ArtplayerType) => {
  emit("ready", instance);
};

const handleDurationChange = (duration: number) => {
  emit("durationChange", duration);
};

const handleCanPlay = () => {
  emit("canPlay");
};

const clearFiles = () => {
  fileList.value = [];
};

// 暴露给父组件
defineExpose({
  videoRef,
  switchUrl: (url: string, type?: "" | "flv") => videoRef.value?.switchUrl(url, type),
  switchAss: (content: string) => videoRef.value?.switchAss(content),
  clearFiles,
});
</script>

<style scoped lang="less">
.video-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;

  .video {
    width: 100%;
    height: 100%;
    position: relative;

    &.empty {
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 22px;
      &.cut-file-area {
        box-sizing: border-box;
      }
    }
  }
  :deep(.art-bottom) {
    opacity: 1 !important;
    --art-bottom-offset: 0px !important;
  }
  :deep(.art-subtitle) {
    bottom: calc(var(--art-control-height) + var(--art-subtitle-bottom));
  }
}
</style>
