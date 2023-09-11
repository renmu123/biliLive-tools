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
      <div>
        <n-form ref="formRef" label-placement="left" :label-width="80">
          <n-form-item label="log等级"
            ><n-select v-model:value="config.logLevel" :options="logLevelOptions" />
          </n-form-item>
        </n-form>
      </div>
      <template #footer>
        <div class="footer">
          <n-button class="btn" @click="close">取消</n-button>
          <n-button type="primary" class="btn" @click="saveConfig"> 确认 </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import type { AppConfig, LogLevel } from "../../../types";

const showModal = defineModel<boolean>({ required: true, default: false });

// @ts-ignore
const config = ref<AppConfig>({
  logLevel: "error",
});

const logLevelOptions = ref<{ label: string; value: LogLevel }[]>([
  { label: "debug", value: "debug" },
  { label: "info", value: "info" },
  { label: "warn", value: "warn" },
  { label: "error", value: "error" },
]);

const saveConfig = async () => {
  await window.api.saveAppConfig(toRaw(config.value));
  close();
};

const close = () => {
  showModal.value = false;
};

const getConfig = async () => {
  const data = await window.api.getAppConfig();
  config.value = data;
};

onMounted(async () => {
  await getConfig();
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
