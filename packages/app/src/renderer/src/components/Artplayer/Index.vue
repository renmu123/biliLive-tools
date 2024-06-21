<template>
  <div ref="artRef" class="artplayer"></div>
</template>

<script lang="ts" setup>
import Artplayer from "artplayer";
import flvjs from "flv.js";
import artplayerPluginAss from "./artplayer-plugin-assjs";

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
    plugins: [],
  });

  if (subtitle) {
    addSutitle(subtitle);
  }

  await nextTick();
  emit("ready", instance);
};

const addSutitle = async (subtitle: string) => {
  if (instance) {
    instance.plugins.add(
      artplayerPluginAss({
        content: subtitle,
      }),
    );
  }
};

const setFlvMode = async (url: string, subtitle?: string) => {
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
    plugins: [],
  });

  if (subtitle) {
    addSutitle(subtitle);
  }

  await nextTick();
  emit("ready", instance);
};

defineExpose({
  setFlvMode,
  setCommonMode,
  instance,
  addSutitle,
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
