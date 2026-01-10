<template>
  <input
    ref="input"
    v-model="modelValue"
    v-on-click-outside="enterOut"
    class="input"
    :placeholder="props.placeholder"
    @focus="enterIn"
  />
</template>

<script setup lang="ts">
import { vOnClickOutside } from "@vueuse/components";

interface Props {
  placeholder?: string;
  validate?: (value: string) => boolean;
  update?: (value: string) => string;
}

const modelValue = defineModel<string>({ required: true });

const props = withDefaults(defineProps<Props>(), {
  placeholder: "请输入",
  validate: () => true,
});

const input = ref<HTMLInputElement | null>(null);

const tempText = ref("");

const enterIn = () => {
  console.log("enterIn");
  tempText.value = modelValue.value;
};
const enterOut = () => {
  if (props.update) {
    modelValue.value = props.update(modelValue.value);
  }
  if (!props.validate(modelValue.value)) {
    modelValue.value = tempText.value;
  }
};
</script>

<style scoped lang="less">
.input {
  width: 100%;
  border: none;
  cursor: pointer;
  box-sizing: border-box;
  padding: 0;
  font-size: 15px;
  caret-color: var(--color-primary);
  background: none;
  color: var(--text-primary);
}
.input:focus {
  outline: none;
}
</style>
