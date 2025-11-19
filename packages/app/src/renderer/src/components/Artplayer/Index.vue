<template>
  <div ref="artRef" class="artplayer" tabindex="0"></div>
</template>

<script lang="ts" setup>
import Artplayer from "artplayer";
import Hls from "hls.js";
import mpegts from "mpegts.js";

import artplayerPluginAssJS from "artplayer-plugin-assjs";
import artplayerPluginHeatmap from "./artplayer-plugin-heatmap";
import artplayerPluginTimestamp from "./artplayer-timestamp";
import artplayerPluginDanmuku from "artplayer-plugin-danmuku";
import artplayerPluginHlsControl from "artplayer-plugin-hls-control";

const props = withDefaults(
  defineProps<{
    option: {
      fullscreen?: boolean;
      url?: string;
      string?: any;
      plugins?: {
        heatmap?: {
          data?: any[];
          option?: {
            sampling?: number;
            height?: number;
            color?: string;
            fillColor?: string;
          };
        };
        timestamp?: {
          position?: { top?: string; bottom?: string; left?: string; right?: string };
          visible?: boolean;
          timestamp?: number;
        };
      };
    };
    plugins?: string[];
    isLive?: boolean;
  }>(),
  {
    isLive: false,
  },
);
const emits = defineEmits<{
  (event: "ready", value: Artplayer): void;
  (event: "error", value: { error: any; reconnectTime: number }): void;
  (event: "seek", value: number): void;
  (event: "video:durationchange", value: number): void;
}>();

const artRef = ref<HTMLDivElement | null>(null);
let instance: Artplayer | null = null;

onMounted(async () => {
  const plugins: any[] = [];
  if (props.plugins) {
    if (props.plugins.includes("danmuku")) {
      plugins.push(
        artplayerPluginDanmuku({
          danmuku: [],
          emitter: false,
          heatmap: false,
        }),
      );
    }
    if (props.plugins.includes("ass")) {
      plugins.push(
        artplayerPluginAssJS({
          content: "",
        }),
      );
    }
    if (props.plugins.includes("hls")) {
      plugins.push(
        artplayerPluginHlsControl({
          quality: {
            // Show qualitys in control
            control: false,
            // Show qualitys in setting
            setting: false,
            // Get the quality name from level
            // I18n
            title: "Quality",
            auto: "Auto",
          },
          audio: {
            // Show audios in control
            control: false,
            // Show audios in setting
            setting: false,
            // Get the audio name from track
            // I18n
            title: "Audio",
            auto: "Auto",
          },
        }),
      );
    }
    if (props.plugins.includes("heatmap")) {
      plugins.push(artplayerPluginHeatmap([], props?.option?.plugins?.heatmap?.option ?? {}));
    }
    if (props.plugins.includes("timestamp")) {
      plugins.push(
        artplayerPluginTimestamp({
          position: { top: "10px", right: "10px" },
          visible: false,
          timestamp: 0,
          ...props?.option?.plugins?.timestamp,
        }),
      );
    }
  } else {
    plugins.push(
      artplayerPluginAssJS({
        content: "",
      }),
    );
  }
  if (artRef.value === null) {
    console.error("artRef is null");
    return;
  }
  instance = new Artplayer({
    url: "",
    isLive: props.isLive,
    ...props.option,
    container: artRef.value,
    plugins: plugins,
    customType: {
      flv: (video, url, art) => {
        if (mpegts.isSupported()) {
          if (art.flv) art.flv.destroy();

          const flv = mpegts.createPlayer({
            type: "flv",
            url: url,
          });
          flv.attachMediaElement(video);
          flv.load();
          flv.play();

          art.flv = flv;
          art.on("destroy", () => flv.destroy());
        } else {
          art.notice.show = "Unsupported playback format: flv";
        }
      },
      m3u8: function playM3u8(video, url, art) {
        if (Hls.isSupported()) {
          if (art.hls) art.hls.destroy();
          const hls = new Hls();
          hls.loadSource(url);
          hls.attachMedia(video);
          art.hls = hls;
          art.on("destroy", () => hls.destroy());
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = url;
        } else {
          art.notice.show = "Unsupported playback format: m3u8";
        }
      },
      ts: function play(video, url, art) {
        const duration = 5;
        const tsFile = url;
        const m3u8Content = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:${duration}
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:${duration},
${tsFile}
#EXT-X-ENDLIST`;

        const blob = new Blob([m3u8Content], { type: "application/vnd.apple.mpegurl" });
        const m3u8URL = URL.createObjectURL(blob);

        if (Hls.isSupported()) {
          if (art.hls) art.hls.destroy();
          const hls = new Hls();
          hls.loadSource(m3u8URL);
          hls.attachMedia(video);
          art.hls = hls;
          art.on("destroy", () => hls.destroy());
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = url;
        } else {
          art.notice.show = "Unsupported playback format: m3u8";
        }
      },
    },
  });

  // @ts-ignore
  instance.artplayerPluginDanmuku = instance?.plugins?.artplayerPluginDanmuku;
  // @ts-ignore
  instance.artplayerPluginHeatmap = instance?.plugins?.artplayerPluginHeatmap;
  // @ts-ignore
  instance.artplayerTimestamp = instance?.plugins?.artplayerTimestamp;
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
    instance.plugins.artplayerPluginAssJS.switch(subtitle || "");
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
