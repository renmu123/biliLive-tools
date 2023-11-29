<!-- 上传文件 -->
<template>
  <div>
    <div class="flex justify-center align-center" style="margin-bottom: 20px; gap: 10px">
      <n-button type="primary" @click="upload"> 立即上传 </n-button>
      <n-button type="primary" @click="appendVideoVisible = true"> 续传 </n-button>
    </div>

    <FileArea
      v-model="fileList"
      :extensions="['flv', 'mp4']"
      desc="请选择视频文件"
      :disabled="disabled"
    ></FileArea>

    <div class="" style="margin-top: 30px">
      <BiliSetting @change="handlePresetOptions"></BiliSetting>
    </div>

    <AppendVideoDialog
      v-model:visible="appendVideoVisible"
      v-model="aid"
      @confirm="appendVideo"
    ></AppendVideoDialog>
  </div>
</template>

<script setup lang="ts">
import FileArea from "@renderer/components/FileArea.vue";
import BiliSetting from "@renderer/components/BiliSetting.vue";
import AppendVideoDialog from "@renderer/components/AppendVideoDialog.vue";
import { useBili } from "@renderer/hooks";

import type { File } from "../../../../../types";
import { deepRaw } from "@renderer/utils";

const { handlePresetOptions, presetOptions } = useBili();
const notice = useNotification();

const fileList = ref<
  (File & {
    percentage?: number;
  })[]
>([]);

const disabled = ref(false);

const upload = async () => {
  const hasLogin = await window.api.bili.checkCookie();
  if (!hasLogin) {
    notice.error({
      title: `请点击左侧头像处进行登录`,
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
  await window.api.bili.validUploadParams(deepRaw(presetOptions.value.config));
  disabled.value = true;
  notice.info({
    title: `开始上传`,
    duration: 3000,
  });
  try {
    await window.api.bili.uploadVideo(
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

const appendVideoVisible = ref(false);
const aid = ref();
const appendVideo = async () => {
  if (!aid.value) {
    return;
  }
  // await window.api.appendVideo(aid.value);

  const hasLogin = await window.api.bili.checkCookie();
  if (!hasLogin) {
    notice.error({
      title: `请先登录`,
      duration: 3000,
    });
    return;
  }

  if (fileList.value.length === 0) {
    notice.error({
      title: `请先选择一个文件`,
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
    await window.api.bili.appendVideo(toRaw(fileList.value.map((file) => file.path)), {
      ...deepRaw(presetOptions.value.config),
      vid: aid.value,
    });
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
</script>

<style scoped lang="less"></style>
