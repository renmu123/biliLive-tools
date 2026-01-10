<template>
  <button
    class="text-button"
    :class="[type ? `text-button--${type}` : '', { 'text-button--loading': loading }]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="loading-spinner"></span>
    <span class="button-content">
      <slot></slot>
    </span>
  </button>
</template>

<script setup lang="ts">
defineProps({
  type: {
    type: String,
    default: "default", // 可选值：default, primary, danger
    validator: (value: string) => ["default", "primary", "danger"].includes(value),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["click"]);

const handleClick = (event: MouseEvent) => {
  emit("click", event);
};
</script>

<style scoped lang="less">
.text-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 13px;
  border-radius: 4px;
  position: relative;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  outline: none;
  height: 24px; // 固定高度
  min-width: 0; // 允许宽度灵活变化

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  // 默认样式
  &.text-button--default {
    color: #606266;
    &:hover:not(:disabled) {
      background-color: rgba(0, 0, 0, 0.05);
      color: #409eff;
    }
  }

  // Primary 类型（蓝色）
  &.text-button--primary {
    color: #2196f3;
    &:hover:not(:disabled) {
      background-color: rgba(33, 150, 243, 0.1);
    }
  }

  // Danger 类型（红色）
  &.text-button--danger {
    color: #ff4757;
    &:hover:not(:disabled) {
      background-color: rgba(255, 71, 87, 0.1);
    }
  }

  // Loading 状态
  &.text-button--loading {
    padding-left: 24px; // 为loading图标留出空间

    .button-content {
      visibility: visible; // 保持内容可见
    }
  }
}

.button-content {
  position: relative;
  z-index: 1;
  line-height: 1; // 确保文本垂直居中
}

.loading-spinner {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border: 2px solid currentColor;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 0.8s linear infinite;
  z-index: 2;
}

@keyframes spin {
  to {
    transform: translateY(-50%) rotate(360deg);
  }
}

// 添加暗黑模式支持
[data-theme="dark"] {
  .text-button {
    &.text-button--default {
      color: #c0c4cc;
      &:hover:not(:disabled) {
        background-color: rgba(255, 255, 255, 0.05);
        color: #88bbff;
      }
    }

    &.text-button--primary {
      color: #64b5f6;
      &:hover:not(:disabled) {
        background-color: rgba(33, 150, 243, 0.15);
      }
    }

    &.text-button--danger {
      color: #ff6b6b;
      &:hover:not(:disabled) {
        background-color: rgba(255, 71, 87, 0.15);
      }
    }
  }
}
</style>
