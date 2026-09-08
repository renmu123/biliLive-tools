<template>
  <n-modal v-model:show="visible">
    <n-card
      style="width: min(1100px, 92vw)"
      :bordered="false"
      role="dialog"
      aria-modal="true"
      :title="props.title"
    >
      <div style="max-height: 75vh; overflow: auto; padding-right: 4px">
        <BiliSetting
          ref="biliSettingRef"
          mode="edit-only"
          :preset-id="props.presetId"
          :show-action-buttons="false"
          @change="handleChange"
        />
      </div>

      <template #footer>
        <div style="text-align: right">
          <n-button @click="visible = false">取消</n-button>
          <n-button
            type="primary"
            style="margin-left: 10px"
            :loading="saving"
            :disabled="!props.presetId"
            @click="handleSave"
          >
            保存
          </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import BiliSetting from "./BiliSetting.vue";

import type { BiliupPreset } from "@biliLive-tools/types";

const props = withDefaults(
  defineProps<{
    presetId?: string;
    title?: string;
  }>(),
  {
    title: "编辑上传预设",
  },
);

const visible = defineModel<boolean>("show", {
  default: false,
});

const emits = defineEmits<{
  (event: "saved", value: BiliupPreset): void;
}>();

const biliSettingRef = ref<InstanceType<typeof BiliSetting> | null>(null);
const currentPreset = ref<BiliupPreset | null>(null);
const saving = ref(false);

const handleChange = (value: BiliupPreset) => {
  currentPreset.value = value;
};

const handleSave = async () => {
  if (!biliSettingRef.value) {
    return;
  }

  saving.value = true;
  try {
    const saved = await biliSettingRef.value.savePreset();
    if (!saved) {
      return;
    }
    if (currentPreset.value) {
      emits("saved", currentPreset.value);
    }
    visible.value = false;
  } finally {
    saving.value = false;
  }
};
</script>
