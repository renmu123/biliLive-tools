<!-- 上传文件 -->
<template>
  <div>
    <div class="flex justify-center align-center" style="margin-bottom: 20px; gap: 10px">
      <span v-if="fileList.length !== 0" style="cursor: pointer; color: #958e8e" @click="clear"
        >清空</span
      >
      <n-button @click="addVideo"> 添加 </n-button>
      <n-button type="primary" @click="upload"> 立即上传 </n-button>
      <n-button type="primary" @click="appendVideoVisible = true"> 续传 </n-button>
    </div>
    <FileSelect ref="fileSelect" v-model="fileList"></FileSelect>

    <n-divider />
    <div class="" style="margin-top: 30px">
      <BiliSetting v-model="options.uploadPresetId" @change="handlePresetOptions"></BiliSetting>
    </div>

    <AppendVideoDialog
      v-model:visible="appendVideoVisible"
      v-model="aid"
      @confirm="appendVideo"
    ></AppendVideoDialog>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";

import FileSelect from "@renderer/pages/Tools/pages/FileUpload/components/FileSelect.vue";
import BiliSetting from "@renderer/components/BiliSetting.vue";
import AppendVideoDialog from "@renderer/components/AppendVideoDialog.vue";
import { useBili } from "@renderer/hooks";
import { useUserInfoStore, useAppConfig } from "@renderer/stores";

import { deepRaw } from "@renderer/utils";

const { userInfo } = storeToRefs(useUserInfoStore());
const { handlePresetOptions, presetOptions } = useBili();
const { appConfig } = storeToRefs(useAppConfig());
const notice = useNotification();

const options = appConfig.value.tool.upload;

const fileList = ref<
  {
    id: string;
    title: string;
    path: string;
    visible: boolean;
  }[]
>([]);

const upload = async () => {
  const hasLogin = !!userInfo.value.uid;
  if (!hasLogin) {
    notice.error({
      title: `请点击左侧头像处先进行登录`,
      duration: 1000,
    });
    return;
  }

  if (fileList.value.length === 0) {
    notice.error({
      title: `至少选择一个文件`,
      duration: 1000,
    });
    return;
  }
  await window.api.bili.validUploadParams(deepRaw(presetOptions.value.config));
  notice.info({
    title: `开始上传`,
    duration: 1000,
  });
  // console.log(fileList.value);
  const res = await window.api.bili.uploadVideo(
    userInfo.value.uid,
    deepRaw(fileList.value),
    deepRaw(presetOptions.value.config),
  );
  console.log(res);
  fileList.value = [];
};

const appendVideoVisible = ref(false);
const aid = ref();
const appendVideo = async () => {
  if (!aid.value) {
    return;
  }

  const hasLogin = !!userInfo.value.uid;
  if (!hasLogin) {
    notice.error({
      title: `请点击左侧头像处先进行登录`,
      duration: 1000,
    });
    return;
  }

  if (fileList.value.length === 0) {
    notice.error({
      title: `至少选择一个文件`,
      duration: 1000,
    });
    return;
  }

  notice.info({
    title: `开始上传`,
    duration: 1000,
  });
  await window.api.bili.appendVideo(userInfo.value.uid, deepRaw(fileList.value), {
    ...deepRaw(presetOptions.value.config),
    vid: aid.value,
  });
  fileList.value = [];
};

const fileSelect = ref(null);
const addVideo = async () => {
  // @ts-ignore
  fileSelect.value.select();
};
const clear = () => {
  fileList.value = [];
};
</script>

<style scoped lang="less"></style>
