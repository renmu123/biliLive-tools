<template>
  <div class="config-section">
    <div v-show="waveformVisible" class="waveform-container">
      <div v-if="waveformLoading" class="waveform-loading">
        <n-spin size="small" />
        <span>波形图加载中...，请不要切换到其他页面</span>
      </div>
      <div id="waveform"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
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
  "update:waveformVisible": [value: boolean];
}>();

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
  background: var(--bg-secondary);

  .waveform-container {
    position: relative;
    min-height: 70px;
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
      color: var(--text-muted);
    }
  }
}

#waveform ::part(scroll) {
  position: relative;
  overflow-x: scroll !important;
  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(144, 147, 153, 0.3);
    border-radius: 3px;

    &:hover {
      background: rgba(144, 147, 153, 0.5);
    }
  }
}
#waveform ::part(region) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  line-height: 1.2;
}
</style>
