<!-- 上传文件 -->
<template>
  <div>
    <div class="flex justify-center align-center" style="margin-bottom: 20px">
      <n-button type="primary" @click="convert"> 立即上传 </n-button>
      <n-button type="primary" @click="login"> 登录 </n-button>
    </div>

    <FileArea
      v-model="fileList"
      :extensions="['flv', 'mp4']"
      desc="请选择视频文件"
      :disabled="disabled"
      :max="1"
    ></FileArea>

    <div class="flex align-center column" style="margin-top: 10px"></div>

    <BiliLoginDialog v-model="loginDialogVisible" :succeess="loginStatus"> </BiliLoginDialog>
  </div>
</template>

<script setup lang="ts">
import FileArea from "@renderer/components/FileArea.vue";
import BiliLoginDialog from "@renderer/components/BiliLoginDialog.vue";
import type { File } from "../../../../../types";
// import { deepRaw } from "@renderer/utils";

const notice = useNotification();

const fileList = ref<
  (File & {
    percentage?: number;
  })[]
>([]);

const disabled = ref(false);

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
  disabled.value = true;
  notice.info({
    title: `开始上传`,
    duration: 3000,
  });
  try {
    //
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
    } else {
      // 手动关闭窗口
      loginStatus.value = "fail";
    }
  });
};

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
