<template>
  <n-modal
    v-model:show="visible"
    preset="dialog"
    :show-icon="false"
    style="width: 520px"
    :on-after-leave="handleClose"
  >
    <h1>
      此项功能用来快速对长视频中的翻唱音乐片段进行识别，分段后你也可以在片段中右键识别歌曲名称，调整参数可以更加精准地切割
    </h1>
    <n-form
      ref="formRef"
      :model="formValue"
      label-placement="left"
      label-width="auto"
      require-mark-placement="right-hanging"
    >
      <n-form-item label="窗口大小(秒)" path="windowSize">
        <n-input-number
          v-model:value="formValue.windowSize"
          :min="0.1"
          :max="10"
          :step="0.5"
          placeholder="窗口大小"
        >
          <template #suffix>秒</template>
        </n-input-number>
        <n-text depth="3" style="margin-left: 8px; font-size: 12px">
          增大让分析更平滑，过大可能导致片段合并
        </n-text>
      </n-form-item>

      <n-form-item label="窗口重叠率" path="windowOverlap">
        <n-input-number
          v-model:value="formValue.windowOverlap"
          :min="0"
          :max="1"
          :step="0.1"
          placeholder="窗口重叠率"
        />
        <n-text depth="3" style="margin-left: 8px; font-size: 12px">
          0-1之间，建议0.5(50%重叠)
        </n-text>
      </n-form-item>

      <n-form-item label="唱歌能量阈值" path="singingEnergyThreshold">
        <n-input-number
          v-model:value="formValue.singingEnergyThreshold"
          :min="0.1"
          :max="5"
          :step="0.1"
          placeholder="唱歌能量阈值倍数"
        />
        <n-text depth="3" style="margin-left: 8px; font-size: 12px">
          降低以减少漏检，大概就是唱歌音量
        </n-text>
      </n-form-item>

      <n-form-item label="说话能量阈值" path="talkingEnergyThreshold">
        <n-input-number
          v-model:value="formValue.talkingEnergyThreshold"
          :min="0.1"
          :max="5"
          :step="0.1"
          placeholder="说话能量阈值倍数"
        />
        <n-text depth="3" style="margin-left: 8px; font-size: 12px"> 大概就是说话音量 </n-text>
      </n-form-item>

      <n-form-item label="最小片段时长(秒)" path="minSegmentDuration">
        <n-input-number
          v-model:value="formValue.minSegmentDuration"
          :min="1"
          :max="3000"
          :step="1"
          placeholder="最小片段时长"
        >
          <template #suffix>秒</template>
        </n-input-number>
        <n-text depth="3" style="margin-left: 8px; font-size: 12px"> 增大过滤短片段 </n-text>
      </n-form-item>

      <n-form-item label="合并间隔(秒)" path="mergeGap">
        <n-input-number
          v-model:value="formValue.mergeGap"
          :min="0"
          :max="1200"
          :step="1"
          placeholder="合并间隔"
        >
          <template #suffix>秒</template>
        </n-input-number>
        <n-text depth="3" style="margin-left: 8px; font-size: 12px"> 增大合并相邻片段 </n-text>
      </n-form-item>

      <n-form-item label="静音阈值" path="silenceThreshold">
        <n-input-number
          v-model:value="formValue.silenceThreshold"
          :min="0"
          :max="100"
          :step="1"
          placeholder="静音阈值"
        />
      </n-form-item>
    </n-form>

    <template #action>
      <n-space justify="end">
        <n-button @click="handleReset">重置默认值</n-button>
        <n-button @click="handleCancel">取消</n-button>
        <n-button type="primary" @click="handleConfirm">确定</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
interface WaveformAnalyzerConfig {
  windowSize: number;
  windowOverlap: number;
  singingEnergyThreshold: number;
  talkingEnergyThreshold: number;
  minSegmentDuration: number;
  mergeGap: number;
  silenceThreshold: number;
}

interface Props {
  modelValue: WaveformAnalyzerConfig;
}

interface Emits {
  (e: "update:modelValue", value: WaveformAnalyzerConfig): void;
  (e: "confirm", value: WaveformAnalyzerConfig): void;
  (e: "cancel"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = defineModel<boolean>("visible", { default: false });

const defaultConfig: WaveformAnalyzerConfig = {
  windowSize: 4.0,
  windowOverlap: 0.5,
  singingEnergyThreshold: 1.1,
  talkingEnergyThreshold: 0.7,
  minSegmentDuration: 15.0,
  mergeGap: 20.0,
  silenceThreshold: 30,
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

const handleConfirm = () => {
  emit("update:modelValue", { ...formValue.value });
  emit("confirm", { ...formValue.value });
  visible.value = false;
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
