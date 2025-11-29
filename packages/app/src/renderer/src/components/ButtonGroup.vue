<template>
  <div class="button-group" :class="props.size ?? 'medium'">
    <n-button
      type="primary"
      style="border-radius: 3px 0px 0px 3px"
      @click="handleSelect()"
      :size="props.size ?? 'medium'"
    >
      <slot></slot>
    </n-button>
    <n-dropdown :trigger="props.trigger" :options="props.options" @select="handleSelect">
      <span class="icon-container">
        <n-icon :size="props.size === 'small' ? 14 : 18" class="icon">
          <CaretDownOutline class="cart-down-icon"></CaretDownOutline>
        </n-icon>
      </span>
    </n-dropdown>
  </div>
</template>

<script setup lang="ts">
import { CaretDownOutline } from "@vicons/ionicons5";

interface Props {
  trigger?: "click" | "hover";
  options: { key: string | number; label: string | number; disabled?: boolean }[];
  size?: "small" | "medium";
}

const props = withDefaults(defineProps<Props>(), {
  trigger: "hover",
  options: () => [],
});
const emits = defineEmits<{
  (event: "click", value?: string | number): void;
}>();

const handleSelect = (key?: string | number) => {
  emits("click", key as string);
};
</script>

<style scoped lang="less">
.button-group {
  display: inline-flex;
  align-items: stretch;
}

.button-group&.small {
  .icon-container {
    width: 14px;
  }
}

.icon-container {
  border-radius: 0px 3px 3px 0px;
  position: relative;
  width: 22px;
  cursor: pointer;
  border-left: 1px solid #358457;
  padding: 0 4px;
  background: #18a058;
  &:hover {
    background: #36ad6a;
  }

  .icon {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
  .cart-down-icon {
    color: white;
  }
}

@media screen and (prefers-color-scheme: dark) {
  .icon-container {
    border-left: 1px solid #358457;
    background: #63e2b7;
    &:hover {
      background: #7fe7c4;
    }
    .cart-down-icon {
      color: white;
    }
  }
}
</style>
