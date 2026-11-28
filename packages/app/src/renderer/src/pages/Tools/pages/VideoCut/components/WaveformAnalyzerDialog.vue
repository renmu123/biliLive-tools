<template>
  <n-modal
    v-model:show="visible"
    preset="dialog"
    :show-icon="false"
    style="width: 640px"
    :on-after-leave="handleClose"
    :mask-closable="false"
  >
    <p style="padding-top: 16px; color: skyblue">
      自动识别演唱片段，保留伴奏间奏并补齐前后奏。建议先使用默认参数；识别完成后会替换当前片段，也可右键识别歌名。演唱检测使用内置模型，可离线分析。
    </p>
    <n-form
      ref="formRef"
      :model="formValue"
      label-placement="left"
      label-width="auto"
      require-mark-placement="right-hanging"
    >
      <n-collapse :default-expanded-names="[]" style="margin-bottom: 16px">
        <n-collapse-item title="高级配置" name="advanced">
          <n-form-item
            v-for="field in numberFields"
            :key="field.key"
            :label="field.label"
            :path="field.key"
          >
            <n-input-number
              v-model:value="formValue[field.key]"
              :min="field.min"
              :max="field.max"
              :step="field.step"
              :precision="field.precision"
              :disabled="loading"
              :update-value-on-input="false"
            />
            <n-text depth="3" style="margin-left: 8px; font-size: 12px">{{ field.hint }}</n-text>
          </n-form-item>
          <n-form-item label="保留伴奏间奏">
            <n-checkbox v-model:checked="formValue.bridgeMusicGaps" :disabled="loading" />
            <n-text depth="3" style="margin-left: 8px; font-size: 12px"
              >在合格唱段之间检查持续音乐和讲话分数</n-text
            >
          </n-form-item>
          <n-form-item label="补齐前后奏">
            <n-checkbox v-model:checked="formValue.extendMusicEdges" :disabled="loading" />
            <n-text depth="3" style="margin-left: 8px; font-size: 12px"
              >遇持续讲话或音乐中断时停止扩展</n-text
            >
          </n-form-item>
          <n-form-item label="不保留缓存">
            <n-checkbox v-model:checked="formValue.disableCache" :disabled="loading" />
            <n-text depth="3" style="margin-left: 8px; font-size: 12px"
              >重新分析并清除本视频分数缓存，保留模型</n-text
            >
          </n-form-item>
        </n-collapse-item>
      </n-collapse>

      <!-- 进度条 -->
      <n-form-item v-if="loading">
        <div style="width: 100%">
          <n-progress
            type="line"
            :percentage="progress.percentage"
            :status="progress.percentage === 100 ? 'success' : 'default'"
            :show-indicator="true"
          />
          <n-text depth="3" style="margin-top: 8px; font-size: 12px; display: block">
            {{ progress.message }}
          </n-text>
        </div>
      </n-form-item>
    </n-form>

    <template #action>
      <n-space justify="end">
        <n-button :disabled="loading" @click="handleReset">重置默认值</n-button>
        <n-button @click="handleCancel">取消</n-button>
        <n-button type="primary" @click="handleConfirm" :loading="loading">确定</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { taskApi } from "@renderer/apis";

import { DEFAULT_MUSIC_DETECTION_CONFIG } from "@biliLive-tools/types/musicDetection.js";
import type { MusicDetectionConfig as WaveformAnalyzerConfig } from "@biliLive-tools/types/musicDetection.js";

type NumericKey = {
  [K in keyof WaveformAnalyzerConfig]: WaveformAnalyzerConfig[K] extends number ? K : never;
}[keyof WaveformAnalyzerConfig];
const numberFields: {
  key: NumericKey;
  label: string;
  min: number;
  max: number;
  step: number;
  precision: number;
  hint: string;
}[] = [
  {
    key: "startThreshold",
    label: "演唱开始阈值",
    min: 0.001,
    max: 1,
    step: 0.001,
    precision: 3,
    hint: "值越高要求越严格",
  },
  {
    key: "sustainThreshold",
    label: "演唱维持阈值",
    min: 0.001,
    max: 1,
    step: 0.001,
    precision: 3,
    hint: "不能高于开始阈值",
  },
  {
    key: "maximumSeedSpeech",
    label: "讲话分数上限",
    min: 0,
    max: 1,
    step: 0.01,
    precision: 2,
    hint: "仅用于确认持续演唱",
  },
  {
    key: "contextFrames",
    label: "演唱判断窗口",
    min: 1,
    max: 101,
    step: 2,
    precision: 0,
    hint: "奇数帧，21 帧约 10 秒",
  },
  {
    key: "boundarySmoothingFrames",
    label: "边界平滑窗口",
    min: 1,
    max: 101,
    step: 2,
    precision: 0,
    hint: "奇数帧，5 帧约 2.9 秒",
  },
  {
    key: "decisionHopSeconds",
    label: "判断步长",
    min: 0.48,
    max: 9.6,
    step: 0.48,
    precision: 2,
    hint: "秒，须为 0.48 的整数倍",
  },
  {
    key: "minimumSeedSeconds",
    label: "连续演唱证据",
    min: 0.48,
    max: 60,
    step: 0.48,
    precision: 2,
    hint: "秒，排除零散演唱分数",
  },
  {
    key: "minSegmentDuration",
    label: "最小片段时长",
    min: 1,
    max: 3000,
    step: 1,
    precision: 0,
    hint: "秒",
  },
  {
    key: "maxGapDuration",
    label: "演唱证据合并间隔",
    min: 0,
    max: 1200,
    step: 1,
    precision: 0,
    hint: "秒",
  },
  {
    key: "bridgeMaxGapSeconds",
    label: "最大伴奏间隔",
    min: 0,
    max: 1200,
    step: 1,
    precision: 0,
    hint: "秒，仅连接音乐持续且讲话较少的间隔",
  },
  {
    key: "maximumLeadSeconds",
    label: "最多补齐前奏",
    min: 0,
    max: 1200,
    step: 1,
    precision: 0,
    hint: "秒",
  },
  {
    key: "maximumTailSeconds",
    label: "最多补齐尾奏",
    min: 0,
    max: 1200,
    step: 1,
    precision: 0,
    hint: "秒",
  },
];

interface Props {
  modelValue: WaveformAnalyzerConfig;
  filePath: string | null;
}

interface Emits {
  (e: "update:modelValue", value: WaveformAnalyzerConfig): void;
  (e: "confirm", value: { startTime: number; endTime: number }[]): void;
  (e: "cancel"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const notice = useNotice();

const visible = defineModel<boolean>("visible", { default: false });

const defaultConfig = DEFAULT_MUSIC_DETECTION_CONFIG;

const formValue = ref<WaveformAnalyzerConfig>({ ...props.modelValue });

// 监听props变化，更新表单值
watch(
  () => props.modelValue,
  (newValue) => {
    formValue.value = { ...newValue };
  },
  { deep: true },
);

const loading = ref(false);
const progress = ref({
  percentage: 0,
  message: "准备开始...",
  stage: "",
});

let eventSource: EventSource | null = null;

const handleConfirm = async () => {
  if (!props.filePath) {
    notice.error({
      title: "文件路径无效，无法分析",
      duration: 10000,
    });
    return;
  }

  if (loading.value) return;
  const c = formValue.value;
  const invalid = numberFields.some(
    (field) =>
      !Number.isFinite(c[field.key]) || c[field.key] < field.min || c[field.key] > field.max,
  );
  const invalidWindow = [c.contextFrames, c.boundarySmoothingFrames].some(
    (n) => !Number.isInteger(n) || n % 2 !== 1,
  );
  const hop = c.decisionHopSeconds / 0.48;
  if (
    invalid ||
    invalidWindow ||
    c.sustainThreshold > c.startThreshold ||
    Math.abs(hop - Math.round(hop)) > 1e-8
  ) {
    notice.error({
      title: "检测参数无效",
      content: "请检查参数范围、奇数窗口、0.48 秒整数倍步长，以及维持阈值不高于开始阈值。",
      duration: 5000,
    });
    return;
  }
  loading.value = true;
  progress.value = {
    percentage: 0,
    message: "准备开始分析...",
    stage: "",
  };

  try {
    eventSource = await taskApi.analyzerWaveform(props.filePath, formValue.value);
    console.log("SSE 连接已建立", eventSource);

    eventSource.onmessage = (event) => {
      // console.log("收到 SSE 消息:", event.data);
      try {
        const data = JSON.parse(event.data);

        if (data.type === "progress") {
          // 更新进度
          progress.value = {
            percentage: data.percentage,
            message: data.message,
            stage: data.stage,
          };
        } else if (data.type === "complete") {
          // 完成
          loading.value = false;
          eventSource?.close();
          eventSource = null;

          emit("update:modelValue", { ...formValue.value });
          emit("confirm", data.data);
          visible.value = false;

          notice.success({
            title: "分析完成",
            duration: 2000,
          });
        } else if (data.type === "error") {
          // 错误
          loading.value = false;
          eventSource?.close();
          eventSource = null;

          notice.error({
            title: "分析失败",
            content: data.message,
            duration: 3000,
          });
        }
      } catch (e) {
        console.error("解析 SSE 数据失败:", e);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE 连接错误:", error);
      loading.value = false;
      eventSource?.close();
      eventSource = null;

      notice.error({
        title: "连接失败",
        content: "服务器连接中断，请重试",
        duration: 3000,
      });
    };
  } catch (e) {
    loading.value = false;
    notice.error({
      title: "启动分析失败",
      content: e instanceof Error ? e.message : "未知错误",
      duration: 3000,
    });
  }
};

const handleCancel = () => {
  // 关闭 SSE 连接
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

  loading.value = false;
  // 恢复原值
  formValue.value = { ...props.modelValue };
  emit("cancel");
  visible.value = false;
};

const handleReset = () => {
  formValue.value = { ...defaultConfig };
};

const handleClose = () => {
  // 关闭 SSE 连接
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

  loading.value = false;
  // 关闭时恢复原值
  formValue.value = { ...props.modelValue };
};
</script>

<style scoped lang="less">
:deep(.n-input-number) {
  width: 140px;
}
</style>
