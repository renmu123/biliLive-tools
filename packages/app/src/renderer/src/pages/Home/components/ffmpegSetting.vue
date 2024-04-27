<template>
  <n-form ref="formRef" label-width="130px" label-placement="left" label-align="right">
    <n-form-item label="预设">
      <n-cascader
        v-model:value="presetId"
        placeholder="请选择预设"
        expand-trigger="click"
        :options="options"
        check-strategy="child"
        :show-path="false"
        :filterable="true"
      />
    </n-form-item>
    <n-divider />

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
              视频编码器 <n-icon size="18" class="pointer"> <HelpCircleOutline /> </n-icon
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
        v-model:value="ffmpegOptions.config.encoder"
        :options="videoEncoders"
        :on-update:value="handleVideoEncoderChange"
      />
    </n-form-item>

    <n-form-item v-if="(encoderOptions?.birateControls || []).length !== 0" label="码率控制">
      <n-select
        v-model:value="ffmpegOptions.config.bitrateControl"
        :options="encoderOptions?.birateControls || []"
      />
    </n-form-item>
    <n-form-item
      v-if="
        ffmpegOptions.config.bitrateControl === 'CRF' ||
        ffmpegOptions.config.bitrateControl === 'CQ'
      "
    >
      <template #label>
        <span
          class="flex align-center"
          :style="{
            'justify-content': 'flex-end',
          }"
        >
          <span v-if="ffmpegOptions.config.bitrateControl === 'CQ'">cq</span>
          <span v-else>crf</span>

          <Tip v-if="['libx264', 'libx265'].includes(ffmpegOptions.config.encoder)">
            <p>CRF值为0：无损压缩，最高质量，最大文件大小。</p>
            <p>
              CRF值较低（例如，18-24）：高质量，较大文件大小。适用于需要高质量输出的情况，18为视觉无损。
            </p>
            <p>CRF值较高（例如，28-51）：较低质量，较小文件大小。适用于需要较小文件的情况。</p>
            <p>CRF值越小，压制越慢</p>
          </Tip>
          <Tip
            v-if="['h264_nvenc', 'hevc_nvenc', 'av1_nvenc'].includes(ffmpegOptions.config.encoder)"
          >
            <p>值为0：自动</p>
            <p>值为1-51：越小质量越高，越大质量越低</p>
          </Tip>
        </span>
      </template>
      <n-input-number
        v-model:value.number="ffmpegOptions.config.crf"
        class="input-number"
        :min="crfMinMax[0]"
        :max="crfMinMax[1]"
      />
    </n-form-item>
    <n-form-item v-if="ffmpegOptions.config.bitrateControl === 'VBR'">
      <template #label>
        <span class="inline-flex">
          <span>码率</span>
          <Tip>
            一般杂谈录播视频，码率 5000k 够了。如果是游戏，可以拉到
            10000k及以上，如果弹幕较多，可以尝试拉到更高，具体码率可自行测试
          </Tip>
        </span>
      </template>
      <n-input-number
        v-model:value.number="ffmpegOptions.config.bitrate"
        class="input-number"
        :step="500"
        placeholder="请输入码率"
      >
        <template #suffix> K </template></n-input-number
      >
    </n-form-item>

    <n-form-item v-if="(encoderOptions?.presets || []).length !== 0" label="预设">
      <n-select
        v-model:value="ffmpegOptions.config.preset"
        :options="encoderOptions?.presets || []"
        placeholder="请选择预设"
      />
    </n-form-item>
    <n-form-item
      v-if="['h264_nvenc', 'hevc_nvenc', 'av1_nvenc'].includes(ffmpegOptions.config.encoder)"
    >
      <template #label>
        <span class="inline-flex">
          <span>硬件解码</span>
          <Tip>
            使用硬件解码器，开启后可能会减少压制时间，nvidia会使用nvdec，如果压制失败请关闭
          </Tip>
        </span>
      </template>
      <n-checkbox v-model:checked="ffmpegOptions.config.decode"></n-checkbox>
    </n-form-item>

    <n-form-item>
      <template #label>
        <span class="inline-flex">
          <span>重新缩放分辨率</span>
          <Tip>
            <p>
              实质上不会提升画质，但由于B站4K可拥有更高码率，可以通过缩放分辨率来减少二压对码率的影响，但会增加压制时间
            </p>
            <p>4K：3840X2160<br />2K：2560X1440<br />1080：1920X1080</p>
          </Tip>
        </span>
      </template>

      <n-checkbox
        v-model:checked="ffmpegOptions.config.resetResolution"
        style="margin-right: 20px"
      ></n-checkbox>
      <template v-if="ffmpegOptions.config.resetResolution">
        <n-input-number
          v-model:value.number="ffmpegOptions.config.resolutionWidth"
          class="input-number"
          :min="0"
          :step="100"
          placeholder="宽"
          style="width: 100px"
        />&nbsp;X&nbsp;
        <n-input-number
          v-model:value.number="ffmpegOptions.config.resolutionHeight"
          class="input-number"
          :min="0"
          :step="100"
          placeholder="高"
          style="width: 100px"
        />
      </template>
    </n-form-item>

    <div class="actions">
      <n-button
        v-if="!presetId.startsWith('b_') && presetId !== 'default'"
        ghost
        quaternary
        class="btn"
        type="error"
        @click="deletePreset"
        >删除</n-button
      >
      <n-button v-if="!presetId.startsWith('b_')" type="primary" class="btn" @click="rename"
        >重命名</n-button
      >
      <n-button type="primary" class="btn" @click="saveAs">另存为</n-button>
      <n-button v-if="!presetId.startsWith('b_')" type="primary" class="btn" @click="saveConfig"
        >保存</n-button
      >
    </div>

    <n-modal v-model:show="nameModelVisible">
      <n-card style="width: 600px" :bordered="false" role="dialog" aria-modal="true">
        <n-input
          v-model:value="tempPresetName"
          placeholder="请输入预设名称"
          maxlength="15"
          @keyup.enter="saveConfirm"
        />
        <template #footer>
          <div style="text-align: right">
            <n-button @click="nameModelVisible = false">取消</n-button>
            <n-button type="primary" style="margin-left: 10px" @click="saveConfirm">确认</n-button>
          </div>
        </template>
      </n-card>
    </n-modal>
  </n-form>
</template>

<script setup lang="ts">
import { HelpCircleOutline } from "@vicons/ionicons5";
import { useConfirm } from "@renderer/hooks";
import { uuid } from "@renderer/utils";
import { cloneDeep } from "lodash-es";

import type { FfmpegPreset } from "../../../../../types";

const notice = useNotification();
const confirmDialog = useConfirm();

const emits = defineEmits<{
  (event: "change", value: FfmpegPreset): void;
}>();

const presetId = defineModel<string>({ required: true });

const nvencPresets = [
  {
    value: "p1",
    label: "fastest",
  },
  {
    value: "p2",
    label: "faster",
  },
  {
    value: "p3",
    label: "fast",
  },
  {
    value: "p4",
    label: "medium",
  },
  {
    value: "p5",
    label: "slow",
  },
  {
    value: "p6",
    label: "slower",
  },
  {
    value: "p7",
    label: "slowest",
  },
];
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
        label: "CBR",
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
        label: "CBR",
      },
    ],
  },
  {
    value: "h264_nvenc",
    label: "H.264(NVIDIA NVEnc)",
    birateControls: [
      {
        value: "CQ",
        label: "CQP",
      },
      {
        value: "VBR",
        label: "CBR",
      },
    ],
    presets: nvencPresets,
  },
  {
    value: "h264_amf",
    label: "H.264(AMD AMF)",
    birateControls: [
      {
        value: "VBR",
        label: "CBR",
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
        label: "CBR",
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
        label: "CBR",
      },
    ],
  },
  {
    value: "hevc_nvenc",
    label: "H.265(NVIDIA NVEnc)",
    birateControls: [
      {
        value: "CQ",
        label: "CQP",
      },
      {
        value: "VBR",
        label: "CBR",
      },
    ],
    presets: nvencPresets,
  },
  {
    value: "hevc_amf",
    label: "H.265(AMD AMF)",
    birateControls: [
      {
        value: "VBR",
        label: "CBR",
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
        label: "CBR",
      },
    ],
    presets: [
      {
        value: "0",
        label: "0",
      },
      {
        value: "1",
        label: "1",
      },
      {
        value: "2",
        label: "2",
      },
      {
        value: "3",
        label: "3",
      },
      {
        value: "4",
        label: "4",
      },
      {
        value: "5",
        label: "5",
      },
      {
        value: "6",
        label: "6",
      },
      {
        value: "7",
        label: "8",
      },
      {
        value: "9",
        label: "9",
      },
      {
        value: "10",
        label: "10",
      },
      {
        value: "11",
        label: "11",
      },
      {
        value: "12",
        label: "12",
      },
      {
        value: "13",
        label: "13",
      },
    ],
  },
  {
    value: "av1_qsv",
    label: "AV1 (Intel QSV)",
    birateControls: [
      {
        value: "VBR",
        label: "CBR",
      },
    ],
  },
  {
    value: "av1_nvenc",
    label: "AV1 (NVIDIA NVEnc)",
    birateControls: [
      {
        value: "CQ",
        label: "CQP",
      },
      {
        value: "VBR",
        label: "CBR",
      },
    ],
    presets: nvencPresets,
  },
  {
    value: "av1_amf",
    label: "AV1 (AMD AMF)",
    birateControls: [
      {
        value: "VBR",
        label: "CBR",
      },
    ],
  },
]);

const encoderOptions = computed(() => {
  return videoEncoders.value.find((item) => item.value === ffmpegOptions.value?.config?.encoder);
});

// @ts-ignore
const ffmpegOptions: Ref<FfmpegPreset> = ref({
  id: "",
  name: "",
  config: {},
});

watch(
  () => ffmpegOptions.value,
  (value) => {
    emits("change", value);
  },
);

const options = ref<
  {
    value: string;
    label: string;
    children: {
      value: string;
      label: string;
    }[];
  }[]
>([]);
const getPresetOptions = async () => {
  options.value = await window.api.ffmpeg.getPresetOptions();
};

const handlePresetChange = async () => {
  ffmpegOptions.value = await window.api.ffmpeg.getPreset(presetId.value);
};

watch(presetId, handlePresetChange);

const rename = async () => {
  tempPresetName.value = ffmpegOptions.value.name;
  isRename.value = true;
  nameModelVisible.value = true;
};

const saveAs = async () => {
  isRename.value = false;
  tempPresetName.value = "";
  nameModelVisible.value = true;
};
const deletePreset = async () => {
  const appConfig = await window.api.config.getAll();
  let ids = Object.entries(appConfig.webhook.rooms || {}).map(([, value]) => {
    return value?.ffmpegPreset;
  });
  ids.push(appConfig.webhook?.ffmpegPreset);
  ids = ids.filter((id) => id !== undefined && id !== "");

  const msg = ids.includes(presetId.value)
    ? "该预设正在被使用中，删除后使用该预设的功能将失效，是否确认删除？"
    : "是否确认删除该预设？";

  const status = await confirmDialog.warning({
    content: msg,
  });
  if (!status) return;
  await window.api.ffmpeg.deletePreset(presetId.value);
  presetId.value = "default";
  getPresetOptions();
};

const nameModelVisible = ref(false);
const tempPresetName = ref("");
const isRename = ref(false);

const saveConfig = async () => {
  await window.api.ffmpeg.savePreset(toRaw(ffmpegOptions.value));
  notice.success({
    title: "保存成功",
    duration: 1000,
  });
};
const saveConfirm = async () => {
  if (!tempPresetName.value) {
    notice.warning({
      title: "预设名称不得为空",
      duration: 2000,
    });
    return;
  }
  const preset = cloneDeep(ffmpegOptions.value);
  if (!isRename.value) preset.id = uuid();
  preset.name = tempPresetName.value;

  await window.api.ffmpeg.savePreset(preset);
  nameModelVisible.value = false;
  notice.success({
    title: "保存成功",
    duration: 1000,
  });
  getPresetOptions();
};

const handleVideoEncoderChange = (value: string) => {
  ffmpegOptions.value.config.encoder = value;
  if (
    (encoderOptions.value?.birateControls || [])
      .map((item) => item.value)
      .includes(ffmpegOptions.value?.config?.bitrateControl || "")
  ) {
    // do nothing
  } else {
    ffmpegOptions.value.config.bitrateControl = encoderOptions.value?.birateControls[0].value as
      | "CRF"
      | "VBR"
      | "ABR"
      | "CBR";
  }
};

const crfMinMax = computed(() => {
  if (ffmpegOptions.value.config.encoder === "libsvtav1") {
    return [0, 63];
  } else if (ffmpegOptions.value.config.encoder === "libx264") {
    return [0, 51];
  } else {
    return [0, 51];
  }
});

onMounted(async () => {
  await getPresetOptions();
  handlePresetChange();
});
</script>

<style scoped lang="less">
.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>
