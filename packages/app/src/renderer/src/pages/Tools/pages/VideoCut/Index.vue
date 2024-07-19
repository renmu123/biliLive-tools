<template>
  <div id="cut-tool" class="container">
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
      <div v-show="files.videoPath" class="video">
        <Artplayer
          v-show="files.videoPath"
          ref="videoRef"
          :option="{}"
          @ready="handleVideoReady"
        ></Artplayer>
      </div>

      <div
        v-show="!files.videoPath"
        class="video empty"
        :style="{
          // width: files.video ? '80%' : '100%',
        }"
      >
        请导入<a href="https://github.com/mifi/lossless-cut" target="_blank">lossless-cut</a
        >项目文件，如果你不会使用，请先查看教程
      </div>
      <div class="cut-list">
        <SegmentList></SegmentList>
      </div>
    </div>
  </div>
  <Xml2AssModal v-model="xmlConvertVisible" @confirm="danmuConfirm"></Xml2AssModal>
  <ExportModal v-model="exportVisible" :files="files"></ExportModal>
</template>

<script setup lang="ts">
import { uuid } from "@renderer/utils";
import Artplayer from "@renderer/components/Artplayer/Index.vue";
import ButtonGroup from "@renderer/components/ButtonGroup.vue";
import { useSegmentStore } from "@renderer/stores";
import Xml2AssModal from "./components/Xml2AssModal.vue";
import ExportModal from "./components/ExportModal.vue";
import SegmentList from "./components/SegmentList.vue";
import { useLlcProject } from "./hooks";
import { storeToRefs } from "pinia";
import hotkeys from "hotkeys-js";

import type ArtplayerType from "artplayer";
import type { DanmuConfig, DanmuOptions } from "@biliLive-tools/types";

onActivated(() => {
  // 撤销
  hotkeys("ctrl+z", function () {
    undo();
  });
  // 重做
  hotkeys("ctrl+shift+z", function () {
    redo();
  });
  // 保存
  hotkeys("ctrl+s", function () {
    saveProject();
  });
  // 另存为
  hotkeys("ctrl+shift+s", function () {
    saveAsAnother();
  });
  // 导出
  hotkeys("ctrl+enter", function () {
    exportCuts();
  });
  // 播放/暂停
  hotkeys("space", function (event) {
    console.log(event);
    // @ts-ignore
    if (event?.target?.tagName === "BUTTON") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    videoToggle();
  });
  // 慢速快进
  hotkeys("ctrl+left", function () {
    if (!videoInstance.value) return;
    videoInstance.value.backward = 1;
  });
  // 慢速后退
  hotkeys("ctrl+right", function () {
    if (!videoInstance.value) return;

    videoInstance.value.forward = 1;
  });
});

onDeactivated(() => {
  hotkeys.unbind();
});
onUnmounted(() => {
  hotkeys.unbind();
});

const notice = useNotification();

const files = ref<{
  videoPath: string | null;
  danmuPath: string | null;
}>({
  videoPath: null,
  danmuPath: null,
});
const videoTitle = computed(() => {
  return files.value.videoPath ? "替换视频" : "添加视频";
});
const danmuTitle = computed(() => {
  return files.value.danmuPath ? "替换弹幕" : "添加弹幕";
});

const {
  selectedCuts,
  handleProjectClick,
  mediaPath,
  options: exportBtns,
  saveProject,
  saveAsAnother,
} = useLlcProject(files);
const { duration: videoDuration } = storeToRefs(useSegmentStore());
const { undo, redo } = useSegmentStore();

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

const videoInstance = ref<ArtplayerType | null>(null);
provide("videoInstance", videoInstance);
const handleVideoReady = (instance: ArtplayerType) => {
  videoInstance.value = instance;
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
  files.value.videoPath = path;
  await videoRef.value?.switchUrl(path, path.endsWith(".flv") ? "flv" : "");

  if (files.value.danmuPath) {
    const content = await window.api.common.readFile(files.value.danmuPath);
    videoRef?.value?.addSutitle(content);
  }
  setTimeout(() => {
    videoDuration.value = Number(videoInstance.value!.video?.duration);
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
  if (!files.value.videoPath) {
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
 * 视频状态切换
 */
const videoToggle = () => {
  if (!videoInstance.value) return;
  if (!videoInstance.value.url) return;
  videoInstance.value.toggle();
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
