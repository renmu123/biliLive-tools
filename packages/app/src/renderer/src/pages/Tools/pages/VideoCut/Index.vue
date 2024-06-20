<template>
  <div class="container">
    <div class="btns">
      <n-button @click="importCsv"> 导入时间戳 </n-button>
      <n-button type="primary" @click="addVideo"> {{ videoTitle }} </n-button>
      <input
        ref="videoInputRef"
        type="file"
        accept="video/*,.flv"
        style="display: none"
        @change="handleVideoChange"
      />
      <n-button type="primary" @click="addDanmu"> {{ danmuTitle }} </n-button>
      <input
        ref="danmuInputRef"
        type="file"
        accept=".xml,.ass"
        style="display: none"
        @change="handleDanmuChange"
      />

      <n-button type="primary" @click="exportCuts"> 导出切片 </n-button>
    </div>

    <div class="content">
      <Artplayer class="video" :option="{}" @ready="artplayerReady"></Artplayer>
      <!-- <div ref="videoRef" class="video"></div> -->
      <!-- <video ref="videoRef" class="video" controls width="80%">
        你的浏览器不支持HTML5 video标签。
      </video> -->
      <div class="list">
        <div>dasdacontent</div>
        <div>dasdacontent</div>
        <div>dasdacontent</div>
      </div>
    </div>
  </div>
  <Xml2AssModal v-model="xmlConvertVisible" @confirm="danmuConfirm"></Xml2AssModal>
</template>

<script setup lang="ts">
import { uuid } from "@renderer/utils";
import Artplayer from "@renderer/components/Artplayer.vue";

import Xml2AssModal from "./components/Xml2AssModal.vue";
import type { DanmuConfig, DanmuOptions } from "@biliLive-tools/types";

// onMounted(() => {
//   if (videoRef.value) {
//     const instance = new Artplayer({
//       container: videoRef.value,
//     });
//   }
// });

const files = ref<{
  video: string | null;
  danmu: string | null;
}>({
  video: null,
  danmu: null,
});
const videoTitle = computed(() => {
  return files.value.video ? "替换视频" : "添加视频";
});
const danmuTitle = computed(() => {
  return files.value.danmu ? "替换弹幕" : "添加弹幕";
});

const cuts = ref<
  {
    start: string;
    end: string;
    name: string;
  }[]
>([]);
const importCsv = async () => {
  //   const file = await window.api.openFile({
  //     multi: false,
  //     filters: [
  //       {
  //         name: "csv",
  //         extensions: ["csv"],
  //       },
  //       {
  //         name: "所有文件",
  //         extensions: ["*"],
  //       },
  //     ],
  //   });
  //   if (!file) return;
  //   files.value.subtitle = file[0].path;
};

const videoInputRef = ref<HTMLInputElement | null>(null);
const danmuInputRef = ref<HTMLInputElement | null>(null);
// const videoRef = ref<HTMLVideoElement | null>(null);
// const videoRef = ref<HTMLDivElement | null>(null);
const instance = ref<Artplayer | null>(null);

const addVideo = () => {
  videoInputRef.value?.click();
};
const handleVideoChange = async (event: any) => {
  const file = event.target.files[0];
  const url = URL.createObjectURL(file);

  const path = window.api.common.getPathForFile(file);
  files.value.video = path;
  // videoRef.value.src = url;
  console.log(instance.value);

  if (instance.value) {
    instance.value.url = url;
  }

  // 添加视频时将切片清空
  cuts.value = [];
};

const artplayerReady = (artplayer: Artplayer) => {
  instance.value = artplayer;
};

const addDanmu = async () => {
  danmuInputRef.value?.click();
};
const xmlConvertVisible = ref(false);
const tempXmlFile = ref("");
const handleDanmuChange = async (event: any) => {
  const file = event.target.files[0];
  const path = window.api.common.getPathForFile(file);
  // 如果是xml文件则弹框提示，要求转换为ass文件
  if (path.endsWith(".ass")) {
    files.value.danmu = path;
  } else {
    xmlConvertVisible.value = true;
    tempXmlFile.value = path;
  }
};

const danmuConfirm = async (config: DanmuConfig) => {
  const path = await convertDanmu2Ass(
    {
      input: tempXmlFile.value,
      output: uuid(),
    },
    { saveRadio: 2, savePath: window.api.common.getTempPath(), removeOrigin: false },
    config,
  );
  files.value.danmu = path;
};
/**
 * xml文件转换为ass
 */
const convertDanmu2Ass = async (
  file: {
    input: string;
    output: string;
  },
  options: DanmuOptions,
  config: DanmuConfig,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    window.api.danmu
      .convertXml2Ass(file, config, { ...options, copyInput: true })
      .then((result: any) => {
        const taskId = result.taskId;
        window.api.task.on(taskId, "end", (data) => {
          resolve(data.output);
        });

        window.api.task.on(taskId, "error", (data) => {
          reject(data.err);
        });
      });
  });
};

const exportCuts = () => {};
</script>

<style scoped lang="less">
.btns {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  gap: 10px;
}

.content {
  display: flex;
  gap: 10px;
  .video {
    width: 80%;
    aspect-ratio: 16 / 9;
  }
  .list {
    display: inline-block;
  }
}
</style>
