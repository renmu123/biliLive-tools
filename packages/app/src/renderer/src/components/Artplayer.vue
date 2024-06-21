<template>
  <div ref="artRef" class="artplayer"></div>
</template>

<script lang="ts" setup>
import Artplayer from "artplayer";
import flvjs from "flv.js";
import artplayerPluginLibass from "artplayer-plugin-libass";

const props = defineProps<{
  option: any;
}>();
const emit = defineEmits(["ready"]);

const artRef = ref(null);
let instance: Artplayer | null = null;

onMounted(async () => {
  // setCommonMode("");
});

const setCommonMode = async (url: string, subtitle?: string) => {
  console.log("setCommonMode", url, subtitle);
  if (instance && instance?.destroy) instance.destroy(false);

  instance = new Artplayer({
    ...props.option,
    // @ts-ignore
    container: artRef.value,
    url: url,
    subtitle: {
      url: subtitle,
      type: "ass",
    },
    plugins: [
      artplayerPluginLibass({
        debug: true,
        workerUrl: "https://unpkg.com/libass-wasm@4.1.0/dist/js/subtitles-octopus-worker.js",
        // wasmUrl: 'https://unpkg.com/libass-wasm@4.1.0/dist/js/subtitles-octopus-worker.wasm',
        fallbackFont: "https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap",
      }),
    ],
  });

  // init
  instance.on("artplayerPluginLibass:init", (adapter) => {
    console.info("artplayerPluginLibass:init", adapter);
  });

  // subtitle switch
  instance.on("artplayerPluginLibass:switch", (url) => {
    console.info("artplayerPluginLibass:switch", url);
  });

  // subtitle visible
  instance.on("artplayerPluginLibass:visible", (visible) => {
    console.info("artplayerPluginLibass:visible", visible);
  });

  // subtitle timeOffset
  instance.on("artplayerPluginLibass:timeOffset", (timeOffset) => {
    console.info("artplayerPluginLibass:timeOffset", timeOffset);
  });

  // destroy
  instance.on("artplayerPluginLibass:destroy", () => {
    console.info("artplayerPluginLibass:destroy");
  });

  await nextTick();
  emit("ready", instance);
};

const setFlvMode = async (url: string) => {
  if (instance && instance?.destroy) instance.destroy(false);

  instance = new Artplayer({
    ...props.option,
    // @ts-ignore
    container: artRef.value,
    url: url,
    type: "flv",
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
    plugins: [
      artplayerPluginLibass({
        // debug: true,
        workerUrl: "https://unpkg.com/libass-wasm@4.1.0/dist/js/subtitles-octopus-worker.js",
        // wasmUrl: 'https://unpkg.com/libass-wasm@4.1.0/dist/js/subtitles-octopus-worker.wasm',
        fallbackFont: "/SourceHanSansCN-Bold.ttf",
      }),
    ],
  });

  await nextTick();
  emit("ready", instance);
};

defineExpose({
  setFlvMode,
  setCommonMode,
  instance,
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
</style>
