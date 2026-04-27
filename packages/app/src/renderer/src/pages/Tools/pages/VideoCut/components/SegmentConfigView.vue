<template>
  <div class="config-view">
    <n-checkbox v-model:checked="hotProgressVisible">高能进度条</n-checkbox>
    <template v-if="hotProgressVisible">
      <div class="config-item">
        <span>采样间隔：</span>
        <n-input-number
          v-model:value="clientOptions.sampling"
          placeholder="单位秒"
          min="1"
          style="width: 120px"
        >
          <template #suffix> 秒 </template>
        </n-input-number>
      </div>
      <div class="config-item">
        <span>高度：</span>
        <n-input-number
          v-model:value="clientOptions.height"
          placeholder="单位像素"
          min="10"
          style="width: 120px"
        >
          <template #suffix> 像素 </template>
        </n-input-number>
      </div>
      <div class="config-item">
        <span>默认颜色：</span>
        <n-color-picker v-model:value="clientOptions.color" />
      </div>
      <div class="config-item">
        <span>覆盖颜色：</span>
        <n-color-picker v-model:value="clientOptions.fillColor" />
      </div>
    </template>
    <n-checkbox v-model:checked="showVideoTime" title="仅供参考，得加载弹幕才成"
      >显示时间戳</n-checkbox
    >
    <n-checkbox v-model:checked="danmaSearchMask">弹幕搜索栏遮罩</n-checkbox>
    <n-checkbox v-model:checked="waveformVisible">波形图</n-checkbox>
  </div>
</template>

<script setup lang="ts">
import { type PropType } from "vue";

const props = defineProps({
  clientOptions: {
    type: Object as PropType<{
      sampling: number;
      height: number;
      color: string;
      fillColor: string;
    }>,
    required: true,
  },
  hotProgressVisible: {
    type: Boolean,
    required: true,
  },
  showVideoTime: {
    type: Boolean,
    required: true,
  },
  danmaSearchMask: {
    type: Boolean,
    required: true,
  },
  waveformVisible: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits<{
  "update:hotProgressVisible": [value: boolean];
  "update:showVideoTime": [value: boolean];
  "update:danmaSearchMask": [value: boolean];
  "update:waveformVisible": [value: boolean];
}>();

const hotProgressVisible = computed({
  get: () => props.hotProgressVisible,
  set: (val) => emit("update:hotProgressVisible", val),
});

const showVideoTime = computed({
  get: () => props.showVideoTime,
  set: (val) => emit("update:showVideoTime", val),
});

const danmaSearchMask = computed({
  get: () => props.danmaSearchMask,
  set: (val) => emit("update:danmaSearchMask", val),
});

const waveformVisible = computed({
  get: () => props.waveformVisible,
  set: (val) => emit("update:waveformVisible", val),
});
</script>

<style scoped lang="less">
.config-view {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 6px;
  overflow-y: auto;

  .config-item {
    display: flex;
    align-items: center;
    gap: 8px;

    span {
      white-space: nowrap;
      font-size: 14px;
      flex-basis: 70px;
    }
  }
}
</style>
