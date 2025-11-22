<template>
  <div class="config-section">
    <div v-show="waveformVisible" class="waveform-container">
      <div v-if="waveformLoading" class="waveform-loading">
        <n-spin size="small" />
        <span>波形图加载中...，请不要切换到其他页面</span>
      </div>
      <div id="waveform"></div>
    </div>
    <div v-if="clientOptions.showSetting" class="config-content">
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
          <n-color-picker v-model:value="clientOptions.color" style="width: 90px" />
        </div>
        <div class="config-item">
          <n-color-picker v-model:value="clientOptions.fillColor" style="width: 90px" />
        </div>
      </template>
      <n-checkbox v-model:checked="showVideoTime" title="仅供参考，得加载弹幕才成"
        >显示时间戳</n-checkbox
      >
      <n-checkbox v-model:checked="danmaSearchMask">弹幕搜索栏遮罩</n-checkbox>
      <n-checkbox v-model:checked="waveformVisible">波形图</n-checkbox>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type PropType } from "vue";

const props = defineProps({
  clientOptions: {
    type: Object as PropType<{
      showSetting: boolean;
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
  waveformLoading: {
    type: Boolean,
    default: false,
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
.config-section {
  flex-shrink: 0;
  border-top: 1px solid var(--border-color);
  padding: 0px 0px;
  background: #f9fafb;

  @media screen and (prefers-color-scheme: dark) {
    background: #1e1e1e;
  }

  .waveform-container {
    position: relative;
    min-height: 64px;
  }

  .waveform-loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    z-index: 1;

    span {
      font-size: 14px;
      color: #666;

      @media screen and (prefers-color-scheme: dark) {
        color: #999;
      }
    }
  }

  .config-content {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
    padding: 0 10px;
    padding-bottom: 10px;
  }

  .config-item {
    display: flex;
    align-items: center;
    gap: 8px;

    span {
      white-space: nowrap;
      font-size: 14px;
    }
  }
}
</style>
