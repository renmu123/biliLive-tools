<!-- xml转换为ass弹框 -->
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
      <div class="content">
        <div class="container">
          <h2>请选择预设来进行转换</h2>
          <div class="flex" style="gap: 10px; align-items: center">
            <span style="flex: none">预设</span>
            <n-select
              v-model:value="danmuPresetId"
              :options="danmuPresetsOptions"
              placeholder="选择预设"
            />
          </div>

          <DanmuFactorySetting
            v-if="danmuPreset.id"
            v-model="danmuPreset.config"
            :simpled-mode="simpledMode"
            @change="handleDanmuChange"
          ></DanmuFactorySetting>
        </div>
      </div>
      <template #footer>
        <div class="footer">
          <n-checkbox v-model:checked="simpledMode"> 简易模式 </n-checkbox>

          <n-button class="btn" @click="showModal = false"> 取消 </n-button>
          <n-button type="primary" class="btn" @click="confirm"> 确认 </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { useStorage } from "@vueuse/core";

import { useDanmuPreset } from "@renderer/stores";
import type { DanmuConfig } from "@biliLive-tools/types";

const emits = defineEmits<{
  (event: "confirm", value: DanmuConfig): void;
}>();

const showModal = defineModel<boolean>({ required: true, default: false });

const confirm = () => {
  emits("confirm", danmuPreset.value.config);
  showModal.value = false;
};

const { danmuPresetsOptions, danmuPresetId, danmuPreset } = storeToRefs(useDanmuPreset());
const simpledMode = useStorage("simpledMode", true);

const handleDanmuChange = (value: DanmuConfig) => {
  danmuPreset.value.config = value;
};
</script>

<style scoped lang="less">
.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 10px;
  }
}

.container {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  gap: 10px;
  .card {
    padding: 10px;
    width: 100px;
    border-radius: 10px;
    background-color: #fff;
    justify-content: center;
    align-items: center;
    border: 1px solid #eee;
    position: relative;
    display: flex;
    flex-direction: column;
    .face {
      width: 80%;
    }
    .menu {
      position: absolute;
      bottom: 0px;
      right: 5px;
    }
  }
  .card.active::before {
    content: "正在使用";
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    color: #fff;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
  }
}

.section {
  padding: 10px;
  cursor: pointer;
  &:hover {
    background-color: #eee;
  }
}
</style>
