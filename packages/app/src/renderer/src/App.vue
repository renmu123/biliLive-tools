<template>
  <n-config-provider :theme="themeUI" :locale="zhCN" :date-locale="dateZhCN">
    <n-notification-provider>
      <n-dialog-provider>
        <router-view />
      </n-dialog-provider>
    </n-notification-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { dateZhCN, zhCN } from "naive-ui";
import { useTheme } from "@renderer/hooks/theme";

const router = useRouter();

const isWeb = computed(() => window.isWeb);

if (isWeb.value) {
  const apiStorage = window.localStorage.getItem("api");
  const keyStorage = window.localStorage.getItem("key");
  if (apiStorage && keyStorage) {
    // do nothing
  } else {
    router.push({ name: "Login" });
  }
}

// 获取当前 Vue 实例
const instance = getCurrentInstance();
if (instance) {
  console.log(instance.appContext.app);
  // 提供当前实例给子组件
  provide("currentApp", instance.appContext.app);
}

const { themeUI } = useTheme();
</script>

<style lang="less"></style>
