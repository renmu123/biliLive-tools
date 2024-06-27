<template>
  <n-modal v-model:show="showModal" transform-origin="center">
    <n-card style="width: 800px" title="更新日志" :bordered="false">
      <div v-html="content"></div>
      <template #footer>
        <div style="text-align: right">
          <n-button type="primary" style="margin-left: 10px" @click="close"
            >我知道了(〃∀〃)</n-button
          >
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { marked } from "marked";
import changelog from "../../../../../../CHANGELOG.md?raw";

const showModal = defineModel<boolean>("visible", { required: true, default: false });

const content = marked.parse(changelog);
// console.log(content);

const confirm = async () => {
  const data = JSON.parse(localStorage.getItem("changelog") || "{}");
  const version = await window.api.appVersion();
  data[version] = true;
  localStorage.setItem("changelog", JSON.stringify(data));

  console.log("confirm");
};

const close = async () => {
  await confirm();
  showModal.value = false;
};

watchEffect(() => {
  if (!showModal.value) {
    confirm();
  }
});
</script>

<style scoped lang="less"></style>
