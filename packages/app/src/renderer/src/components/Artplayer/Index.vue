<template>
  <div ref="artRef" class="artplayer"></div>
</template>

<script lang="ts" setup>
import Artplayer from "artplayer";
import flvjs from "flv.js";
import artplayerPluginAss from "./artplayer-plugin-assjs";
import artplayerPluginDanmuku from "artplayer-plugin-danmuku";

const props = defineProps<{
  option: any;
  plugins?: string[];
}>();
const emits = defineEmits<{
  (event: "ready", value: Artplayer): void;
  (event: "error", value: { error: any; reconnectTime: number }): void;
  (event: "seek", value: number): void;
  (event: "video:durationchange", value: number): void;
}>();

const artRef = ref(null);
let instance: Artplayer | null = null;

onMounted(async () => {
  const plugins: any[] = [];
  if (props.plugins) {
    if (props.plugins.includes("danmuku")) {
      plugins.push(
        artplayerPluginDanmuku({
          danmuku: [],
          mount: undefined,
          heatmap: false,
        }),
      );
    }
    if (props.plugins.includes("ass")) {
      plugins.push(
        artplayerPluginAss({
          content: "",
        }),
      );
    }
  } else {
    plugins.push(
      artplayerPluginAss({
        content: "",
      }),
    );
  }
  instance = new Artplayer({
    url: "",
    ...props.option,
    container: artRef.value,
    plugins: plugins,
    customType: {
      flv: (video, url, art) => {
        if (flvjs.isSupported()) {
          if (art.flv) art.flv.destroy();
          const flv = flvjs.createPlayer({ type: "flv", url });
          flv.attachMediaElement(video);
          flv.load();
          art.flv = flv;
          art.on("destroy", () => flv.destroy());
        } else {
          art.notice.show = "Unsupported playback format: flv";
        }
      },
    },
  });
  await nextTick();
  emits("ready", instance);
  instance.on("error", (error, reconnectTime) => {
    emits("error", { error, reconnectTime });
  });
  instance.on("seek", (currentTime) => {
    emits("seek", currentTime);
  });
  instance.on("video:durationchange", () => {
    const duration = Number(instance!.duration);
    emits("video:durationchange", duration);
  });
});

const switchUrl = async (url: string, type: "" | "flv" = "") => {
  if (instance) {
    instance.type = type;
    instance?.switchUrl(url);
  } else {
    console.error("instance is null");
  }
};

const switchAss = async (subtitle?: string) => {
  if (instance) {
    instance.plugins.artplayerPluginAss.switch(subtitle || "");
  }
};

const video = computed(() => instance);

defineExpose({
  switchUrl,
  video,
  switchAss,
});

onBeforeUnmount(() => {
  if (instance && instance.destroy) {
    instance.destroy(false);
  }
});
</script>

<style lang="less">
.artplayer {
  width: 100%;
  height: 100%;
}

.artplayer .ASS-box {
  z-index: 21;
}
</style>
