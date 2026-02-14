<template>
  <n-select
    v-model:value="selectedValue"
    :options="presetOptions"
    :placeholder="placeholder"
    :loading="loading"
    clearable
    filterable
    @update:value="handleUpdate"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { ffmpegPresetApi, danmuPresetApi, videoPresetApi } from "@renderer/apis";

interface Props {
  presetType?: string; // 'ffmpeg', 'danmu', 'upload'
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  presetType: "ffmpeg",
  placeholder: "请选择预设",
});

const selectedValue = defineModel<string>("value");
const emit = defineEmits<{
  (e: "update:value", value: string | undefined): void;
}>();

const loading = ref(false);
const presetOptions = ref<Array<{ label: string; value: string }>>([]);

// 加载预设列表
const loadPresets = async () => {
  loading.value = true;
  try {
    let presets: any[] = [];

    switch (props.presetType) {
      case "ffmpeg":
        presets = await ffmpegPresetApi.list();
        break;
      case "danmu":
        presets = await danmuPresetApi.list();
        break;
      case "upload":
        presets = await videoPresetApi.list();
        break;
      default:
        console.warn(`Unknown preset type: ${props.presetType}`);
        return;
    }

    presetOptions.value = presets.map((preset) => ({
      label: preset.name || preset.id,
      value: preset.id,
    }));
  } catch (error) {
    console.error("Failed to load presets:", error);
    presetOptions.value = [];
  } finally {
    loading.value = false;
  }
};

// 监听 presetType 变化，重新加载
watch(
  () => props.presetType,
  () => {
    loadPresets();
  },
);

// 组件挂载时加载预设
onMounted(() => {
  loadPresets();
});

// 更新值
const handleUpdate = (value: string | null) => {
  emit("update:value", value || undefined);
};
</script>

<style scoped></style>
