<template>
  <n-modal v-model:show="visible" :show-icon="false" :closable="false" auto-focus>
    <n-card
      style="width: 760px"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
      class="card"
    >
      <n-form label-placement="left" label-width="96" style="margin-top: 4px">
        <n-form-item label="视频预设">
          <div class="form-row">
            <n-cascader
              v-model:value="exportOptions.ffmpegPresetId"
              placeholder="请选择预设"
              expand-trigger="click"
              :options="ffmpegOptions"
              check-strategy="child"
              :show-path="false"
              :filterable="true"
              style="width: 220px; text-align: left"
            />
            <Tip> 推荐采用质量模式，以自适应视频质量 </Tip>
          </div>
        </n-form-item>

        <n-form-item label="上传预设">
          <div class="form-row">
            <n-select
              v-model:value="exportOptions.uploadPresetId"
              :options="uploaPresetsOptions"
              placeholder="请选择上传预设"
              filterable
              style="width: 300px"
              clearable
            />
            <n-button
              v-if="exportOptions.uploadPresetId"
              text
              @click="showUploadPresetDialog = true"
            >
              <template #icon>
                <n-icon>
                  <SettingsOutline />
                </n-icon>
              </template>
            </n-button>
          </div>
        </n-form-item>

        <n-form-item label="其他">
          <div class="form-column">
            <n-checkbox v-model:checked="exportOptions.ignoreDanmu"> 忽略弹幕渲染 </n-checkbox>
            <div class="form-row">
              <n-checkbox v-model:checked="exportOptions.ignoreSubtitle"> 忽略字幕渲染 </n-checkbox>
              <n-button size="small" @click="showSubtitleStyleModal = true">
                配置字幕样式
              </n-button>
            </div>
            <n-checkbox v-model:checked="exportOptions.exportSubtitle">
              单独导出srt字幕
            </n-checkbox>
          </div>
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="footer">
          <n-button class="btn" @click="visible = false">取消</n-button>
          <n-button
            class="btn"
            type="primary"
            :loading="submitting"
            @click="confirmExportAndUpload"
          >
            确定
          </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>

  <SubtitleStyleModal
    v-model="showSubtitleStyleModal"
    :initial-config="currentSubtitleStyle"
    @confirm="handleSubtitleStyleConfirm"
  />
  <BiliPresetEditDialog
    v-model:show="showUploadPresetDialog"
    :preset-id="exportOptions.uploadPresetId"
  />
</template>

<script setup lang="ts">
import { toReactive } from "@vueuse/core";
import { SettingsOutline } from "@vicons/ionicons5";
import type { SubtitleOptions } from "@biliLive-tools/types";
import BiliPresetEditDialog from "@renderer/components/BiliPresetEditDialog.vue";
import SubtitleStyleModal from "./SubtitleStyleModal.vue";

import {
  biliApi,
  ffmpegPresetApi,
  subtitleStylePresetApi,
  taskApi,
  videoPresetApi,
} from "@renderer/apis";
import { useAppConfig, useFfmpegPreset, useUploadPreset, useUserInfoStore } from "@renderer/stores";
import filenamify from "filenamify/browser";
import { deepRaw, secondsToTimemark } from "@renderer/utils";
import { showSaveDialog } from "@renderer/utils/fileSystem";
import type { Segment } from "@renderer/stores";
import type { BiliupConfig } from "@biliLive-tools/types";

interface Props {
  files: {
    danmuPath: string | null;
    originVideoPath: string | null;
  };
  segment: Segment | null;
}

const props = withDefaults(defineProps<Props>(), {
  files: () => ({
    danmuPath: null,
    originVideoPath: null,
  }),
  segment: null,
});

const visible = defineModel<boolean>({ required: true, default: false });

const showSubtitleStyleModal = ref(false);
const showUploadPresetDialog = ref(false);
const currentSubtitleStyle = ref<SubtitleOptions>();
const submitting = ref(false);

const notice = useNotification();
const { ffmpegOptions } = storeToRefs(useFfmpegPreset());
const { uploaPresetsOptions } = storeToRefs(useUploadPreset());
const { appConfig } = storeToRefs(useAppConfig());
const { userInfo } = storeToRefs(useUserInfoStore());
const currentSegment = computed(() => props.segment);

const exportOptions = toReactive(
  computed({
    get: () => appConfig.value.tool.videoCut,
    set: (value) => {
      appConfig.value.tool.videoCut = value;
    },
  }),
);

const buildDefaultOutputPath = () => {
  const originVideoPath = props.files.originVideoPath!;
  const start = currentSegment.value!.start;
  const end = currentSegment.value!.end!;
  const label = currentSegment.value!.name || "segment";
  const defaultName = filenamify(
    `${window.path.parse(originVideoPath).name}-${label}-${secondsToTimemark(start).replaceAll(":", ".")}-${secondsToTimemark(end).replaceAll(":", ".")}`,
    { replacement: "" },
  );

  return window.path.join(window.path.dirname(originVideoPath), `${defaultName}.mp4`);
};

const confirmExportAndUpload = async () => {
  if (!exportOptions.ffmpegPresetId) {
    notice.error({
      title: "请选择预设",
      duration: 1000,
    });
    return;
  }
  // if (!exportOptions.uploadPresetId) {
  //   notice.error({
  //     title: "请选择上传预设",
  //     duration: 1000,
  //   });
  //   return;
  // }
  if (exportOptions.uploadPresetId && !userInfo.value.uid) {
    notice.error({
      title: "请点击左侧头像处先进行登录",
      duration: 1000,
    });
    return;
  }
  if (!currentSegment.value) {
    notice.error({
      title: "没有可导出的视频切片",
      duration: 1000,
    });
    return;
  }
  if (currentSegment.value.end === undefined) {
    notice.error({
      title: "当前切片缺少结束时间",
      duration: 1000,
    });
    return;
  }

  submitting.value = true;
  try {
    const ffmpegPreset = await ffmpegPresetApi.get(exportOptions.ffmpegPresetId);
    const ffmpegPresetConfig = ffmpegPreset.config;
    let uploadConfig: BiliupConfig | null = null;
    if (exportOptions.uploadPresetId) {
      const uploadPreset = await videoPresetApi.get(exportOptions.uploadPresetId);
      uploadConfig = deepRaw(uploadPreset.config);
      await biliApi.validUploadParams(uploadConfig);
    }

    const srtContent = "";
    const outputPath = await showSaveDialog({
      defaultPath: buildDefaultOutputPath(),
      extension: "mp4",
    });

    if (!outputPath) {
      return;
    }

    if (ffmpegPresetConfig.encoder === "copy") {
      if (props.files.danmuPath && !exportOptions.ignoreDanmu) {
        notice.error({
          title: "存在弹幕时编码器不能为copy",
          duration: 1000,
        });
        return;
      }
      if (srtContent && !exportOptions.ignoreSubtitle) {
        notice.error({
          title: "存在字幕时编码器不能为copy",
          duration: 1000,
        });
        return;
      }
    }

    const segments: { start: number; end: number; name: string }[] = [];
    const start = currentSegment.value.start;
    const end = currentSegment.value.end;
    const title = window.path.parse(outputPath).name;

    await taskApi.cut(
      {
        videoFilePath: props.files.originVideoPath!,
        assFilePath: exportOptions.ignoreDanmu ? "" : props.files.danmuPath || "",
        srtContent: exportOptions.ignoreSubtitle ? "" : srtContent,
      },
      outputPath,
      {
        ...ffmpegPresetConfig,
        ss: start,
        to: end,
        subtitleOptions: exportOptions.ignoreSubtitle ? undefined : currentSubtitleStyle.value,
      },
      {
        override: true,
        uploadOptions: {
          upload: !!exportOptions.uploadPresetId,
          config: uploadConfig,
          filePath: outputPath,
          uid: userInfo.value.uid,
        },
      },
    );

    segments.push({ start, end, name: title });

    if (exportOptions.exportSubtitle) {
      const subtitleDir = window.path.dirname(outputPath);
      await taskApi.cutSubtitle({
        srtContent: srtContent,
        segments,
        videoPath: props.files.originVideoPath!,
        saveType: 2,
        savePath: subtitleDir,
      });
    }

    notice.info({
      title: "已加入任务队列",
      duration: 1000,
    });
    visible.value = false;
  } finally {
    submitting.value = false;
  }
};

const initSubtitleStyle = async () => {
  const styleId = exportOptions.subtitleStyleId || "default";
  const data = await subtitleStylePresetApi.get(styleId);
  currentSubtitleStyle.value = data.config;
};

const handleSubtitleStyleConfirm = async (config: SubtitleOptions) => {
  currentSubtitleStyle.value = config;
};

watch(visible, (newVal) => {
  if (newVal) {
    initSubtitleStyle();
  }
});
</script>

<style scoped lang="less">
.form-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 10px;
  }
}
</style>
