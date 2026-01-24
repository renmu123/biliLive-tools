<template>
  <n-modal
    v-model:show="visible"
    preset="dialog"
    :show-icon="false"
    style="width: 520px"
    :on-after-leave="handleClose"
  >
    <p style="padding-top: 16px; color: skyblue">
      此项功能用来快速对长视频中的翻唱音乐片段进行识别，分段后你也可以在片段中右键识别歌曲名称，调整参数可以更加精准地切割，第一次使用建议先尝试默认值，尝试后再进行调整，确认后会清空当前片段。
    </p>
    <n-form
      ref="formRef"
      :model="formValue"
      label-placement="left"
      label-width="auto"
      require-mark-placement="right-hanging"
    >
      <n-form-item label="能量百分位阈值" path="energyPercentile">
        <n-input-number
          v-model:value="formValue.energyPercentile"
          :min="0"
          :max="100"
          :step="1"
          placeholder="能量百分位阈值"
        >
          <template #suffix>%</template>
        </n-input-number>
        <n-text depth="3" style="margin-left: 8px; font-size: 12px"> 值越高要求越严格 </n-text>
      </n-form-item>

      <n-form-item label="最小片段时长" path="minSegmentDuration">
        <n-input-number
          v-model:value="formValue.minSegmentDuration"
          :min="1"
          :max="3000"
          :step="1"
          placeholder="最小片段时长"
        >
          <template #suffix>秒</template>
        </n-input-number>
        <n-text depth="3" style="margin-left: 8px; font-size: 12px">
          过滤掉短于此时长的片段
        </n-text>
      </n-form-item>

      <n-form-item label="最大间隔时长" path="maxGapDuration">
        <n-input-number
          v-model:value="formValue.maxGapDuration"
          :min="0"
          :max="1200"
          :step="1"
          placeholder="最大间隔时长"
        >
          <template #suffix>秒</template>
        </n-input-number>
        <n-text depth="3" style="margin-left: 8px; font-size: 12px">
          短于此时长的间隔会被合并
        </n-text>
      </n-form-item>

      <n-form-item label="平滑窗口大小" path="smoothWindowSize">
        <n-input-number
          v-model:value="formValue.smoothWindowSize"
          :min="1"
          :max="20"
          :step="1"
          placeholder="平滑窗口大小"
        >
          <template #suffix>秒</template>
        </n-input-number>
        <n-text depth="3" style="margin-left: 8px; font-size: 12px">
          用于平滑能量曲线，减少噪声影响
        </n-text>
      </n-form-item>

      <n-form-item label="不保留缓存" path="disableCache">
        <n-checkbox v-model:checked="formValue.disableCache" />
        <n-text depth="3" style="margin-left: 8px; font-size: 12px">
          分析完成后删除缓存文件，下次需要重新提取音频
        </n-text>
      </n-form-item>
    </n-form>

    <template #action>
      <n-space justify="end">
        <n-button @click="handleReset">重置默认值</n-button>
        <n-button @click="handleCancel">取消</n-button>
        <n-button type="primary" @click="handleConfirm" :loading="loading">确定</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { taskApi } from "@renderer/apis";

interface WaveformAnalyzerConfig {
  energyPercentile: number; // 能量百分位阈值 (0-100)
  minSegmentDuration: number; // 最小片段时长（秒）
  maxGapDuration: number; // 最大间隔时长（秒）
  smoothWindowSize: number; // 平滑窗口大小（秒）
  disableCache?: boolean; // 不保留缓存
}

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

const defaultConfig: WaveformAnalyzerConfig = {
  energyPercentile: 50,
  minSegmentDuration: 20,
  maxGapDuration: 20,
  smoothWindowSize: 4,
  disableCache: false,
};

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
const handleConfirm = async () => {
  if (!props.filePath) {
    notice.error({
      title: "文件路径无效，无法分析",
      duration: 10000,
    });
    return;
  }

  notice.info({
    title: "正在识别分析中，具体时间视视频长度而定，请玩会儿手机耐心等待...",
    duration: 1000,
  });
  loading.value = true;
  try {
    const result = await taskApi.analyzerWaveform(props.filePath, formValue.value);
    loading.value = false;

    emit("update:modelValue", { ...formValue.value });
    emit("confirm", result.output);
    visible.value = false;
  } catch (e) {
    loading.value = false;
    notice.error({
      title: "分析失败",
      duration: 2000,
    });
  }
};

const handleCancel = () => {
  // 恢复原值
  formValue.value = { ...props.modelValue };
  emit("cancel");
  visible.value = false;
};

const handleReset = () => {
  formValue.value = { ...defaultConfig };
};

const handleClose = () => {
  // 关闭时恢复原值
  formValue.value = { ...props.modelValue };
};
</script>

<style scoped lang="less">
:deep(.n-input-number) {
  width: 140px;
}
</style>
