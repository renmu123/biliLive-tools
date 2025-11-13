<template>
  <n-card class="login-card">
    <h3 style="text-align: center">
      {{ isFullstack ? "请配置密钥进行登录" : "请配置API地址和密钥进行登录" }}
    </h3>

    <n-space vertical style="text-align: center">
      <n-input
        v-if="!isFullstack"
        v-model:value="api"
        placeholder="请输入API地址，如http://127.0.0.1:18010"
      />
      <n-input v-model:value="key" placeholder="密钥" type="password" />
      <div style="gap: 10px; display: flex">
        <n-button type="warning" style="flex: 1" @click="test">联通测试</n-button>
        <n-button type="primary" style="flex: 1" @click="login">确认</n-button>
      </div>
    </n-space>
  </n-card>
  <a
    href="https://github.com/renmu123/biliLive-tools"
    target="_blank"
    class="github-corner"
    aria-label="View source on Github"
  >
    <svg viewBox="0 0 250 250" aria-hidden="true">
      <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path>
      <path
        d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2"
        fill="currentColor"
        style="transform-origin: 130px 106px"
        class="octo-arm"
      ></path>
      <path
        d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z"
        fill="currentColor"
        class="octo-body"
      ></path>
    </svg>
  </a>
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
  window.localStorage.removeItem("api");
  const serverVersion = await commonApi.versionTest(api.value, key.value);
  if (serverVersion.includes('id="app"')) {
    notice.error({ title: "不要使用前端地址啊！！", duration: 1000 });
    return;
  }
  window.localStorage.setItem("api", api.value);
  window.localStorage.setItem("key", key.value);
  router.push({ name: "Home" });

  request.defaults.baseURL = api.value;
};

const test = async () => {
  if (!api.value || !key.value) {
    notice.error({ title: "请输入API地址和密钥", duration: 1000 });
    return;
  }
  try {
    window.localStorage.removeItem("api");
    const serverVersion = await commonApi.versionTest(api.value, key.value);
    if (serverVersion.includes('id="app"')) {
      notice.error({ title: "不要使用前端地址啊！！", duration: 1000 });
      return;
    }
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
    if (error === "Forbidden") {
      notice.error({ title: "密钥错误", duration: 5000 });
      return;
    }
    notice.error({ title: "无法连接，请检查配置", duration: 5000 });
  }
};

// const apiStorage = window.localStorage.getItem("api");
// const keyStorage = window.localStorage.getItem("key");
api.value = import.meta.env.VITE_DEFAULT_SERVER || "http://127.0.0.1:18010";
// key.value = keyStorage || "";
const isFullstack = ref(window.isFullstack);
if (window.localStorage.getItem("api")) {
  window.localStorage.removeItem("api");
  window.location.reload();
}
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

.github-corner {
  transition: transform 0.25s ease-out;
  position: fixed;
  top: 0;
  right: 0;
  border: 0;
  z-index: 100;
  width: 100px;
  height: 100px;

  svg {
    color: #fff;
    fill: var(--theme-color, #42b983);
  }
}
</style>
