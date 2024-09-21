<template>
  <n-config-provider>
    <n-notification-provider>
      <n-dialog-provider>
        <router-view />
      </n-dialog-provider>
    </n-notification-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

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
</script>

<style lang="less"></style>
