<template>
  <n-config-provider :theme="theme" :locale="zhCN" :date-locale="dateZhCN">
    <n-notification-provider>
      <n-dialog-provider>
        <router-view />
      </n-dialog-provider>
    </n-notification-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { darkTheme, lightTheme, useOsTheme, dateZhCN, zhCN } from "naive-ui";

const router = useRouter();

const isWeb = computed(() => window.isWeb);

if (!isWeb.value) {
  router.push({ name: "Home" });
} else {
  const apiStorage = window.localStorage.getItem("api");
  const keyStorage = window.localStorage.getItem("key");
  if (apiStorage && keyStorage) {
    router.push({ name: "Home" });
  } else {
    router.push({ name: "Login" });
  }
}

const osThemeRef = useOsTheme();
const theme = computed(() => {
  if (osThemeRef.value === "dark") {
    return darkTheme;
  } else {
    return lightTheme;
  }
});

// const theme = computed(() => {
//   if (appConfig.appConfig.theme === "system") {
//     // js检测系统主题
//     // const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
//     if (osThemeRef.value === "dark") {
//       return darkTheme;
//     } else {
//       return lightTheme;
//     }
//   } else if (appConfig.appConfig.theme === "dark") {
//     return darkTheme;
//   } else {
//     return lightTheme;
//   }
// });
</script>

<style lang="less"></style>
