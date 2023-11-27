<!-- bili设置 -->
<template>
  <div>
    <n-form ref="formRef" label-width="120px" label-placement="left" label-align="right">
      <n-form-item label="预设">
        <n-select
          v-model:value="presetId"
          :options="presetsOptions"
          @update:value="handlePresetChange"
        />
      </n-form-item>
      <n-divider />

      <n-form-item label="视频标题">
        <n-input
          v-model:value="options.config.title"
          placeholder="请输入视频标题"
          clearable
          maxlength="80"
          show-count
        />
      </n-form-item>
      <n-form-item label="视频简介">
        <n-input
          v-model:value="options.config.desc"
          placeholder="请输入视频简介"
          clearable
          maxlength="250"
          show-count
          type="textarea"
          :autosize="{
            minRows: 2,
          }"
        />
      </n-form-item>
      <n-form-item label="空间动态">
        <n-input
          v-model:value="options.config.dynamic"
          placeholder="请输入空间动态"
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
        <n-dynamic-tags
          v-model:value="options.config.tag"
          :max="12"
          @update:value="handleTagChange"
        />
      </n-form-item>

      <n-form-item label="分区">
        <n-cascader
          v-model:value="options.config.tid"
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
        <n-checkbox v-model:checked="options.config.hires" :checked-value="1" :unchecked-value="0">
        </n-checkbox>
      </n-form-item>
    </n-form>

    <div style="text-align: right">
      <n-button v-if="options.id !== 'default'" type="error" @click="deletePreset">删除</n-button>
      <n-button type="primary" style="margin-left: 10px" @click="saveAnotherPreset"
        >另存为</n-button
      >
      <n-button type="primary" style="margin-left: 10px" @click="savePreset">保存</n-button>
    </div>

    <n-modal v-model:show="nameModelVisible">
      <n-card style="width: 600px" :bordered="false" role="dialog" aria-modal="true">
        <n-input v-model:value="tempPresetName" placeholder="请输入预设名称" maxlength="15" />
        <template #footer>
          <div style="text-align: right">
            <n-button @click="nameModelVisible = false">取消</n-button>
            <n-button type="primary" style="margin-left: 10px" @click="saveAnotherPresetConfirm"
              >确认</n-button
            >
          </div>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import type { BiliupPreset } from "../../../types";
import { deepRaw, uuid } from "@renderer/utils";
import { useConfirm } from "@renderer/hooks";
// @ts-ignore
import areaData from "@renderer/assets/area.json";
import { cloneDeep } from "lodash-es";

const confirm = useConfirm();
const emits = defineEmits<{
  (event: "change", value: BiliupPreset): void;
}>();

const presetId = ref<string>("default");

const presets = ref<BiliupPreset[]>([]);

const getPresets = async () => {
  presets.value = await window.api.readBiliupPresets();
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

onMounted(async () => {
  await getPresets();
  handlePresetChange(presetId.value);
});

const notice = useNotification();
const handleTagChange = async (tags: string[]) => {
  if (tags.length !== 0) {
    const res = await window.biliApi.checkTag(tags[tags.length - 1]);

    if (res.code !== 0) {
      notice.error({
        title: res.message,
        duration: 500,
      });
      options.value.config.tag.splice(-1);
    }
  }
};

const nameModelVisible = ref(false);
const tempPresetName = ref("");
const saveAnotherPreset = () => {
  tempPresetName.value = "";
  nameModelVisible.value = true;
};

const saveAnotherPresetConfirm = async () => {
  if (!tempPresetName.value) {
    notice.warning({
      title: "预设名称不得为空",
      duration: 500,
    });
    return;
  }
  const preset = cloneDeep(options.value);
  preset.id = uuid();
  preset.name = tempPresetName.value;

  await _savePreset(preset);
  nameModelVisible.value = false;
  notice.success({
    title: "保存成功",
    duration: 1000,
  });
  await getPresets();
  presetId.value = preset.id;
};

const deletePreset = async () => {
  const status = await confirm.warning({
    content: "是否确认删除该预设？",
  });
  if (!status) return;

  const id = options.value.id;
  await window.api.deleteBiliupPreset(id);
  await getPresets();
  presetId.value = "default";
  handlePresetChange("default");
};

const savePreset = async () => {
  await _savePreset(options.value);
  notice.success({
    title: "保存成功",
    duration: 1000,
  });
};

const _savePreset = async (data: BiliupPreset) => {
  await window.api.saveBiliupPreset(deepRaw(data));
};

watch(
  () => options.value,
  (value) => {
    emits("change", value);
  },
  {
    deep: true,
  },
);
</script>

<style scoped lang="less">
.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 10px;
  }
}
</style>
