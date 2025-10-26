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
      <n-button type="primary" @click="convert" title="立即修复(ctrl+enter)"> 立即修复 </n-button>
    </div>
    <FileSelect ref="fileSelect" v-model="fileList" :extensions="['flv']"></FileSelect>

    <div class="flex align-center column" style="margin-top: 10px">
      <div></div>
      <div style="margin-top: 10px">
        <div style="text-align: center; margin-bottom: 10px">
          <n-radio-group v-model:value="options.type" class="radio-group">
            <n-radio value="bililive">录播姬</n-radio>
            <n-radio value="mesio">mesio</n-radio>
          </n-radio-group>
        </div>

        <n-radio-group v-model:value="options.saveRadio">
          <n-space class="flex align-center column">
            <n-radio :value="1"> 保存到原始文件夹 </n-radio>
            <n-radio :value="2"> </n-radio>
            <n-input
              v-model:value="options.savePath"
              placeholder="选择文件夹"
              style="width: 300px"
              :title="options.savePath"
            />
            <n-icon size="30" style="margin-left: -10px" class="pointer" @click="getDir">
              <FolderOpenOutline />
            </n-icon>
          </n-space>
        </n-radio-group>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toReactive } from "@vueuse/core";
import hotkeys from "hotkeys-js";

import FileSelect from "@renderer/pages/Tools/pages/Burn/components/FileSelect.vue";
import Tip from "@renderer/components/Tip.vue";
import { useAppConfig } from "@renderer/stores";
import { formatFile } from "@renderer/utils";
import { taskApi } from "@renderer/apis";
import { showSaveDialog, showDirectoryDialog } from "@renderer/utils/fileSystem";

defineOptions({
  name: "FlvRepair",
});

const notice = useNotification();
const { appConfig } = storeToRefs(useAppConfig());

const fileList = ref<{ id: string; title: string; videoPath: string; danmakuPath?: string }[]>([]);

const options = toReactive(
  computed({
    get: () => appConfig.value.tool.flvRepair,
    set: (value) => {
      appConfig.value.tool.flvRepair = value;
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
  const result = await taskApi.checkMergeVideos(fileList.value.map((item) => item.videoPath));
  if (result.errors.length > 0) {
    notice.error({
      content: result.errors.join("\n"),
      duration: 5000,
    });
    return;
  }
  if (result.warnings.length > 0) {
    notice.warning({
      content: result.warnings.join("\n"),
      duration: 5000,
    });
  }
  let videoOutput: string | undefined = undefined;

  const { dir, name } = formatFile(fileList.value[0].videoPath);
  const filePath = window.path.join(dir, `${name}-合并.mp4`);
  const file = await showSaveDialog({
    defaultPath: filePath,
  });
  if (!file) {
    return;
  }
  videoOutput = file;

  try {
    // taskApi.mergeVideos(
    //   fileList.value.map((item) => item.videoPath),
    //   { output: videoOutput, ...options },
    // );
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

async function getDir() {
  let dir: string | undefined = await showDirectoryDialog({
    defaultPath: options.savePath,
  });

  if (!dir) return;
  options.savePath = dir;
  options.saveRadio = 2;
}
</script>

<style scoped lang="less">
.radio-group {
  :deep(.n-radio) {
    align-items: center;
  }
}
</style>
