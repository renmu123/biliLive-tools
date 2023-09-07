<template>
  <n-form ref="formRef" :label-width="120">
    <n-form-item>
      <template #label>
        <n-popover trigger="hover">
          <template #trigger>
            <span class="flex align-center">
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
      <n-select v-model:value="presetName" :options="ffmpegPresets" @change="handlePresetChange" />
    </n-form-item>
    <n-divider />

    <n-form-item label="视频编码器" path="videoCode">
      <n-select v-model:value="ffmpegOptions.encoder" :options="videoEncoders" />
    </n-form-item>
  </n-form>
</template>

<script setup lang="ts">
import { HelpCircleOutline } from "@vicons/ionicons5";
const presetName = ref("libx264");

const videoEncoders = ref([
  {
    value: "libx264",
    label: "H.264(x264)",
  },
  {
    value: "h264_qsv",
    label: "H.264(Intel QSV)",
  },
  { value: "h264_nvenc", label: "H.264(NVIDIA NVEnc)" },
  { value: "h264_amf", label: "H.264(AMD AMF)" },

  {
    value: "libx265",
    label: "H.265(x265)",
  },
  {
    value: "hevc_qsv",
    label: "H.265(Intel QSV)",
  },
  { value: "hevc_nvenc", label: "H.265(NVIDIA NVEnc)" },
  {
    value: "hevc_amf",
    label: "H.265(AMD AMF)",
  },

  {
    value: "libsvtav1",
    label: "AV1 (libsvtav1)",
  },
  {
    value: "av1_qsv",
    label: "AV1 (Intel QSV)",
  },
  {
    value: "av1_nvenc",
    label: "AV1 (NVIDIA NVEnc)",
  },
  {
    value: "av1_amf",
    label: "AV1 (AMD AMF)",
  },
]);
const ffmpegPresets = ref([
  {
    value: "libx264",
    label: "H.264(x264)",
    options: {
      encoder: "libx264",
    },
  },
  {
    value: "qsv_h264",
    label: "H.264(Intel QSV)",
    options: {
      encoder: "h264_qsv",
    },
  },
  { value: "nvenc_h264", label: "H.264(NVIDIA NVEnc)", options: { encoder: "h264_nvenc" } },
  { value: "amf_h264", label: "H.264(AMD AMF)", options: { encoder: "h264_amf" } },

  {
    value: "libx265",
    label: "H.265(x265)",
    options: {
      encoder: "libx265",
    },
  },
  {
    value: "qsv_h265",
    label: "H.265(Intel QSV)",
    options: {
      encoder: "hevc_qsv",
    },
  },
  { value: "nvenc_h265", label: "H.265(NVIDIA NVEnc)", options: { encoder: "hevc_nvenc" } },
  {
    value: "amf_h265",
    label: "H.265(AMD AMF)",
    options: {
      encoder: "hevc_amf",
    },
  },

  {
    value: "svt_av1",
    label: "AV1 (libsvtav1)",
    options: {
      encoder: "libsvtav1 ",
    },
  },
  {
    value: "qsv_av1",
    label: "AV1 (Intel QSV)",
    options: {
      encoder: "av1_qsv",
    },
  },
  {
    value: "nvenc_av1",
    label: "AV1 (NVIDIA NVEnc)",
    options: {
      encoder: "av1_nvenc",
    },
  },
  {
    value: "amf_av1",
    label: "AV1 (AMD AMF)",
    options: {
      encoder: "av1_amf",
    },
  },
]);

const ffmpegOptions = ref({
  encoder: "libx264",
});

const handlePresetChange = (value: string) => {
  // @ts-ignore
  ffmpegOptions.value = ffmpegPresets.value.find((item) => item.value === value)?.options ?? {};
};

onMounted(async () => {
  const aa = await window.api.getAvailableEncoders();
  console.log(aa);
});

// {
//     // legacy encoders, back to HB 0.9.4 whenever possible (disabled)
//     { { "FFmpeg",                      "ffmpeg",           NULL,                             HB_VCODEC_FFMPEG_MPEG4,      HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 1, 0, HB_GID_VCODEC_MPEG4,  },
//     { { "MPEG-4 (FFmpeg)",             "ffmpeg4",          NULL,                             HB_VCODEC_FFMPEG_MPEG4,      HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 1, 0, HB_GID_VCODEC_MPEG4,  },
//     { { "MPEG-2 (FFmpeg)",             "ffmpeg2",          NULL,                             HB_VCODEC_FFMPEG_MPEG2,      HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 1, 0, HB_GID_VCODEC_MPEG2,  },
//     { { "VP3 (Theora)",                "libtheora",        NULL,                             HB_VCODEC_THEORA,                            HB_MUX_MASK_MKV, }, NULL, 1, 0, HB_GID_VCODEC_THEORA, },
//     // actual encoders
//     { { "AV1 (SVT)",                   "svt_av1",          "AV1 (SVT)",                      HB_VCODEC_SVT_AV1,           HB_MUX_MASK_MP4|HB_MUX_MASK_WEBM|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_AV1_SVT,    },
//     { { "AV1 10-bit (SVT)",            "svt_av1_10bit",    "AV1 10-bit (SVT)",               HB_VCODEC_SVT_AV1_10BIT,     HB_MUX_MASK_MP4|HB_MUX_MASK_WEBM|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_AV1_SVT,    },
//     { { "AV1 (Intel QSV)",             "qsv_av1",          "AV1 (Intel Media SDK)",          HB_VCODEC_QSV_AV1,           HB_MUX_MASK_MP4|HB_MUX_MASK_WEBM|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_AV1_QSV,    },
//     { { "AV1 10-bit (Intel QSV)",      "qsv_av1_10bit",    "AV1 10-bit (Intel Media SDK)",   HB_VCODEC_QSV_AV1_10BIT,     HB_MUX_MASK_MP4|HB_MUX_MASK_WEBM|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_AV1_QSV,    },
//     { { "AV1 (NVEnc)",                 "nvenc_av1",        "AV1 (NVEnc)",                    HB_VCODEC_FFMPEG_NVENC_AV1,                   HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_AV1_NVENC,  },
//     { { "AV1 10-bit (NVEnc)",          "nvenc_av1_10bit",  "AV1 10-bit (NVEnc)",             HB_VCODEC_FFMPEG_NVENC_AV1_10BIT,             HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_AV1_NVENC,  },
//     { { "H.264 (x264)",                "x264",             "H.264 (libx264)",                HB_VCODEC_X264_8BIT,                          HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_H264_X264,  },
//     { { "H.264 10-bit (x264)",         "x264_10bit",       "H.264 10-bit (libx264)",         HB_VCODEC_X264_10BIT,                         HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_H264_X264,  },
//     { { "H.264 (Intel QSV)",           "qsv_h264",         "H.264 (Intel Media SDK)",        HB_VCODEC_QSV_H264,                           HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_H264_QSV,   },
//     { { "H.264 (AMD VCE)",             "vce_h264",         "H.264 (AMD VCE)",                HB_VCODEC_FFMPEG_VCE_H264,                    HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_H264_VCE,   },
//     { { "H.264 (NVEnc)",               "nvenc_h264",       "H.264 (NVEnc)",                  HB_VCODEC_FFMPEG_NVENC_H264,                  HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_H264_NVENC, },
//     { { "H.264 (MediaFoundation)",     "mf_h264",          "H.264 (MediaFoundation)",        HB_VCODEC_FFMPEG_MF_H264,                     HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_H264_MF,    },
//     { { "H.264 (VideoToolbox)",        "vt_h264",          "H.264 (VideoToolbox)",           HB_VCODEC_VT_H264,                            HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_H264_VT,    },
//     { { "H.265 (x265)",                "x265",             "H.265 (libx265)",                HB_VCODEC_X265_8BIT,                            HB_MUX_AV_MP4|HB_MUX_AV_MKV,   }, NULL, 0, 1, HB_GID_VCODEC_H265_X265,  },
//     { { "H.265 10-bit (x265)",         "x265_10bit",       "H.265 10-bit (libx265)",         HB_VCODEC_X265_10BIT,                           HB_MUX_AV_MP4|HB_MUX_AV_MKV,   }, NULL, 0, 1, HB_GID_VCODEC_H265_X265,  },
//     { { "H.265 12-bit (x265)",         "x265_12bit",       "H.265 12-bit (libx265)",         HB_VCODEC_X265_12BIT,                           HB_MUX_AV_MP4|HB_MUX_AV_MKV,   }, NULL, 0, 1, HB_GID_VCODEC_H265_X265,  },
//     { { "H.265 16-bit (x265)",         "x265_16bit",       "H.265 16-bit (libx265)",         HB_VCODEC_X265_16BIT,                           HB_MUX_AV_MP4|HB_MUX_AV_MKV,   }, NULL, 0, 1, HB_GID_VCODEC_H265_X265,  },
//     { { "H.265 (Intel QSV)",           "qsv_h265",         "H.265 (Intel Media SDK)",        HB_VCODEC_QSV_H265,                           HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_H265_QSV,   },
//     { { "H.265 10-bit (Intel QSV)",    "qsv_h265_10bit",   "H.265 10-bit (Intel Media SDK)", HB_VCODEC_QSV_H265_10BIT,                     HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_H265_QSV,   },
//     { { "H.265 (AMD VCE)",             "vce_h265",         "H.265 (AMD VCE)",                HB_VCODEC_FFMPEG_VCE_H265,                    HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_H265_VCE,   },
//     { { "H.265 10-bit (AMD VCE)",      "vce_h265_10bit",   "H.265 10-bit (AMD VCE)",         HB_VCODEC_FFMPEG_VCE_H265_10BIT,              HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_H265_VCE,   },
//     { { "H.265 (NVEnc)",               "nvenc_h265",       "H.265 (NVEnc)",                  HB_VCODEC_FFMPEG_NVENC_H265,                  HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_H265_NVENC, },
//     { { "H.265 10-bit (NVEnc)",        "nvenc_h265_10bit", "H.265 10-bit (NVEnc)",           HB_VCODEC_FFMPEG_NVENC_H265_10BIT,            HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_H265_NVENC, },
//     { { "H.265 (MediaFoundation)",     "mf_h265",          "H.265 (MediaFoundation)",        HB_VCODEC_FFMPEG_MF_H265,                     HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_H265_MF,    },
//     { { "H.265 (VideoToolbox)",        "vt_h265",          "H.265 (VideoToolbox)",           HB_VCODEC_VT_H265,                            HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_H265_VT,    },
//     { { "H.265 10-bit (VideoToolbox)", "vt_h265_10bit",    "H.265 10-bit (VideoToolbox)",    HB_VCODEC_VT_H265_10BIT,                      HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_H265_VT,    },
//     { { "MPEG-4",                      "mpeg4",            "MPEG-4 (libavcodec)",            HB_VCODEC_FFMPEG_MPEG4,                       HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_MPEG4,      },
//     { { "MPEG-2",                      "mpeg2",            "MPEG-2 (libavcodec)",            HB_VCODEC_FFMPEG_MPEG2,                       HB_MUX_MASK_MP4|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_MPEG2,      },
//     { { "VP8",                         "VP8",              "VP8 (libvpx)",                   HB_VCODEC_FFMPEG_VP8,                        HB_MUX_MASK_WEBM|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_VP8,        },
//     { { "VP9",                         "VP9",              "VP9 (libvpx)",                   HB_VCODEC_FFMPEG_VP9,                        HB_MUX_MASK_WEBM|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_VP9,        },
//     { { "VP9 10-bit",                  "VP9_10bit",        "VP9 10-bit (libvpx)",            HB_VCODEC_FFMPEG_VP9_10BIT,                  HB_MUX_MASK_WEBM|HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_VP9,        },
//     { { "Theora",                      "theora",           "Theora (libtheora)",             HB_VCODEC_THEORA,                                             HB_MUX_MASK_MKV, }, NULL, 0, 1, HB_GID_VCODEC_THEORA,     },
// };
</script>

<style scoped lang="less"></style>
