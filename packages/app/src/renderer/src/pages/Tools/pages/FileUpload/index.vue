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
import { biliApi, commonApi } from "@renderer/apis";
import hotkeys from "hotkeys-js";

import { deepRaw, replaceExtName, buildRoomLink } from "@renderer/utils";

defineOptions({
  name: "Upload",
});

const { userInfo } = storeToRefs(useUserInfoStore());
const { handlePresetOptions, presetOptions } = useBili();
const appConfigStore = useAppConfig();
const { appConfig } = storeToRefs(appConfigStore);

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

const formatPartTitleTemplate = async (
  partTitleTemplate: string | undefined,
  videos: (typeof fileList)["value"],
  startIndex: number,
) => {
  const hasPartTitleTemplate = partTitleTemplate && !!partTitleTemplate.trim();
  if (hasPartTitleTemplate) {
    await Promise.all(
      videos.map(async (video, index) => {
        try {
          const parseResult = await commonApi.parseMeta({
            videoFilePath: video.path,
            danmaFilePath: replaceExtName(video.path, ".xml"),
          });
          if (
            parseResult.title &&
            parseResult.username &&
            parseResult.roomId &&
            parseResult.startTimestamp
          ) {
            const previewTitle = await biliApi.formatWebhookPartTitle(partTitleTemplate, {
              title: parseResult.title,
              username: parseResult.username,
              time: new Date((parseResult.startTimestamp ?? 0) * 1000).toISOString(),
              roomId: parseResult.roomId,
              filename: window.path.basename(video.path),
              index: startIndex + index,
            });
            video.title = previewTitle;
            notice.success({
              title: `已解析并替换标题为：${previewTitle}`,
              duration: 6000,
            });
          }
        } catch (e) {
          notice.warning({
            title: `尝试解析视频文件 ${video.title} 信息失败，继续上传`,
            duration: 2000,
          });
        }
      }),
    );
  }
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
  const uploadConfig = deepRaw(presetOptions.value.config) as typeof presetOptions.value.config;
  await biliApi.validUploadParams(uploadConfig);

  // 如果上传标题中存在占位符，或者稿件类型为转载，则转载来源为空时，获取第一个文件的调用解析接口获取数据进行填充
  if (uploadConfig.title.includes("{{")) {
    try {
      const parseResult = await commonApi.parseMeta({
        videoFilePath: fileList.value[0].path,
        danmaFilePath: replaceExtName(fileList.value[0].path, ".xml"),
      });
      if (
        parseResult.title &&
        parseResult.username &&
        parseResult.roomId &&
        parseResult.startTimestamp
      ) {
        if (uploadConfig.title.includes("{{")) {
          const previewTitle = await biliApi.formatWebhookTitle(uploadConfig.title, {
            title: parseResult.title,
            username: parseResult.username,
            time: new Date((parseResult.startTimestamp ?? 0) * 1000).toISOString(),
            roomId: parseResult.roomId,
            filename: window.path.basename(fileList.value[0].path),
          });
          uploadConfig.title = previewTitle;
          notice.success({
            title: `已解析并替换标题为：${previewTitle}`,
            duration: 6000,
          });
        }
      }
    } catch (e) {
      notice.warning({
        title: `尝试解析视频文件信息失败，继续上传`,
        duration: 2000,
      });
    }
  }

  if (uploadConfig.copyright === 2 && !uploadConfig.source) {
    const parseResult = await commonApi.parseMeta({
      videoFilePath: fileList.value[0].path,
      danmaFilePath: replaceExtName(fileList.value[0].path, ".xml"),
    });
    if (parseResult.platform) {
      uploadConfig.source = buildRoomLink(parseResult.platform, parseResult.roomId ?? "") ?? "";
    }

    if (!uploadConfig.source) {
      notice.error({
        title: `稿件类型为转载时转载来源不能为空`,
        duration: 1000,
      });
      return;
    }
  }

  const videos = deepRaw(fileList.value);

  if (fileList.value.length > 1) {
    // 非续传时首P标题已由稿件标题处理，这里从第2P开始套用分P模板
    await formatPartTitleTemplate(uploadConfig.partTitleTemplate, videos.slice(1), 2);
  }

  await biliApi.upload({
    uid: userInfo.value.uid!,
    videos,
    config: uploadConfig,
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

  const uploadConfig = deepRaw(presetOptions.value.config);
  const videos = deepRaw(fileList.value);
  // 续传未获取已上传数量，先从 1 起
  await formatPartTitleTemplate(uploadConfig.partTitleTemplate, videos, 1);

  await biliApi.upload({
    uid: userInfo.value.uid!,
    vid: Number(aid.value),
    videos,
    config: {
      ...uploadConfig,
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
  if (appConfig.value.biliUploadFileNameType === "never") return;
  if (appConfig.value.biliUploadFileNameType === "always") {
    biliSettingRef.value?.setTitle(name);
    return;
  }
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
                  appConfigStore.set("biliUploadFileNameType", "never");
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
