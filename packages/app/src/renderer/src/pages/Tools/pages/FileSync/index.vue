<!-- 文件同步 -->
<template>
  <div>
    <div class="flex justify-center align-center" style="margin-bottom: 20px; gap: 10px">
      <span style="cursor: pointer; color: #958e8e" @click="clear">清空</span>
      <n-button @click="addFiles"> 添加 </n-button>
      <n-button type="primary" @click="sync" title="立即同步(ctrl+enter)"> 立即上传 </n-button>
    </div>

    <FileSelect ref="fileSelect" v-model="fileList" :sort="false" :extensions="['*']"></FileSelect>

    <div class="flex align-center" style="margin-top: 10px; gap: 10px; justify-content: center">
      <n-select
        v-model:value="options.syncType"
        :options="syncConfigOptions"
        placeholder="选择同步网盘"
        style="width: 140px; display: inline-block"
      />
      <n-input
        v-model:value="options.targetPath"
        placeholder="请输入目标路径"
        style="width: 200px"
      />
      <n-checkbox v-model:checked="options.removeOrigin"> 完成后移除源文件 </n-checkbox>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toReactive } from "@vueuse/core";
import FileSelect from "@renderer/pages/Tools/pages/FileUpload/components/FileSelect.vue";

import { useAppConfig } from "@renderer/stores";
import { syncApi } from "@renderer/apis";
import hotkeys from "hotkeys-js";

const notice = useNotification();
const { appConfig } = storeToRefs(useAppConfig());

const options = toReactive(
  computed({
    get: () => appConfig.value.tool.fileSync,
    set: (value) => {
      appConfig.value.tool.fileSync = value;
    },
  }),
);

const fileList = ref<{ id: string; title: string; path: string; visible: boolean }[]>([]);

onActivated(() => {
  hotkeys("ctrl+enter", function () {
    sync();
  });
});
onDeactivated(() => {
  hotkeys.unbind();
});
onUnmounted(() => {
  hotkeys.unbind();
});

const syncConfigOptions = computed(() => {
  return [
    {
      label: "百度网盘",
      value: "baiduPCS",
    },
    {
      label: "阿里云盘",
      value: "aliyunpan",
    },
    {
      label: "alist",
      value: "alist",
    },
    {
      label: "123网盘",
      value: "pan123",
    },
    // {
    //   label: "本地复制",
    //   value: "copy",
    // },
  ];
});

const sync = async () => {
  if (!options.syncType) {
    notice.error({
      title: `请选择同步网盘`,
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

  for (const file of fileList.value) {
    await syncApi.sync({
      file: file.path,
      type: options.syncType,
      targetPath: options.targetPath,
      options: {
        removeOrigin: options.removeOrigin,
      },
    });
  }

  fileList.value = [];
};

const clear = () => {
  fileList.value = [];
};

const fileSelect = ref<InstanceType<typeof FileSelect> | null>(null);
const addFiles = async () => {
  fileSelect.value?.select();
};
</script>

<style scoped lang="less"></style>
