<template>
  <n-form ref="formRef" label-width="120px" label-placement="left" label-align="right">
    <n-form-item>
      <template #label>
        <n-popover trigger="hover">
          <template #trigger>
            <span
              class="flex align-center"
              :style="{
                'justify-content': 'flex-end',
              }"
            >
              预设 <n-icon size="18" class="pointer"> <HelpCircleOutline /> </n-icon
            ></span>
          </template>
          <p style="color: red">请勿选择不支持的硬件加速方案</p>
          <p>lib 使用 CPU 进行编码，无硬件加速，速度较慢，但效果可能是最好的</p>
          <p>QSV 是 Intel 的核显加速</p>
          <p>NVEnc 是 NVIDIA 的显卡加速</p>
          <p>AMF 是 AMD 的硬件加速</p>
          <p>H264泛用性较高，压缩率较低；H265 压缩率高于H264但可能低于AV1</p>
          <p>AV1 新一代的编码宠儿，需要新一代硬件才可硬件加速，如40系显卡</p>
        </n-popover>
      </template>
      <n-select
        v-model:value="presetName"
        :options="ffmpegPresets"
        @update:value="handlePresetChange"
      />
    </n-form-item>
    <n-divider />

    <n-form-item label="视频编码器">
      <n-select v-model:value="ffmpegOptions.encoder" :options="videoEncoders" disabled />
    </n-form-item>

    <n-form-item v-if="birateControlOptions.length !== 0" label="码率控制">
      <n-select v-model:value="ffmpegOptions.bitrateControl" :options="birateControlOptions" />
    </n-form-item>
    <n-form-item v-if="ffmpegOptions.bitrateControl === 'CRF'">
      <template #label>
        <n-popover trigger="hover">
          <template #trigger>
            <span
              class="flex align-center"
              :style="{
                'justify-content': 'flex-end',
              }"
            >
              crf <n-icon size="18" class="pointer"> <HelpCircleOutline /> </n-icon
            ></span>
          </template>
          <p>CRF值为0：无损压缩，最高质量，最大文件大小。</p>
          <p>
            CRF值较低（例如，18-24）：高质量，较大文件大小。适用于需要高质量输出的情况，18为视觉无损。
          </p>
          <p>CRF值较高（例如，28-51）：较低质量，较小文件大小。适用于需要较小文件的情况。</p>
          <p>CRF值越小，压制越慢</p>
        </n-popover>
      </template>
      <n-input-number
        v-model:value.number="ffmpegOptions.crf"
        class="input-number"
        :min="0"
        :max="51"
      />
    </n-form-item>
    <n-form-item v-if="ffmpegOptions.bitrateControl === 'VBR'">
      <template #label>
        <n-popover trigger="hover">
          <template #trigger>
            <span
              class="flex align-center"
              :style="{
                'justify-content': 'flex-end',
              }"
            >
              码率 <n-icon size="18" class="pointer"> <HelpCircleOutline /> </n-icon
            ></span>
          </template>
          <p>一般录播视频，码率 5000k 够了。如果是游戏，可以适当拉到 7000k</p>
        </n-popover>
      </template>
      <n-input-number v-model:value.number="ffmpegOptions.bitrate" class="input-number" :step="500">
        <template #suffix> K </template></n-input-number
      >
    </n-form-item>

    <n-form-item v-if="presetsOptions.length !== 0" label="预设">
      <n-select v-model:value="ffmpegOptions.preset" :options="presetsOptions" />
    </n-form-item>
  </n-form>
</template>

<script setup lang="ts">
import { HelpCircleOutline } from "@vicons/ionicons5";
import type { FfmpegOptions } from "../../../../../types";

const emits = defineEmits<{
  (event: "change", value: FfmpegOptions): void;
}>();

const presetName = ref("libx264");

const videoEncoders = ref([
  {
    value: "libx264",
    label: "H.264(x264)",
    birateControls: [
      {
        value: "CRF",
        label: "CRF",
      },
      {
        value: "VBR",
        label: "VBR",
      },
    ],
    presets: [
      {
        value: "ultrafast",
        label: "ultrafast",
      },
      {
        value: "superfast",
        label: "superfast",
      },
      {
        value: "veryfast",
        label: "veryfast",
      },
      {
        value: "faster",
        label: "faster",
      },
      {
        value: "fast",
        label: "fast",
      },
      {
        value: "medium",
        label: "medium",
      },
      {
        value: "slow",
        label: "slow",
      },
      {
        value: "slower",
        label: "slower",
      },
      {
        value: "veryslow",
        label: "veryslow",
      },
      {
        value: "placebo",
        label: "placebo",
      },
    ],
  },
  {
    value: "h264_qsv",
    label: "H.264(Intel QSV)",
    birateControls: [
      {
        value: "VBR",
        label: "VBR",
      },
    ],
  },
  {
    value: "h264_nvenc",
    label: "H.264(NVIDIA NVEnc)",
    birateControls: [
      {
        value: "VBR",
        label: "VBR",
      },
    ],
  },
  {
    value: "h264_amf",
    label: "H.264(AMD AMF)",
    birateControls: [
      {
        value: "VBR",
        label: "VBR",
      },
    ],
  },

  {
    value: "libx265",
    label: "H.265(x265)",
    birateControls: [
      {
        value: "CRF",
        label: "CRF",
      },
      {
        value: "VBR",
        label: "VBR",
      },
    ],
    presets: [
      {
        value: "ultrafast",
        label: "ultrafast",
      },
      {
        value: "superfast",
        label: "superfast",
      },
      {
        value: "veryfast",
        label: "veryfast",
      },
      {
        value: "faster",
        label: "faster",
      },
      {
        value: "fast",
        label: "fast",
      },
      {
        value: "medium",
        label: "medium",
      },
      {
        value: "slow",
        label: "slow",
      },
      {
        value: "slower",
        label: "slower",
      },
      {
        value: "veryslow",
        label: "veryslow",
      },
      {
        value: "placebo",
        label: "placebo",
      },
    ],
  },
  {
    value: "hevc_qsv",
    label: "H.265(Intel QSV)",
    birateControls: [
      {
        value: "VBR",
        label: "VBR",
      },
    ],
  },
  {
    value: "hevc_nvenc",
    label: "H.265(NVIDIA NVEnc)",
    birateControls: [
      {
        value: "VBR",
        label: "VBR",
      },
    ],
  },
  {
    value: "hevc_amf",
    label: "H.265(AMD AMF)",
    birateControls: [
      {
        value: "VBR",
        label: "VBR",
      },
    ],
  },

  {
    value: "libsvtav1",
    label: "AV1 (libsvtav1)",
    birateControls: [
      {
        value: "CRF",
        label: "CRF",
      },
      {
        value: "VBR",
        label: "VBR",
      },
    ],
    presets: [
      {
        value: "ultrafast",
        label: "ultrafast",
      },
      {
        value: "superfast",
        label: "superfast",
      },
      {
        value: "veryfast",
        label: "veryfast",
      },
      {
        value: "faster",
        label: "faster",
      },
      {
        value: "fast",
        label: "fast",
      },
      {
        value: "medium",
        label: "medium",
      },
      {
        value: "slow",
        label: "slow",
      },
      {
        value: "slower",
        label: "slower",
      },
      {
        value: "veryslow",
        label: "veryslow",
      },
      {
        value: "placebo",
        label: "placebo",
      },
    ],
  },
  {
    value: "av1_qsv",
    label: "AV1 (Intel QSV)",
    birateControls: [
      {
        value: "VBR",
        label: "VBR",
      },
    ],
  },
  {
    value: "av1_nvenc",
    label: "AV1 (NVIDIA NVEnc)",
    birateControls: [
      {
        value: "VBR",
        label: "VBR",
      },
    ],
  },
  {
    value: "av1_amf",
    label: "AV1 (AMD AMF)",
    birateControls: [
      {
        value: "VBR",
        label: "VBR",
      },
    ],
  },
]);
const ffmpegPresets = ref([
  {
    value: "libx264",
    label: "H.264(x264)",
    options: {
      encoder: "libx264",
      bitrateControl: "CRF",
      crf: 23,
      preset: "fast",
      bitrate: 5000,
    },
  },
  {
    value: "qsv_h264",
    label: "H.264(Intel QSV)",
    options: {
      encoder: "h264_qsv",
      bitrateControl: "VBR",
      bitrate: 5000,
    },
  },
  {
    value: "nvenc_h264",
    label: "H.264(NVIDIA NVEnc)",
    options: { encoder: "h264_nvenc", bitrateControl: "VBR", bitrate: 5000 },
  },
  {
    value: "amf_h264",
    label: "H.264(AMD AMF)",
    options: { encoder: "h264_amf", bitrateControl: "VBR", bitrate: 5000 },
  },

  {
    value: "libx265",
    label: "H.265(x265)",
    options: {
      encoder: "libx265",
      bitrateControl: "CRF",
      crf: 28,
      bitrate: 5000,
    },
  },
  {
    value: "qsv_h265",
    label: "H.265(Intel QSV)",
    options: {
      encoder: "hevc_qsv",
      bitrateControl: "VBR",
      bitrate: 5000,
    },
  },
  { value: "nvenc_h265", label: "H.265(NVIDIA NVEnc)", options: { encoder: "hevc_nvenc" } },
  {
    value: "amf_h265",
    label: "H.265(AMD AMF)",
    options: {
      encoder: "hevc_amf",
      bitrateControl: "VBR",
      bitrate: 5000,
    },
  },

  {
    value: "svt_av1",
    label: "AV1 (libsvtav1)",
    options: {
      encoder: "libsvtav1",
      bitrateControl: "CRF",
      crf: 23,
      preset: "fast",
      bitrate: 5000,
    },
  },
  {
    value: "qsv_av1",
    label: "AV1 (Intel QSV)",
    options: {
      encoder: "av1_qsv",
      bitrateControl: "VBR",
      bitrate: 5000,
    },
  },
  {
    value: "nvenc_av1",
    label: "AV1 (NVIDIA NVEnc)",
    options: {
      encoder: "av1_nvenc",
      bitrateControl: "VBR",
      bitrate: 5000,
    },
  },
  {
    value: "amf_av1",
    label: "AV1 (AMD AMF)",
    options: {
      encoder: "av1_amf",
      bitrateControl: "VBR",
      bitrate: 5000,
    },
  },
]);

const birateControlOptions = computed(() => {
  return (
    videoEncoders.value.find((item) => item.value === ffmpegOptions.value.encoder)
      ?.birateControls ?? []
  );
});
const presetsOptions = computed(() => {
  return (
    videoEncoders.value.find((item) => item.value === ffmpegOptions.value.encoder)?.presets ?? []
  );
});

// @ts-ignore
const ffmpegOptions: Ref<FfmpegOptions> = ref({});

watch(
  () => ffmpegOptions.value,
  (value) => {
    emits("change", value);
  },
);

const handlePresetChange = (value: string) => {
  // @ts-ignore
  ffmpegOptions.value = ffmpegPresets.value.find((item) => item.value === value)?.options ?? {};
};

onMounted(async () => {
  // @ts-ignore
  ffmpegOptions.value =
    ffmpegPresets.value.find((item) => item.value === presetName.value)?.options ?? {};
});
</script>

<style scoped lang="less"></style>
