<template>
  <n-modal v-model:show="showModal" :mask-closable="false" auto-focus>
    <n-card
      style="width: calc(100% - 60px)"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
      class="card"
    >
      <div v-if="props.showPreset" class="flex" style="gap: 10px; align-items: center">
        <span style="flex: none">预设</span>
        <n-select v-model:value="presetId" :options="danmuPresetsOptions" placeholder="选择预设" />
      </div>

      <DanmuFactorySetting
        v-if="config.id"
        v-model="config.config"
        :simpled-mode="simpledMode"
      ></DanmuFactorySetting>

      <template #footer>
        <div class="footer">
          <n-checkbox v-model:checked="simpledMode" style="margin-right: auto">
            简易配置
          </n-checkbox>
          <n-button
            v-if="config.id !== 'default'"
            ghost
            quaternary
            class="btn"
            type="error"
            @click="deletePreset"
            >删除</n-button
          >
          <n-button class="btn" @click="close">取消</n-button>
          <!-- <n-button type="primary" class="btn" @click="rename">重命名</n-button> -->
          <!-- <n-button type="primary" class="btn" @click="saveAs">另存为</n-button> -->
          <!-- <n-button type="primary" class="btn" @click="saveConfig">保存</n-button> -->
          <ButtonGroup :options="actionBtns" @click="handleActionClick">保存</ButtonGroup>
        </div>
      </template>

      <n-modal v-model:show="nameModelVisible">
        <n-card style="width: 600px" :bordered="false" role="dialog" aria-modal="true">
          <n-input
            v-model:value="tempPresetName"
            placeholder="请输入预设名称"
            maxlength="15"
            @keyup.enter="saveConfirm"
          />
          <template #footer>
            <div style="text-align: right">
              <n-button @click="nameModelVisible = false">取消</n-button>
              <n-button type="primary" style="margin-left: 10px" @click="saveConfirm"
                >确认</n-button
              >
            </div>
          </template>
        </n-card>
      </n-modal>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { useStorage } from "@vueuse/core";

import DanmuFactorySetting from "./DanmuFactorySetting.vue";
import ButtonGroup from "@renderer/components/ButtonGroup.vue";
import { useConfirm } from "@renderer/hooks";
import { uuid } from "@renderer/utils";
import { useDanmuPreset, useAppConfig } from "@renderer/stores";
import { danmuPresetApi } from "@renderer/apis";
import { usePresetFile } from "@renderer/hooks/danmuPreset";

import { cloneDeep } from "lodash-es";

import type { DanmuPreset, DanmuConfig } from "@biliLive-tools/types";

interface Props {
  showPreset?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showPreset: false,
});

const showModal = defineModel<boolean>("visible", { required: true, default: false });
const presetId = defineModel<string>({ required: true, default: "default" });
const emits = defineEmits<{
  (event: "confirm", value: DanmuConfig): void;
}>();

const notice = useNotification();
const confirmDialog = useConfirm();
const { getDanmuPresets, getDanmuPreset } = useDanmuPreset();
const { danmuPresetsOptions } = storeToRefs(useDanmuPreset());

const simpledMode = useStorage("simpledMode", false);

// @ts-ignore
const config: Ref<DanmuPreset> = ref({
  id: "",
  name: "",
  config: {},
});

const saveConfig = async () => {
  await danmuPresetApi.save(toRaw(config.value));
  confirm();
};

const confirm = () => {
  getDanmuPresets();
  getDanmuPreset();
  emits("confirm", config.value.config);
  close();
};
const close = () => {
  showModal.value = false;
};

watch(
  () => showModal.value,
  async (val) => {
    if (val) {
      config.value = await danmuPresetApi.get(presetId.value);
    }
  },
);
watch(
  () => presetId.value,
  async (val) => {
    config.value = await danmuPresetApi.get(val);
  },
);

const rename = async () => {
  tempPresetName.value = config.value.name;
  isRename.value = true;
  nameModelVisible.value = true;
};

const saveAs = async () => {
  isRename.value = false;
  tempPresetName.value = "";
  nameModelVisible.value = true;
};

const { appConfig } = storeToRefs(useAppConfig());

const deletePreset = async () => {
  let ids = Object.entries(appConfig.value.webhook.rooms || {}).map(([, value]) => {
    return value?.danmuPreset;
  });
  ids.push(appConfig.value.webhook?.danmuPreset);
  ids = ids.filter((id) => id !== undefined && id !== "");

  const msg = ids.includes(presetId.value)
    ? "该预设正在被使用中，删除后使用该预设的功能将失效，是否确认删除？"
    : "是否确认删除该预设？";

  const [status] = await confirmDialog.warning({
    content: msg,
  });
  if (!status) return;
  await danmuPresetApi.remove(presetId.value);
  presetId.value = "default";
  confirm();
};

const nameModelVisible = ref(false);
const tempPresetName = ref("");
const isRename = ref(false);

const saveConfirm = async () => {
  if (!tempPresetName.value) {
    notice.warning({
      title: "预设名称不得为空",
      duration: 2000,
    });
    return;
  }
  const preset = cloneDeep(config.value);
  if (!isRename.value) preset.id = uuid();
  preset.name = tempPresetName.value;

  await danmuPresetApi.save(preset);
  nameModelVisible.value = false;
  notice.success({
    title: "保存成功",
    duration: 1000,
  });
  confirm();
};

const actionBtns = ref([
  { label: "另存为", key: "saveAnother" },
  { label: "重命名", key: "rename" },
  { label: "导出", key: "export" },
  { label: "导入", key: "import" },
]);

const { exportPreset, importPreset } = usePresetFile();
const handleActionClick = async (key?: string | number) => {
  switch (key) {
    case "saveAnother":
      saveAs();
      break;
    case "rename":
      rename();
      break;
    case "export":
      exportPreset(config.value.config, config.value.name);
      break;
    case "import":
      importPreset();
      break;
    case undefined:
      saveConfig();
      break;
  }
};
</script>

<style scoped lang="less">
.footer {
  display: flex;
  // justify-content: flex-end;
  gap: 10px;
  align-items: center;
}
</style>
