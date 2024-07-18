<template>
  <div class="container">
    <div class="btns">
      <ButtonGroup
        title="请选择LosslessCut项目文件"
        :options="exportBtns"
        @click="handleProjectClick"
        >导入项目文件</ButtonGroup
      >
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

      <n-button type="info" @click="exportCuts"> 导出切片 </n-button>
    </div>

    <div class="content">
      <div v-show="files.video" class="video">
        <Artplayer
          v-show="files.video"
          ref="videoRef"
          :option="{}"
          @ready="handleVideoReady"
        ></Artplayer>
      </div>

      <div
        v-show="!files.video"
        class="video empty"
        :style="{
          width: files.video ? '80%' : '100%',
        }"
      >
        请导入<a href="https://github.com/mifi/lossless-cut" target="_blank">lossless-cut</a
        >项目文件，如果你不会使用，请先查看教程
      </div>
      <div v-show="files.video" class="cut-list">
        <SegmentList @seek="navVideo"></SegmentList>
      </div>
    </div>
  </div>
  <Xml2AssModal v-model="xmlConvertVisible" @confirm="danmuConfirm"></Xml2AssModal>
  <ExportModal v-model="exportVisible" :video-duration="videoDuration" :files="files"></ExportModal>
</template>

<script setup lang="ts">
import { uuid } from "@renderer/utils";
import Artplayer from "@renderer/components/Artplayer/Index.vue";
import ButtonGroup from "@renderer/components/ButtonGroup.vue";
import Xml2AssModal from "./components/Xml2AssModal.vue";
import ExportModal from "./components/ExportModal.vue";
import SegmentList from "./components/SegmentList.vue";
import { useLlcProject } from "./hooks";

import type ArtplayerType from "artplayer";
import type { DanmuConfig, DanmuOptions } from "@biliLive-tools/types";

const notice = useNotification();

const files = ref<{
  video: string | null;
  danmu: string | null;
  danmuPath: string | null;
}>({
  video: null,
  danmu: null,
  danmuPath: null,
});
const videoDuration = ref(0);
const videoTitle = computed(() => {
  return files.value.video ? "替换视频" : "添加视频";
});
const danmuTitle = computed(() => {
  return files.value.danmu ? "替换弹幕" : "添加弹幕";
});

const { selectedCuts, handleProjectClick, mediaPath, options: exportBtns } = useLlcProject();

watchEffect(async () => {
  if (mediaPath.value) {
    const { dir, name } = window.path.parse(mediaPath.value);
    const videoPath = mediaPath.value;
    if (await window.api.exits(videoPath)) {
      handleVideo(videoPath);
    }
    const assFilepath = window.path.join(dir, `${name}.ass`);
    if (await window.api.exits(assFilepath)) {
      handleDanmu(assFilepath);
    } else {
      const xmlFilepath = window.path.join(dir, `${name}.xml`);
      if (await window.api.exits(xmlFilepath)) {
        handleDanmu(xmlFilepath);
      }
    }
  }
});

const videoInputRef = ref<HTMLInputElement | null>(null);
const danmuInputRef = ref<HTMLInputElement | null>(null);
const videoRef = ref<InstanceType<typeof Artplayer> | null>(null);

let videoInstance: ArtplayerType;
const handleVideoReady = (instance: ArtplayerType) => {
  videoInstance = instance;
};

const addVideo = () => {
  videoInputRef.value?.click();
};
const handleVideoChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files) return;
  const file = input.files[0];
  if (!file) return;

  const path = window.api.common.getPathForFile(file);
  handleVideo(path);
};

const handleVideo = async (path: string) => {
  files.value.video = path;
  await videoRef.value?.switchUrl(path, path.endsWith(".flv") ? "flv" : "");

  if (files.value.danmu) {
    const content = files.value.danmu;
    videoRef?.value?.addSutitle(content);
  }
  setTimeout(() => {
    videoDuration.value = Number(videoInstance.video?.duration);
    console.log(videoDuration.value);
  }, 1000);
};

// 弹幕相关
const addDanmu = async () => {
  danmuInputRef.value?.click();
};
const xmlConvertVisible = ref(false);
const tempXmlFile = ref("");
const convertDanmuLoading = ref(false);
const handleDanmuChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files) return;
  const file = input.files[0];
  if (!file) return;
  const path = window.api.common.getPathForFile(file);
  await handleDanmu(path);
};
const handleDanmu = async (path: string) => {
  if (path.endsWith(".ass")) {
    const content = await window.api.common.readFile(path);
    files.value.danmu = content;
    files.value.danmuPath = path;

    videoRef.value?.addSutitle(content);
  } else {
    // 如果是xml文件则弹框提示，要求转换为ass文件
    xmlConvertVisible.value = true;
    tempXmlFile.value = path;
    convertDanmuLoading.value = true;
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
  // files.value.danmu = path;
  const content = await window.api.common.readFile(path);
  convertDanmuLoading.value = false;
  files.value.danmu = content;
  files.value.danmuPath = path;
  videoRef.value?.addSutitle(content);
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
  notice.info({
    title: "弹幕开始转换为ass",
    duration: 1000,
  });
  return new Promise((resolve, reject) => {
    window.api.danmu
      .convertXml2Ass(file, toRaw(config), { ...options, copyInput: true })
      .then((result: any) => {
        const taskId = result.taskId;
        window.api.task.on(taskId, "end", (data) => {
          notice.success({
            title: "转换成功",
            duration: 1000,
          });
          resolve(data.output);
        });

        window.api.task.on(taskId, "error", (data) => {
          notice.error({
            title: "转换失败",
            duration: 1000,
          });
          reject(data.err);
        });
      });
  });
};

const exportVisible = ref(false);
const exportCuts = async () => {
  if (selectedCuts.value.length === 0) {
    notice.error({
      title: "没有需要导出的切片",
      duration: 1000,
    });
    return;
  }
  if (!files.value.video) {
    notice.error({
      title: "请先选择视频文件",
      duration: 1000,
    });
    return;
  }

  if (!files.value.danmuPath) {
    notice.error({
      title: "请先选择弹幕文件",
      duration: 1000,
    });
    return;
  }

  if (convertDanmuLoading.value) {
    notice.error({
      title: "弹幕转换中，请稍后",
      duration: 1000,
    });
    return;
  }
  exportVisible.value = true;
};

/**
 * 导航到视频指定位置
 */
const navVideo = (start: number) => {
  videoInstance.seek = start;
};
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
  align-items: flex-start;
  .video {
    width: 80%;
    aspect-ratio: 16 / 9;
    position: relative;

    &.empty {
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 22px;
    }
  }
  .cut-list {
    display: inline-block;
    flex: 1;
  }
}
</style>
