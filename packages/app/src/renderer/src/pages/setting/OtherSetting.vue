<template>
  <div class="">
    <n-form label-placement="left" :label-width="150">
      <n-form-item label="主题"
        ><n-select v-model:value="config.theme" :options="themeOptions" />
      </n-form-item>
      <n-form-item label="菜单栏显示" v-if="!isWeb">
        <n-switch v-model:value="config.menuBarVisible" @click="toggleMenuBarVisible" />
      </n-form-item>
      <n-form-item>
        <template #label>
          <Tip
            text="录制页面额外请求"
            tip="进入录制页面时不再额外请求查询接口，减少风控可能，关闭后未监听的直播间无法获取封面等相关信息"
          ></Tip>
        </template>
        <n-switch v-model:value="config.requestInfoForRecord" />
      </n-form-item>
      <n-form-item>
        <template #label>
          <Tip text="B站上传文件名">控制文件名弹框是否出现</Tip>
        </template>
        <n-radio-group v-model:value="config.biliUploadFileNameType">
          <n-radio value="ask">询问</n-radio>
          <n-radio value="always">始终</n-radio>
          <n-radio value="never">从不</n-radio>
        </n-radio-group>
      </n-form-item>
      <n-form-item v-if="!isWeb">
        <template #label>
          <Tip text="切片独立窗口" tip="客户端使用子窗口打开切片页面"></Tip>
        </template>
        <n-switch v-model:value="config.cutPageInNewWindow" />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import type { AppConfig, Theme } from "@biliLive-tools/types";

const config = defineModel<AppConfig>("data", {
  default: () => {},
});
const isWeb = computed(() => window.isWeb);

const themeOptions = ref<{ label: string; value: Theme }[]>([
  { label: "自动", value: "system" },
  { label: "浅色", value: "light" },
  { label: "深色", value: "dark" },
]);

const toggleMenuBarVisible = async () => {
  if (!isWeb.value) return;
  // 延迟一点时间，等待config.menuBarVisible更新
  setTimeout(() => {
    window.api.common.setMenuBarVisible(config.value.menuBarVisible);
  }, 0);
};
</script>

<style scoped lang="less">
.item {
  display: flex;
}
</style>
