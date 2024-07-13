<template>
  <div class="container">
    <div class="btns">
      <!-- 支持导入项目文件 -->
      <n-button title="请选择LosslessCut项目文件" @click="importCsv"> 导入项目文件 </n-button>
      <!-- <n-button @click="importCsv"> 导出时间戳 </n-button>  -->
      <n-button type="primary" @click="addVideo"> {{ videoTitle }} </n-button>
      <input
        ref="videoInputRef"
        type="file"
        accept="video/*,.flv"
        style="display: none"
        @change="handleVideoChange"
      />
      <!-- <ButtonGroup @click="addDanmu">{{ danmuTitle }}</ButtonGroup> -->
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
      <div v-show="files.video" class="video">
        <Artplayer v-show="files.video" ref="videoRef" :option="{}"></Artplayer>
      </div>

      <div v-show="!files.video" class="video empty">
        请选择视频文件以及导入<a href="https://github.com/mifi/lossless-cut" target="_blank"
          >lossless-cut</a
        >项目文件，如果你不会使用，请先查看教程
      </div>
      <div class="cut-list">
        <div
          v-for="(cut, index) in cuts"
          :key="index"
          class="cut"
          :class="{
            checked: cut.checked,
          }"
        >
          <div class="time">
            {{ secondsToTimemark(cut.start) }}-<span>{{
              cut.end ? secondsToTimemark(cut.end) : "结束"
            }}</span>
          </div>
          <div class="name" style="color: skyblue">{{ cut.name }}</div>
          <div v-if="cut.end" class="duration">
            持续时间：{{ secondsToTimemark(cut.end - cut.start) }}
          </div>
          <div class="icon">
            <n-icon v-if="cut.checked" size="20" :depth="3" @click.stop="toggleChecked(index)">
              <CheckmarkCircleOutline></CheckmarkCircleOutline>
            </n-icon>
            <n-icon v-else size="20" :depth="3" @click.stop="toggleChecked(index)">
              <RadioButtonOffSharp></RadioButtonOffSharp>
            </n-icon>
          </div>
          <div class="edit-icon">
            <n-icon size="20" :depth="3" @click.stop="editCut(index)">
              <Pencil></Pencil>
            </n-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
  <Xml2AssModal v-model="xmlConvertVisible" @confirm="danmuConfirm"></Xml2AssModal>
  <n-modal
    v-model:show="cutEditVisible"
    preset="dialog"
    title="编辑名称"
    :show-icon="false"
    :closable="false"
    auto-focus
  >
    <n-input
      v-model:value="tempCutName"
      placeholder="请输入切片名称"
      @keydown.enter="confirmEditCutName"
    ></n-input>
    <template #action>
      <n-button @click="cutEditVisible = false">取消</n-button>
      <n-button type="primary" @click="confirmEditCutName">确定</n-button>
    </template>
  </n-modal>

  <n-modal v-model:show="exportVisible" :show-icon="false" :closable="false" auto-focus>
    <n-card
      style="width: calc(100% - 60px)"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
      class="card"
    >
      <div>
        <p>共有{{ cuts.length }}个切片，此次将导出{{ selectedCuts.length }}个视频</p>
        <div class="flex" style="align-items: center">
          选择视频预设：
          <n-cascader
            v-model:value="exportOptions.ffmpegPresetId"
            placeholder="请选择预设"
            expand-trigger="click"
            :options="ffmpegOptions"
            check-strategy="child"
            :show-path="false"
            :filterable="true"
            style="width: 140px; text-align: left"
          />
        </div>
        <div class="flex" style="align-items: center; margin-top: 20px">
          导出文件夹：
          <n-input
            v-model:value="exportOptions.savePath"
            type="text"
            placeholder="选择文件夹"
            style="width: 300px"
            :title="exportOptions.savePath"
          />
          <n-icon size="30" class="pointer" style="margin-left: 10px" @click="getDir">
            <FolderOpenOutline />
          </n-icon>
        </div>
      </div>
      <template #footer>
        <div class="footer">
          <n-button class="btn" @click="exportVisible = false">取消</n-button>
          <n-button class="btn" type="primary" @click="confirmExport">确定</n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { uuid, secondsToTimemark } from "@renderer/utils";
import Artplayer from "@renderer/components/Artplayer/Index.vue";
// import ButtonGroup from "@renderer/components/ButtonGroup.vue";
import {
  RadioButtonOffSharp,
  CheckmarkCircleOutline,
  Pencil,
  FolderOpenOutline,
} from "@vicons/ionicons5";
import { useFfmpegPreset } from "@renderer/stores";
import { storeToRefs } from "pinia";

import Xml2AssModal from "./components/Xml2AssModal.vue";
import type { DanmuConfig, DanmuOptions } from "@biliLive-tools/types";

const notice = useNotification();
const { ffmpegOptions } = storeToRefs(useFfmpegPreset());

const files = ref<{
  video: string | null;
  danmu: string | null;
  danmuPath: string | null;
}>({
  video: null,
  danmu: null,
  danmuPath: null,
});
const videoTitle = computed(() => {
  return files.value.video ? "替换视频" : "添加视频";
});
const danmuTitle = computed(() => {
  return files.value.danmu ? "替换弹幕" : "添加弹幕";
});

const cuts = ref<
  {
    start: number;
    end?: number;
    name: string;
    checked: boolean;
  }[]
>([]);
const selectedCuts = computed(() => {
  return cuts.value.filter((item) => item.checked);
});

const importCsv = async () => {
  const files = await window.api.openFile({
    multi: false,
    filters: [
      {
        name: "file",
        extensions: ["llc"],
      },
    ],
  });
  if (!files) return;
  const data = eval("(" + (await window.api.common.readFile(files[0])) + ")");
  console.log(data);
  cuts.value = data.cutSegments.map((item: any) => {
    return {
      ...item,
      checked: true,
    };
  });
};

const toggleChecked = (index: number) => {
  cuts.value[index].checked = !cuts.value[index].checked;
};
// 编辑切片名称
const cutEditVisible = ref(false);
const tempCutName = ref("");
const tempCutIndex = ref(-1);
const editCut = (index: number) => {
  console.log(cuts.value[index]);
  cutEditVisible.value = true;
  tempCutName.value = cuts.value[index].name;
  tempCutIndex.value = index;
};
const confirmEditCutName = () => {
  cuts.value[tempCutIndex.value].name = tempCutName.value;
  cutEditVisible.value = false;
};

const videoInputRef = ref<HTMLInputElement | null>(null);
const danmuInputRef = ref<HTMLInputElement | null>(null);
const videoRef = ref<InstanceType<typeof Artplayer> | null>(null);

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

  await videoRef.value?.switchUrl(url, path.endsWith(".flv") ? "flv" : "");

  if (files.value.danmu) {
    const content = files.value.danmu;
    videoRef?.value?.addSutitle(content);
  }

  // 添加视频时将切片清空
  // cuts.value = [];
};

// 弹幕相关
const addDanmu = async () => {
  danmuInputRef.value?.click();
};
const xmlConvertVisible = ref(false);
const tempXmlFile = ref("");
const convertDanmuLoading = ref(false);
const handleDanmuChange = async (event: any) => {
  const file = event.target.files[0];
  if (!file) return;
  const path = window.api.common.getPathForFile(file);
  // 如果是xml文件则弹框提示，要求转换为ass文件
  if (path.endsWith(".ass")) {
    const content = await file.text();
    files.value.danmu = content;
    files.value.danmuPath = path;

    videoRef.value?.addSutitle(content);
  } else {
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

const exportVisible = ref(true);
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
  exportVisible.value = true;
};
const exportOptions = reactive({
  ffmpegPresetId: "",
  savePath: "",
});
const confirmExport = async () => {
  if (convertDanmuLoading.value) {
    notice.error({
      title: "弹幕转换中，请稍后",
      duration: 1000,
    });
    return;
  }
  const savePath = await window.api.openDirectory({
    defaultPath: window.path.dirname(files.value.video!),
  });
  if (!savePath) return;

  for (const cut of selectedCuts.value) {
    window.api.mergeAssMp4(
      {
        videoFilePath: files.value.video!,
        assFilePath: files.value.danmuPath!,
        outputPath: `${savePath}\\${cut.start}-${cut.name}.mp4`,
        hotProgressFilePath: undefined,
      },
      { removeOrigin: false },
      {
        encoder: "libx264",
        audioCodec: "copy",
        ss: cut.start,
        to: cut.end,
      },
    );
  }
  notice.info({
    title: "已加入任务队列",
    duration: 1000,
  });
  exportVisible.value = false;
};

async function getDir() {
  const path = await window.api.openDirectory({
    defaultPath: exportOptions.savePath,
  });
  if (!path) return;
  exportOptions.savePath = path;
  // options.saveRadio = 2;
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
    .cut {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 4px 6px;
      margin-bottom: 6px;
      position: relative;
      opacity: 0.5;
      &.checked {
        opacity: 1;
      }
      &:hover {
        .icon {
          display: block;
        }
        .edit-icon {
          display: block;
        }
      }
      .time {
      }
      .name {
      }
      .duration {
      }
      .icon {
        display: none;
        cursor: pointer;
        position: absolute;
        right: 4px;
        bottom: 0px;
      }
      .edit-icon {
        display: none;
        cursor: pointer;
        position: absolute;
        right: 24px;
        bottom: 0px;
      }
    }
  }
}

.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 10px;
  }
}
</style>
