<!-- 文件合并 -->
<template>
  <div>
    <div
      class="center"
      style="
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
      "
    >
      <span v-if="fileList.length !== 0" style="cursor: pointer; color: #958e8e" @click="clear"
        >清空</span
      >
      <n-button @click="addVideo"> 添加 </n-button>
      <n-button type="primary" @click="convert" title="立即合并(ctrl+enter)"> 立即合并 </n-button>
      <Tip
        tip="注意：并非所有容器都支持流复制。如果出现播放问题或未合并文件，则可能需要重新编码。"
        :size="26"
      ></Tip>
    </div>
    <FileSelect ref="fileSelect" v-model="fileList"></FileSelect>

    <div class="flex align-center column" style="margin-top: 10px">
      <div></div>
      <div style="margin-top: 10px">
        <n-checkbox v-model:checked="options.saveOriginPath"> 保存到原始文件夹 </n-checkbox>
        <n-checkbox v-model:checked="options.removeOrigin"> 完成后移除源文件 </n-checkbox>
        <n-checkbox v-model:checked="options.keepFirstVideoMeta"> 保留第一个视频元数据 </n-checkbox>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toReactive } from "@vueuse/core";
import hotkeys from "hotkeys-js";

import FileSelect from "@renderer/pages/Tools/pages/FileUpload/components/FileSelect.vue";
import Tip from "@renderer/components/Tip.vue";
import { useAppConfig } from "@renderer/stores";
import { formatFile } from "@renderer/utils";
import { taskApi } from "@renderer/apis";
import { showSaveDialog } from "@renderer/utils/fileSystem";

defineOptions({
  name: "VideoMerge",
});

const notice = useNotification();
const { appConfig } = storeToRefs(useAppConfig());

const fileList = ref<{ id: string; title: string; path: string; visible: boolean }[]>([]);

const options = toReactive(
  computed({
    get: () => appConfig.value.tool.videoMerge,
    set: (value) => {
      appConfig.value.tool.videoMerge = value;
    },
  }),
);

onActivated(() => {
  hotkeys("ctrl+enter", function () {
    convert();
  });
});
onDeactivated(() => {
  hotkeys.unbind();
});
onUnmounted(() => {
  hotkeys.unbind();
});

const convert = async () => {
  if (fileList.value.length < 2) {
    notice.error({
      title: `至少选择2个文件`,
      duration: 1000,
    });
    return;
  }
  let output: string | undefined = undefined;

  if (!options.saveOriginPath) {
    const { dir, name } = formatFile(fileList.value[0].path);
    const filePath = window.path.join(dir, `${name}-合并.mp4`);
    const file = await showSaveDialog({
      defaultPath: filePath,
    });
    if (!file) {
      return;
    }
    output = file;
  }

  try {
    taskApi.mergeVideos(
      fileList.value.map((item) => item.path),
      { output: output, ...options },
    );
    notice.warning({
      title: `已加入任务，可在任务队列中查看进度`,
      duration: 1000,
    });
  } catch (err) {
    notice.error({
      title: err as string,
      duration: 1000,
    });
  } finally {
    fileList.value = [];
  }
};

const fileSelect = ref<InstanceType<typeof FileSelect> | null>(null);
const addVideo = async () => {
  fileSelect.value?.select();
};

const clear = () => {
  fileList.value = [];
};
</script>

<style scoped lang="less">
.radio-group {
  :deep(.n-radio) {
    align-items: center;
  }
}
</style>
