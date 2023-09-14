<!-- bili设置 -->
<template>
  <div>
    <n-form ref="formRef" label-width="120px" label-placement="left" label-align="right">
      <n-form-item label="预设">
        <n-select
          v-model:value="presetName"
          :options="presetsOptions"
          @update:value="handlePresetChange"
        />
      </n-form-item>
      <n-divider />

      <n-form-item label="视频标题">
        <n-input
          v-model:value="options.config.title"
          placeholder="请输入视频标题"
          :allow-input="noSideSpace"
          clearable
          maxlength="80"
          show-count
        />
      </n-form-item>
      <n-form-item label="视频简介">
        <n-input
          v-model:value="options.config.desc"
          placeholder="请输入视频简介"
          :allow-input="noSideSpace"
          clearable
          maxlength="250"
          show-count
          type="textarea"
          :autosize="{
            minRows: 2,
          }"
        />
      </n-form-item>
      <n-form-item label="稿件类型">
        <n-radio-group v-model:value="options.config.copyright" name="radiogroup">
          <n-space>
            <n-radio :value="1"> 自制 </n-radio>
            <n-radio :value="2"> 转载 </n-radio>
          </n-space>
        </n-radio-group>
      </n-form-item>
      <n-form-item v-if="options.config.copyright === 2" label="转载来源">
        <n-input
          v-model:value="options.config.source"
          placeholder="注明视频来源网址"
          :allow-input="noSideSpace"
          clearable
          maxlength="200"
          show-count
        />
      </n-form-item>
      <n-form-item label="标签">
        <n-dynamic-tags v-model:value="options.config.tag" :max="12" />
      </n-form-item>

      <n-form-item label="分区">
        <n-cascader
          v-model:value="options.config.tid"
          placeholder="没啥用的值"
          label-field="name"
          value-field="id"
          :options="areaData"
          check-strategy="child"
          filterable
        />
      </n-form-item>

      <n-form-item label="杜比音效">
        <n-checkbox v-model:checked="options.config.dolby" :checked-value="1" :unchecked-value="0">
        </n-checkbox>
      </n-form-item>
      <n-form-item label="Hi-Res无损音质">
        <n-checkbox
          v-model:checked="options.config.lossless_music"
          :checked-value="1"
          :unchecked-value="0"
        >
        </n-checkbox>
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import type { BiliupPreset } from "../../../types";
import areaData from "@renderer/assets/area.json";

// const formData = defineModel<BiliupConfig>({ required: true });

// const props = withDefaults(
//   defineProps<{
//     succeess?: "start" | "success" | "fail";
//   }>(),
//   {
//     succeess: "start",
//   },
// );

const presetName = ref<string>("default");

const presets = ref<BiliupPreset[]>([]);

const getPresets = async () => {
  presets.value = await window.api.readBiliupPresets();
  console.log(presets.value);
};
const presetsOptions = computed(() => {
  return presets.value.map((item) => {
    return {
      label: item.name,
      value: item.id,
    };
  });
});

// @ts-ignore
const options: Ref<BiliupPreset> = ref({
  config: {},
});
const handlePresetChange = (value: string) => {
  const preset = presets.value.find((item) => item.id === value);
  if (preset) {
    options.value = preset;
  } else {
    // @ts-ignore
    options.value = {
      // @ts-ignore
      config: {},
    };
  }
};

const noSideSpace = (value: string) => !value.startsWith(" ") && !value.endsWith(" ");

console.log(areaData);

onMounted(async () => {
  await getPresets();
  handlePresetChange(presetName.value);

  const res = await window.api.validateBiliupTag("色情");
  console.log(res);
});
</script>

<style scoped lang="less">
.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 10px;
  }
}
</style>
