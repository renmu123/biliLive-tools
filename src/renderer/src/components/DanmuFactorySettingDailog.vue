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
      <DanmuFactorySetting
        v-if="config.id"
        v-model="config.config"
        :simpled-mode="simpledMode"
      ></DanmuFactorySetting>

      <template #footer>
        <div class="footer">
          <n-checkbox v-model:checked="simpledMode"> 简易模式 </n-checkbox>
          <n-button class="btn" @click="close">取消</n-button>
          <n-button v-if="config.id !== 'default'" class="btn" type="error" @click="deletePreset"
            >删除</n-button
          >
          <n-button type="primary" class="btn" @click="rename">重命名</n-button>
          <n-button type="primary" class="btn" @click="saveAs">另存为</n-button>
          <n-button type="primary" class="btn" @click="saveConfig">确认</n-button>
        </div>
      </template>

      <n-modal v-model:show="nameModelVisible">
        <n-card style="width: 600px" :bordered="false" role="dialog" aria-modal="true">
          <n-input v-model:value="tempPresetName" placeholder="请输入预设名称" maxlength="15" />
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
import type { DanmuPreset } from "../../../types";
import DanmuFactorySetting from "./DanmuFactorySetting.vue";
import { useConfirm } from "@renderer/hooks";
import { uuid } from "@renderer/utils";
import { cloneDeep } from "lodash-es";

const showModal = defineModel<boolean>("visible", { required: true, default: false });
const presetId = defineModel<string>({ required: true, default: "default" });
const emits = defineEmits<{
  confirm: [];
}>();

const notice = useNotification();
const confirmDialog = useConfirm();

console.log(presetId.value);
const simpledMode = ref(true);

// @ts-ignore
const config: Ref<DanmuPreset> = ref({
  id: "",
  name: "",
  config: {},
});

const saveConfig = async () => {
  await window.api.danmu.savePreset(toRaw(config.value));
  confirm();
};

const confirm = () => {
  emits("confirm");
  close();
};
const close = () => {
  showModal.value = false;
};

watch(
  () => showModal.value,
  async (val) => {
    if (val) {
      config.value = await window.api.danmu.getPreset(presetId.value);
    }
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
const deletePreset = async () => {
  const status = await confirmDialog.warning({
    content: "是否确认删除该预设？",
  });
  if (!status) return;
  await window.api.danmu.deletePreset(presetId.value);
  confirm();
  presetId.value = "default";
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

  await window.api.danmu.savePreset(preset);
  nameModelVisible.value = false;
  notice.success({
    title: "保存成功",
    duration: 1000,
  });
  confirm();
};
</script>

<style scoped lang="less">
.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 10px;
  }
}
</style>
