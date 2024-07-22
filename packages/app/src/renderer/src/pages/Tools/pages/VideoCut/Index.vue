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
      <n-button type="primary" :disabled="!files.videoPath" @click="addDanmu">
        {{ danmuTitle }}
      </n-button>
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
          @video:durationchange="handleVideoDurationChange"
        ></Artplayer>
        <canvas ref="hotProgressCanvas"></canvas>
      </div>

      <div
        v-show="!files.videoPath"
        class="video empty"
        :style="{
          // width: files.video ? '80%' : '100%',
        }"
      >
        请导入视频或<a href="https://github.com/mifi/lossless-cut" target="_blank">lossless-cut</a
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
import hotkeys from "hotkeys-js";
import { useElementSize, useDebounceFn } from "@vueuse/core";

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
// @ts-ignore
const { width: videoWidth } = useElementSize(videoRef);

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
    videoRef?.value?.switchAss(content);
  }
};

/**
 * 视频时长变化
 */
const handleVideoDurationChange = (duration: number) => {
  videoDuration.value = duration;
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

    videoRef.value?.switchAss(content);
  } else {
    // 如果是xml文件则弹框提示，要求转换为ass文件
    xmlConvertVisible.value = true;
    tempXmlFile.value = path;
    convertDanmuLoading.value = true;
  }
  generateDanmakuData(path);
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
  videoRef.value?.switchAss(content);
};

/**
 * 生成高能进度条数据
 */
const generateDanmakuData = async (file: string) => {
  console.log(file);
  if (!videoDuration.value) return;
  const data = await window.api.danmu.generateDanmakuData(file, {
    duration: videoDuration.value,
    interval: 10,
  });
  tempDrawData = data;
  draw();
  setTimeout(() => {
    draw();
  }, 1000);
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

// 绘制平滑曲线
function drawSmoothCurve(ctx, points) {
  const len = points.length;

  let lastX = points[0].x;
  let lastY = points[0].y;
  for (let i = 1; i < len - 1; i++) {
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);

    ctx.strokeStyle = points[i].color;
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;

    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    lastX = xc;
    lastY = yc;
    ctx.stroke();
  }
}

const hotProgressCanvas = ref<HTMLCanvasElement | null>(null);
// 绘制平滑折线图
function drawSmoothLineChart(data, width: number, height: number) {
  if (!hotProgressCanvas.value) return;

  const canvas = hotProgressCanvas.value;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);

  const length = data.length;
  const maxValue = Math.max(...data.map((item) => item.value));
  // const minValue = Math.min(...data.map((item) => item.value));
  const xRation = width / (length - 1);
  const yRatio = height / maxValue;

  const points: any[] = [];

  // 计算数据点的坐标
  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    const x = i * xRation;
    const y = height - item.value * yRatio;
    points.push({
      x: x,
      y: y,
      color: item.color ?? "#333333",
    });
  }

  drawSmoothCurve(ctx, points);
  return canvas;
}

let tempDrawData: any[] = [];
function draw() {
  if (!videoWidth.value) return;
  if (!tempDrawData.length) return;
  drawSmoothLineChart(tempDrawData, videoWidth.value, 50);
}
const debouncedDraw = useDebounceFn(() => {
  draw();
}, 500);

window.addEventListener("resize", debouncedDraw);

onUnmounted(() => {
  window.removeEventListener("resize", debouncedDraw);
});
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
