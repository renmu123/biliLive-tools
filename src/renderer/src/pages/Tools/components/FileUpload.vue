<!-- 上传文件 -->
<template>
  <div>
    <div class="flex justify-center align-center" style="margin-bottom: 20px">
      <n-button type="primary" @click="convert"> 立即上传 </n-button>
      <n-button type="primary" style="margin-left: 10px" @click="login"> 登录 </n-button>
    </div>
    <p class="flex justify-center align-center">{{ hasLogin ? "已获取到登录信息" : "" }}</p>

    <FileArea
      v-model="fileList"
      :extensions="['flv', 'mp4']"
      desc="请选择视频文件"
      :disabled="disabled"
    ></FileArea>

    <div class="" style="margin-top: 30px">
      <BiliSetting @change="handlePresetOptions"></BiliSetting>
    </div>

    <BiliLoginDialog v-model="loginDialogVisible" :succeess="loginStatus"> </BiliLoginDialog>
  </div>
</template>

<script setup lang="ts">
import FileArea from "@renderer/components/FileArea.vue";
import BiliSetting from "@renderer/components/BiliSetting.vue";
import BiliLoginDialog from "@renderer/components/BiliLoginDialog.vue";

import type { File, BiliupPreset } from "../../../../../types";
import { deepRaw } from "@renderer/utils";

const notice = useNotification();

const fileList = ref<
  (File & {
    percentage?: number;
  })[]
>([]);

const disabled = ref(false);
const hasLogin = ref(false);

// @ts-ignore
const presetOptions: Ref<BiliupPreset> = ref({});

const handlePresetOptions = (preset) => {
  presetOptions.value = preset;
};

const convert = async () => {
  const hasLogin = await window.api.checkBiliCookie();
  if (!hasLogin) {
    notice.error({
      title: `请先登录`,
      duration: 3000,
    });
    return;
  }

  if (fileList.value.length === 0) {
    notice.error({
      title: `至少选择一个文件`,
      duration: 3000,
    });
    return;
  }
  await window.api.validateBiliupConfig(deepRaw(presetOptions.value.config));
  disabled.value = true;
  notice.info({
    title: `开始上传`,
    duration: 3000,
  });
  try {
    await window.api.uploadVideo(
      toRaw(fileList.value.map((file) => file.path)),
      deepRaw(presetOptions.value.config),
    );
    window.api.onBiliUploadClose((_event, code) => {
      console.log("window close", code);
      if (code == 0) {
        notice.success({
          title: `上传成功`,
          duration: 3000,
        });
      } else {
        notice.error({
          title: `上传失败`,
          duration: 3000,
        });
      }
    });
  } finally {
    disabled.value = false;
  }
};

const loginDialogVisible = ref(false);
const loginStatus = ref<"start" | "success" | "fail">("start");
const login = async () => {
  notice.info({
    title: `此为实验性功能，不为稳定性做出保证`,
    duration: 3000,
  });
  loginStatus.value = "start";
  loginDialogVisible.value = true;
  window.api.biliLogin();
  // 打开登录窗口;
  window.api.onBiliLoginClose((_event, code) => {
    console.log("window close", code);

    if (code == 0) {
      // 登录成功
      loginStatus.value = "success";
      hasLogin.value = true;
    } else {
      // 手动关闭窗口
      loginStatus.value = "fail";
    }
  });
};

onMounted(async () => {
  const hasCookie = await window.api.checkBiliCookie();
  hasLogin.value = hasCookie;
});

// async function getDir() {
//   const path = await window.api.openDirectory();
//   options.value.savePath = path;
// }
</script>

<style scoped lang="less">
.radio-group {
  :deep(.n-radio) {
    align-items: center;
  }
}
</style>
