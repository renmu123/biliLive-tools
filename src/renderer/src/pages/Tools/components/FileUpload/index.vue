<!-- 上传文件 -->
<template>
  <div>
    <div class="flex justify-center align-center" style="margin-bottom: 20px; gap: 10px">
      <n-button @click="addVideo"> 添加视频 </n-button>
      <n-button type="primary" @click="upload"> 立即上传 </n-button>
      <n-button type="primary" @click="appendVideoVisible = true"> 续传 </n-button>
    </div>

    <PartArea v-if="fileList.length !== 0" v-model="fileList"></PartArea>
    <FileArea
      v-else
      :extensions="extensions"
      desc="请选择视频文件"
      @change="addOldVideos"
    ></FileArea>

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

import PartArea from "./components/PartArea.vue";
import FileArea from "@renderer/components/FileArea.vue";

import BiliSetting from "@renderer/components/BiliSetting.vue";
import AppendVideoDialog from "@renderer/components/AppendVideoDialog.vue";
import { useBili } from "@renderer/hooks";
import { useUserInfoStore, useAppConfig } from "@renderer/stores";

import { deepRaw, uuid } from "@renderer/utils";

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

const extensions = [
  "mp4",
  "flv",
  "avi",
  "wmv",
  "mov",
  "webm",
  "mpeg",
  "ts",
  "mpg",
  "rm",
  "rmvb",
  "mkv",
];

const addVideo = async () => {
  const files = await window.api.openFile({
    multi: true,
    filters: [
      {
        name: "file",
        extensions: extensions,
      },
      {
        name: "所有文件",
        extensions: ["*"],
      },
    ],
  });
  if (!files) return;
  const newFiles = files.map((file) => ({
    id: uuid(),
    title: window.path.parse(file).name,
    path: file,
    visible: false,
  }));
  fileList.value = [...fileList.value, ...newFiles];
};

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
  await window.api.bili.uploadVideo(
    userInfo.value.uid,
    deepRaw(fileList.value),
    deepRaw(presetOptions.value.config),
  );
  fileList.value = [];
};

const appendVideoVisible = ref(false);
const aid = ref();
const appendVideo = async () => {
  if (!aid.value) {
    return;
  }
  // await window.api.appendVideo(aid.value);

  const hasLogin = !!userInfo.value.uid;
  if (!hasLogin) {
    notice.error({
      title: `请先登录`,
      duration: 1000,
    });
    return;
  }

  if (fileList.value.length === 0) {
    notice.error({
      title: `请先选择一个文件`,
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

const addOldVideos = (data: any[]) => {
  fileList.value = data.map((item) => ({
    id: uuid(),
    title: item.name,
    path: item.path,
    visible: false,
  }));
};
</script>

<style scoped lang="less"></style>
