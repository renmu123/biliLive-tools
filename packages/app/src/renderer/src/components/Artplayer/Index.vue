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
import type { Option as DanmukuOption, Result as DanmukuResult } from "artplayer-plugin-danmuku";
import artplayerPluginHlsControl from "artplayer-plugin-hls-control";
import artplayerPluginSubtitle from "./artplayer-plugin-subtitle";
import artplayerPluginChapter from "./artplayer-plugin-chapter";
import artplayerPluginSC from "./artplayer-plugin-sc";
import type { SuperChatItem } from "./artplayer-plugin-sc";
import { useStorage } from "@vueuse/core";

type DanmukuSettings = Pick<
  DanmukuOption,
  | "visible"
  | "modes"
  | "opacity"
  | "margin"
  | "fontSize"
  | "speed"
  | "antiOverlap"
  | "synchronousPlayback"
  | "mode"
  | "color"
>;

const getDanmukuSettings = (option: DanmukuOption): DanmukuSettings => ({
  visible: option.visible,
  modes: option.modes,
  opacity: option.opacity,
  margin: option.margin,
  fontSize: option.fontSize,
  speed: option.speed,
  antiOverlap: option.antiOverlap,
  synchronousPlayback: option.synchronousPlayback,
  mode: option.mode,
  color: option.color,
});

const danmukuSettings = useStorage<Partial<DanmukuSettings>>("artplayer-danmuku-settings", {});

const props = withDefaults(
  defineProps<{
    option: {
      fullscreen?: boolean;
      muted?: boolean;
      volume?: number;
      mutex?: boolean;
      url?: string;
      type?: string;
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
        subtitle?: {
          subtitles?: Array<{
            url?: string;
            content?: string;
            name: string;
            type?: "srt" | "ass" | "vtt";
            encoding?: string;
          }>;
        };
        sc?: {
          duration?: number;
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
  (event: "video:canplay", value: Artplayer): void;
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
          ...danmukuSettings.value,
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
    if (props.plugins.includes("subtitle")) {
      const plugin = await artplayerPluginSubtitle({
        subtitles: props?.option?.plugins?.subtitle?.subtitles || [],
      });
      plugins.push(plugin);
    }
    if (props.plugins.includes("chapter")) {
      plugins.push(artplayerPluginChapter({}));
    }
    if (props.plugins.includes("sc")) {
      plugins.push(artplayerPluginSC(props?.option?.plugins?.sc));
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
  let disposeStream: (() => void) | undefined;
  const replaceStream = (art: Artplayer, dispose: () => void) => {
    if (disposeStream) {
      art.off("destroy", disposeStream);
      disposeStream();
    }
    disposeStream = dispose;
    art.on("destroy", dispose);
  };
  instance = new Artplayer({
    url: props?.option?.url ?? "",
    type: props?.option?.type ?? "",
    isLive: props.isLive,
    setting: props.isLive ? false : true,
    playbackRate: props.isLive ? false : true,
    autoplay: props.isLive ? true : false,
    ...props.option,
    container: artRef.value,
    plugins: plugins,
    subtitle: {
      style: {
        fontSize: "30px",
      },
    },
    // setting: true,
    // playbackRate: true,
    customType: {
      flv: (video, url, art) => {
        if (mpegts.isSupported()) {
          const flv = mpegts.createPlayer({
            type: "flv",
            url: url,
            isLive: props.isLive,
          });
          replaceStream(art, () => flv.destroy());
          flv.attachMediaElement(video);
          flv.load();

          art.flv = flv;
        } else {
          art.notice.show = "Unsupported playback format: flv";
        }
      },
      m3u8: function playM3u8(video, url, art) {
        if (Hls.isSupported()) {
          const hls = new Hls();
          replaceStream(art, () => hls.destroy());
          hls.loadSource(url);
          hls.attachMedia(video);
          art.hls = hls;
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
          const hls = new Hls();
          replaceStream(art, () => {
            hls.destroy();
            URL.revokeObjectURL(m3u8URL);
          });
          hls.loadSource(m3u8URL);
          hls.attachMedia(video);
          art.hls = hls;
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = url;
          URL.revokeObjectURL(m3u8URL);
        } else {
          URL.revokeObjectURL(m3u8URL);
          art.notice.show = "Unsupported playback format: m3u8";
        }
      },
    },
  });
  if (props.isLive) {
    instance.controls.add({
      name: "refreshStream",
      position: "left",
      index: 15,
      tooltip: "刷新",
      html: '<svg viewBox="0 0 24 24" width="24" height="24" style="fill: none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.4 6.4"/><path d="M20 4v7h-7"/></svg>',
      click: () => {
        if (!instance?.option.url) return;
        const player = instance;
        player.pause();
        player.once("video:canplay", () => {
          if (!player.isDestroy) void player.play();
        });
        player.url = player.option.url;
      },
    });
    instance.proxy(
      instance.video,
      "click",
      (event) => {
        event.stopImmediatePropagation();
        if (instance && !instance.playing && !Artplayer.utils.isMobile) instance.play();
      },
      { capture: true },
    );
    instance.proxy(instance.video, "dblclick", () => {
      if (instance && !Artplayer.utils.isMobile && Artplayer.DBCLICK_FULLSCREEN) {
        instance.fullscreen = !instance.fullscreen;
      }
    });
  }
  await nextTick();

  // @ts-ignore
  instance.artplayerPluginSubtitle = instance?.plugins?.artplayerPluginSubtitle;
  // @ts-ignore
  instance.artplayerPluginDanmuku = instance?.plugins?.artplayerPluginDanmuku;
  // @ts-ignore
  instance.artplayerPluginHeatmap = instance?.plugins?.artplayerPluginHeatmap;
  // @ts-ignore
  instance.artplayerTimestamp = instance?.plugins?.artplayerTimestamp;
  // @ts-ignore
  instance.artplayerPluginChapter = instance?.plugins?.artplayerPluginChapter;
  // @ts-ignore
  instance.artplayerPluginSC = instance?.plugins?.artplayerPluginSC;

  if (props.plugins?.includes("danmuku")) {
    let previousSettings = getDanmukuSettings(
      (instance.plugins.artplayerPluginDanmuku as DanmukuResult).option,
    );
    instance.on("artplayerPluginDanmuku:config", (option) => {
      const settings = getDanmukuSettings(option as DanmukuOption);
      const updatedSettings = { ...danmukuSettings.value };
      let changed = false;
      for (const key of Object.keys(settings) as (keyof DanmukuSettings)[]) {
        if (JSON.stringify(settings[key]) !== JSON.stringify(previousSettings[key])) {
          Object.assign(updatedSettings, { [key]: settings[key] });
          changed = true;
        }
      }
      if (changed) danmukuSettings.value = updatedSettings;
      previousSettings = settings;
    });
  }

  // console.log("Artplayer instance created:", instance);

  setTimeout(() => {
    // TODO:这里可能未来会出现问题，artplayerPluginSubtitle是异步插件
    // @ts-ignore
    instance.artplayerPluginSubtitle = instance?.plugins?.artplayerPluginSubtitle;
  }, 1000);
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
  instance.on("video:canplay", () => {
    emits("video:canplay", instance!);
  });
});

const switchUrl = async (url: string, type: "" | "flv" | "m3u8" = "") => {
  if (instance) {
    instance.type = type;
    instance?.switchUrl(url);
  } else {
    console.error("instance is null");
  }
};

const switchAss = async (subtitle?: string) => {
  if (instance) {
    // @ts-ignore
    instance.plugins.artplayerPluginAssJS.switch(subtitle || "");
  }
};

const switchDanmuku = async (danmuku: any[]) => {
  if (instance) {
    // @ts-ignore
    instance.plugins.artplayerPluginDanmuku.config({
      danmuku: danmuku,
    });
    // @ts-ignore
    instance.plugins.artplayerPluginDanmuku.load();
  }
};

const switchSC = (sc: SuperChatItem[]) => {
  const plugin = instance?.plugins?.artplayerPluginSC as
    | ReturnType<ReturnType<typeof artplayerPluginSC>>
    | undefined;
  plugin?.setData(sc);
};

// subtitle
const switchSubtitle = async (names: string[]) => {
  if (instance && instance.plugins.artplayerPluginSubtitle) {
    // @ts-ignore
    instance.plugins.artplayerPluginSubtitle.tracks(names);
  }
};

const resetSubtitle = async () => {
  if (instance && instance.plugins.artplayerPluginSubtitle) {
    // @ts-ignore
    instance.plugins.artplayerPluginSubtitle.reset();
  }
};

const setSubtitleContent = async (content: string) => {
  if (instance && instance.plugins.artplayerPluginSubtitle) {
    // @ts-ignore
    instance.plugins.artplayerPluginSubtitle.setContent(content);
  }
};

const video = computed(() => instance);

defineExpose({
  switchUrl,
  video,
  switchAss,
  switchDanmuku,
  switchSC,
  switchSubtitle,
  resetSubtitle,
  setSubtitleContent,
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
