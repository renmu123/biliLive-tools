<template>
  <div class="container">
    <div class="btns">
      <n-button @click="importCsv"> 导入时间戳 </n-button>
      <n-button @click="importCsv"> 导出时间戳 </n-button>
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
      <div class="video">
        <Artplayer
          v-show="files.video"
          ref="videoRef"
          :option="{}"
          @ready="artplayerReady"
        ></Artplayer>
      </div>

      <div v-show="!files.video" class="video">请选选择视频文件</div>
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
import Artplayer from "@renderer/components/Artplayer/Index.vue";

import Xml2AssModal from "./components/Xml2AssModal.vue";
import type { DanmuConfig, DanmuOptions } from "@biliLive-tools/types";

const files = ref<{
  video: string | null;
  danmu: string | null;
  danmuFile: File | null;
}>({
  video: null,
  danmu: null,
  danmuFile: null,
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
const importCsv = async () => {};

const videoInputRef = ref<HTMLInputElement | null>(null);
const danmuInputRef = ref<HTMLInputElement | null>(null);
const videoInstance = ref<Artplayer | null>(null);
const videoRef = ref<Artplayer | null>(null);

const addVideo = () => {
  videoInputRef.value?.click();
};
const handleVideoChange = async (event: any) => {
  const file = event.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);

  const path = window.api.common.getPathForFile(file);
  console.log(url);
  files.value.video = path;

  // console.log(URL.createObjectURL(files.value.danmuFile));

  if (path.endsWith(".flv")) {
    // @ts-ignore
    // await videoRef.value?.setFlvMode(url, URL.createObjectURL(files.value.danmuFile));
  } else {
    // @ts-ignore
    await videoRef.value?.setCommonMode(url);
  }
  if (files.value.danmuFile) {
    const content = await files.value.danmuFile.text();
    console.log(content);
    // @ts-ignore
    videoRef?.value?.addSutitle(content);
  }

  // 添加视频时将切片清空
  cuts.value = [];
};

const artplayerReady = (artplayer: Artplayer) => {
  videoInstance.value = artplayer;
};

const addDanmu = async () => {
  danmuInputRef.value?.click();
};
const xmlConvertVisible = ref(false);
const tempXmlFile = ref("");
const handleDanmuChange = async (event: any) => {
  const file = event.target.files[0];
  if (!file) return;
  const path = window.api.common.getPathForFile(file);
  // 如果是xml文件则弹框提示，要求转换为ass文件
  if (path.endsWith(".ass")) {
    files.value.danmu = path;
    files.value.danmuFile = file;
    console.log(files.value.danmuFile);

    if (videoInstance.value) {
      // videoInstance.value.subtitle.url = path;
      const content = await file.text();
      // @ts-ignore
      videoRef?.value?.addSutitle(content);
    }
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
    position: relative;
  }
  .list {
    display: inline-block;
  }
}
</style>
