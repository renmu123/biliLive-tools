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
      <DanmuFactorySetting :simpled-mode="simpledMode" @change="handleChange"></DanmuFactorySetting>

      <template #footer>
        <div class="footer">
          <n-checkbox v-model:checked="simpledMode"> 简易模式 </n-checkbox>
          <n-button class="btn" @click="close">取消</n-button>
          <n-button type="primary" class="btn" @click="saveConfig"> 确认 </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import type { DanmuConfig } from "../../../types";
import DanmuFactorySetting from "./DanmuFactorySetting.vue";

const showModal = defineModel<boolean>({ required: true, default: false });
const simpledMode = ref(true);

// @ts-ignore
const config: Ref<DanmuConfig> = ref({
  resolution: [],
  msgboxsize: [],
  msgboxpos: [],
});

const handleChange = (value: DanmuConfig) => {
  config.value = value;
};

const saveConfig = async () => {
  console.log(config.value);

  await window.api.saveDanmuConfig(toRaw(config.value));
  close();
};

const close = () => {
  showModal.value = false;
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
