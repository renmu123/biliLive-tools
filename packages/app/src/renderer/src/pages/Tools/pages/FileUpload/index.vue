<!-- 上传文件 -->
<template>
  <div>
    <div class="flex justify-center align-center" style="margin-bottom: 20px; gap: 10px">
      <span v-if="fileList.length !== 0" style="cursor: pointer; color: #958e8e" @click="clear"
        >清空</span
      >
      <n-button @click="addVideo"> 添加 </n-button>
      <n-button type="primary" @click="upload" title="立即上传(ctrl+enter)"> 立即上传 </n-button>
      <n-button type="primary" @click="appendVideoVisible = true"> 续传 </n-button>
      <n-checkbox v-model:checked="options.removeOriginAfterUploadCheck">
        审核通过后移除源文件
      </n-checkbox>
    </div>
    <FileSelect ref="fileSelect" v-model="fileList" @change="fileChange"></FileSelect>

    <n-divider />
    <div class="" style="margin-top: 30px">
      <BiliSetting
        ref="biliSettingRef"
        v-model="options.uploadPresetId"
        @change="handlePresetOptions"
      ></BiliSetting>
    </div>

    <AppendVideoDialog
      v-model:visible="appendVideoVisible"
      v-model="aid"
      @confirm="appendVideo"
    ></AppendVideoDialog>
  </div>
</template>

<script setup lang="ts">
import { toReactive } from "@vueuse/core";
import { NButton, useNotification } from "naive-ui";

import FileSelect from "@renderer/pages/Tools/pages/FileUpload/components/FileSelect.vue";
import BiliSetting from "@renderer/components/BiliSetting.vue";
import AppendVideoDialog from "@renderer/components/AppendVideoDialog.vue";
import { useBili } from "@renderer/hooks";
import { useUserInfoStore, useAppConfig } from "@renderer/stores";
import { biliApi } from "@renderer/apis";
import hotkeys from "hotkeys-js";

import { deepRaw } from "@renderer/utils";

defineOptions({
  name: "Upload",
});

const { userInfo } = storeToRefs(useUserInfoStore());
const { handlePresetOptions, presetOptions } = useBili();
const { appConfig } = storeToRefs(useAppConfig());
const notice = useNotification();

const options = toReactive(
  computed({
    get: () => appConfig.value.tool.upload,
    set: (value) => {
      appConfig.value.tool.upload = value;
    },
  }),
);

const fileList = ref<
  {
    id: string;
    title: string;
    path: string;
    visible: boolean;
  }[]
>([]);

onActivated(() => {
  hotkeys("ctrl+enter", function () {
    upload();
  });
});
onDeactivated(() => {
  hotkeys.unbind();
});
onUnmounted(() => {
  hotkeys.unbind();
});

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
  await biliApi.validUploadParams(deepRaw(presetOptions.value.config));
  notice.info({
    title: `开始上传`,
    duration: 1000,
  });
  await biliApi.upload({
    uid: userInfo.value.uid!,
    videos: deepRaw(fileList.value),
    config: deepRaw(presetOptions.value.config),
    options: {
      removeOriginAfterUploadCheck: options.removeOriginAfterUploadCheck,
    },
  });
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
  await biliApi.upload({
    uid: userInfo.value.uid!,
    vid: Number(aid.value),
    videos: deepRaw(fileList.value),
    config: {
      ...deepRaw(presetOptions.value.config),
    },
    options: {
      removeOriginAfterUploadCheck: options.removeOriginAfterUploadCheck,
    },
  });
  fileList.value = [];
};

const fileSelect = ref<InstanceType<typeof FileSelect> | null>(null);
const addVideo = async () => {
  fileSelect.value?.select();
};
const clear = () => {
  fileList.value = [];
};

const biliSettingRef = ref<InstanceType<typeof BiliSetting> | null>(null);
// 只提示一次，清空提示
const hasNotice = ref(false);
const notification = useNotification();
const fileChange = (files: any) => {
  if (files.length === 0) {
    hasNotice.value = false;
    return;
  }
  if (hasNotice.value) return;

  const name = files[0].title;
  if (biliSettingRef.value?.getTitle() === name) return;
  const data = JSON.parse(localStorage.getItem("notShowAgain") || "{}");
  if (data["bili-upload-title"] === true) return;

  hasNotice.value = true;
  const n = notification.create({
    title: `是否将文件名改为视频标题？`,
    keepAliveOnHover: true,
    duration: 3000,
    action: () =>
      h(
        "div",
        {
          style: "display: flex; gap: 10px; justify-content: center; align-items: center;",
        },
        {
          default: () => [
            h(
              NButton,
              {
                type: "primary",
                onClick: () => {
                  biliSettingRef.value?.setTitle(name);
                  n.destroy();
                },
              },
              {
                default: () => "确认",
              },
            ),
            h(
              NButton,
              {
                text: true,
                type: "error",
                onClick: () => {
                  data["bili-upload-title"] = true;
                  localStorage.setItem("notShowAgain", JSON.stringify(data));
                  n.destroy();
                },
              },
              {
                default: () => "不再提示",
              },
            ),
          ],
        },
      ),
  });
};
</script>

<style scoped lang="less"></style>
