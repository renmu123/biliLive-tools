<template>
  <div id="cut-tool" class="container">
    <div class="btns page-header">
      <ButtonGroup
        title="请选择LosslessCut项目文件"
        :options="exportBtns"
        @click="handleProjectClick"
        >导入项目文件</ButtonGroup
      >
      <n-button type="primary" @click="handleVideoChange"> {{ videoTitle }} </n-button>
      <n-button
        class="cut-add-danmu"
        type="primary"
        :disabled="!files.videoPath"
        @click="handleDanmuChange"
      >
        {{ danmuTitle }}
      </n-button>

      <n-button class="cut-export" type="info" :disabled="!files.videoPath" @click="exportCuts">
        导出切片
      </n-button>
    </div>

    <input type="range" v-model="clipX" min="0" max="100" value="1" />

    <div class="content">
      <div v-show="files.videoPath" class="video cut-video">
        <Artplayer
          v-show="files.videoPath"
          ref="videoRef"
          :option="{}"
          @ready="handleVideoReady"
          @video:durationchange="handleVideoDurationChange"
        ></Artplayer>
        <canvas ref="hotProgressCanvas"></canvas>
      </div>

      <FileArea
        v-show="!files.videoPath"
        v-model="fileList"
        :style="{ height: '100%' }"
        class="video empty cut-file-area"
        :extensions="['llc', 'flv', 'mp4', 'm4s']"
        :max="1"
        @change="handleFileChange"
      >
        <template #desc>
          请导入视频或<a href="https://github.com/mifi/lossless-cut" target="_blank">lossless-cut</a
          >项目文件，如果你不会使用，请先<span title="鸽了">查看教程</span>
        </template>
      </FileArea>
      <div class="cut-list">
        <SegmentList :danma-list="danmaList" :files="files"></SegmentList>
      </div>
    </div>
  </div>
  <DanmuFactorySettingDailog
    v-model:visible="xmlConvertVisible"
    v-model="videoVCutOptions.danmuPresetId"
    :show-preset="true"
    @confirm="danmuConfirm"
  ></DanmuFactorySettingDailog>
  <ExportModal v-model="exportVisible" :files="files"></ExportModal>
</template>

<script setup lang="ts">
import { uuid, supportedVideoExtensions } from "@renderer/utils";
import Artplayer from "@renderer/components/Artplayer/Index.vue";
import ButtonGroup from "@renderer/components/ButtonGroup.vue";
import DanmuFactorySettingDailog from "@renderer/components/DanmuFactorySettingDailog.vue";
import { useSegmentStore, useAppConfig } from "@renderer/stores";
import ExportModal from "./components/ExportModal.vue";
import SegmentList from "./components/SegmentList.vue";

import { useLlcProject } from "./hooks";
import { useDrive } from "@renderer/hooks/drive";
import hotkeys from "hotkeys-js";
import { useElementSize, useDebounceFn, toReactive } from "@vueuse/core";
import { sortBy } from "lodash-es";

import type ArtplayerType from "artplayer";
import type { DanmuConfig, DanmuOptions, DanmuItem } from "@biliLive-tools/types";

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
  originDanmuPath: string | null;
}>({
  videoPath: null,
  danmuPath: null,
  originDanmuPath: null,
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
  handleProject,
} = useLlcProject(files);
const { duration: videoDuration } = storeToRefs(useSegmentStore());
const { appConfig } = storeToRefs(useAppConfig());

const { undo, redo } = useSegmentStore();

const videoVCutOptions = toReactive(
  computed({
    get: () => appConfig.value.tool.videoCut,
    set: (value) => {
      appConfig.value.tool.videoCut = value;
    },
  }),
);

watchEffect(async () => {
  if (mediaPath.value) {
    const { dir, name } = window.path.parse(mediaPath.value);
    const videoPath = mediaPath.value;
    if (await window.api.exits(videoPath)) {
      await handleVideo(videoPath);
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

const videoRef = ref<InstanceType<typeof Artplayer> | null>(null);
// @ts-ignore
const { width: videoWidth } = useElementSize(videoRef);

const videoInstance = ref<ArtplayerType | null>(null);
provide("videoInstance", videoInstance);
const handleVideoReady = (instance: ArtplayerType) => {
  videoInstance.value = instance;
};

const handleVideoChange = async () => {
  const files = await window.api.openFile({
    multi: false,
    filters: [
      {
        name: "media",
        extensions: supportedVideoExtensions,
      },
    ],
  });
  if (!files) return;

  const path = files[0];
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
const xmlConvertVisible = ref(false);
const tempXmlFile = ref("");
const convertDanmuLoading = ref(false);
const handleDanmuChange = async () => {
  const files = await window.api.openFile({
    multi: false,
    filters: [
      {
        name: "file",
        extensions: ["ass", "xml"],
      },
      {
        name: "ass",
        extensions: ["ass"],
      },
      {
        name: "xml",
        extensions: ["xml"],
      },
    ],
  });
  if (!files) return;

  const path = files[0];
  await handleDanmu(path);
};

/**
 * 处理弹幕
 */
const handleDanmu = async (path: string) => {
  files.value.originDanmuPath = path;

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
  if (config.resolutionResponsive) {
    const width = videoInstance.value?.video.videoWidth;
    const height = videoInstance.value?.video.videoHeight;
    config.resolution[0] = width!;
    config.resolution[1] = height!;
  }

  const path = await convertDanmu2Ass(
    {
      input: tempXmlFile.value,
      output: uuid(),
    },
    { saveRadio: 2, savePath: await window.api.common.getTempPath(), removeOrigin: false },
    config,
  );
  // files.value.danmu = path;
  const content = await window.api.common.readFile(path);
  convertDanmuLoading.value = false;
  files.value.danmuPath = path;
  videoRef.value?.switchAss(content);
};

const danmaList = ref<DanmuItem[]>([]);
/**
 * 生成高能进度条数据和sc等数据
 */
const generateDanmakuData = async (file: string) => {
  console.log(file);
  if (!videoDuration.value) return;

  if (file.endsWith(".ass")) {
    danmaList.value = [];
  } else if (file.endsWith(".xml")) {
    const data = await window.api.danmu.parseDanmu(file);
    danmaList.value = sortBy([...data.sc, ...data.danmu], "ts");
  } else {
    throw new Error("不支持的文件类型");
  }

  const data = await window.api.danmu.genTimeData(file);
  tempDrawData = data;
  console.log(tempDrawData);

  // @ts-ignore
  videoInstance.value && videoInstance.value.artplayerPluginHeatmap.setData(data);

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

const hotProgressCanvas = ref<HTMLCanvasElement | null>(null);

let tempDrawData: number[] = [];
function draw() {
  if (!videoWidth.value) return;
  if (!tempDrawData.length) return;
  generateHotProgress(tempDrawData, {
    width: videoWidth.value,
    height: 50,
    sampling: 1,
    duration: videoDuration.value,
  });
}
const debouncedDraw = useDebounceFn(() => {
  draw();
}, 500);

window.addEventListener("resize", debouncedDraw);

onUnmounted(() => {
  window.removeEventListener("resize", debouncedDraw);
});

const fileList = ref<any[]>([]);
const handleFileChange = (fileList: any[]) => {
  console.log(files);
  if (!fileList.length) return;
  const file = fileList[0];
  const { path, ext } = file;

  if (ext === ".llc") {
    handleProject(path);
  } else if ([".mp4", ".flv", ".m4s"].includes(ext)) {
    handleVideo(path);
  }
};

const { videoCutDrive } = useDrive();
onMounted(() => {
  videoCutDrive();
});

const danmaPoints = ref<{ x: number; y: number }[]>([]);
/**
 * 生成高能弹幕进度条所需参数
 */
const generateHotProgress = async (
  data: number[],
  options: { width: number; height: number; sampling: number; duration: number },
) => {
  let fData = data.filter((time) => time < options.duration).sort((a, b) => a - b);
  const countData = countByIntervalInSeconds(fData, options.sampling);
  danmaPoints.value = normalizePoints(
    countData.map((item) => ({ x: item.start, y: item.count })),
    options.width,
    options.height,
  );

  const canvas = hotProgressCanvas.value;
  if (!canvas) return;
  canvas.width = options.width;
  canvas.height = options.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(1, -1);
  ctx.translate(0, -options.height);
  drawSmoothCurve(canvas, ctx);
};

/**
 * 根据时间间隔统计有序时间数组的计数（起始时间默认为 0）
 * @param times 时间数组（以秒为单位）
 * @param interval 时间间隔（秒）
 * @returns 一个数组，每个元素表示该时间间隔内的计数
 */
function countByIntervalInSeconds(
  times: number[],
  interval: number,
): { start: number; count: number }[] {
  if (times.length === 0) return [];

  const result: { start: number; count: number }[] = [];
  let currentIntervalStart = 0; // 当前分组的起始时间固定为 0
  let count = 0;

  for (const time of times) {
    while (time >= currentIntervalStart + interval) {
      // 时间超出当前分组范围，保存当前分组并移动到下一个分组
      result.push({ start: currentIntervalStart, count });
      currentIntervalStart += interval;
      count = 0; // 重置计数
    }
    count++; // 当前时间点计入当前分组
  }

  // 记录最后一个分组
  result.push({ start: currentIntervalStart, count });

  return result;
}

// 归一化函数
function normalizePoints(points: { x: number; y: number }[], width: number, height: number) {
  const xMin = Math.min(...points.map((p) => p.x));
  const xMax = Math.max(...points.map((p) => p.x));
  const yMin = Math.min(...points.map((p) => p.y));
  const yMax = Math.max(...points.map((p) => p.y));

  return points.map((p) => ({
    x: ((p.x - xMin) / (xMax - xMin)) * width,
    y: ((p.y - yMin) / (yMax - yMin)) * height,
  }));
}

const clipX = ref(0);

watch(clipX, () => {
  const canvas = hotProgressCanvas.value;
  if (!canvas) return;
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;

  drawSmoothCurve(canvas, ctx);
});

/**
 * 绘制平滑曲线
 * @param points 点集
 * @param ctx 画布上下文
 */
function drawSmoothCurve(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 绘制红色部分
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, clipX.value, canvas.height); // 红色区域的剪辑
  ctx.clip();
  drawEntireLine(ctx, "red", danmaPoints.value);
  ctx.restore();

  // 绘制蓝色部分
  ctx.save();
  ctx.beginPath();
  ctx.rect(clipX.value, 0, canvas.width - clipX.value, canvas.height); // 蓝色区域的剪辑
  ctx.clip();
  drawEntireLine(ctx, "blue", danmaPoints.value);
  ctx.restore();
}

function drawEntireLine(
  ctx: CanvasRenderingContext2D,
  color: string,
  points: { x: number; y: number }[],
) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y); // 起点

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    const xc = (p1.x + p2.x) / 2;
    const yc = (p1.y + p2.y) / 2;

    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
}
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
