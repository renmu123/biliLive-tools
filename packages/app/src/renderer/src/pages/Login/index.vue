<template>
  <n-card class="login-card">
    <n-space vertical style="text-align: center">
      <n-input v-model:value="api" placeholder="请输入API地址，如http://127.0.0.1:18010" />
      <n-input v-model:value="key" placeholder="密钥" type="password" />
      <p>接口最低1.6.0如果遇到功能无法访问，请尝试更新至最新版</p>
      <!-- 有个github链接 -->
      <div style="gap: 10px; display: flex">
        <n-button type="warning" style="flex: 1" @click="test">联通测试</n-button>
        <n-button type="primary" style="flex: 1" @click="login">确认</n-button>
      </div>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

import request from "@renderer/apis/request";
import { commonApi } from "@renderer/apis";

const notice = useNotification();
const router = useRouter();
const api = ref("");
const key = ref("");

const login = async () => {
  if (!api.value || !key.value) {
    notice.error({ title: "请输入API地址和密钥", duration: 1000 });
    return;
  }
  await commonApi.versionTest(api.value, key.value);
  window.localStorage.setItem("api", api.value);
  window.localStorage.setItem("key", key.value);
  router.push({ name: "Main" });

  request.defaults.baseURL = api.value;
};

const test = async () => {
  if (!api.value || !key.value) {
    notice.error({ title: "请输入API地址和密钥", duration: 1000 });
    return;
  }
  try {
    const serverVersion = await commonApi.versionTest(api.value, key.value);
    const webVersion = import.meta.env.VITE_VERSION;

    if (serverVersion != webVersion) {
      notice.warning({
        title: "版本不一致，请尽量保存一致，否则无法保证功能正常",
        content: `接口版本为：${serverVersion}，网页版本为：${webVersion}`,
        duration: 5000,
      });
    } else {
      notice.success({
        title: "成功",
        content: `接口版本为：${serverVersion}`,
        duration: 5000,
      });
    }
  } catch (error) {
    notice.error({ title: "无法连接，请检查配置", duration: 5000 });
  }
};

const apiStorage = window.localStorage.getItem("api");
// const keyStorage = window.localStorage.getItem("key");
api.value = apiStorage || import.meta.env.VITE_DEFAULT_SERVER || "http://127.0.0.1:18010";
// key.value = keyStorage || "";
</script>

<style lang="less">
body {
  @media screen and (prefers-color-scheme: dark) {
    background-color: #18181c;
  }
}
</style>

<style lang="less" scoped>
.login-card {
  width: 400px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
