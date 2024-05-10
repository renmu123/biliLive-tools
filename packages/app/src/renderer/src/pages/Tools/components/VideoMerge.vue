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
      <n-button type="primary" @click="convert"> 立即合并 </n-button>
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FileSelect from "@renderer/pages/Tools/components/FileUpload/components/FileSelect.vue";
import Tip from "@renderer/components/Tip.vue";
import { useAppConfig } from "@renderer/stores";
import { storeToRefs } from "pinia";

const notice = useNotification();
const { appConfig } = storeToRefs(useAppConfig());

const fileList = ref<{ id: string; title: string; path: string; visible: boolean }[]>([]);

const options = appConfig.value.tool.videoMerge;

const convert = async () => {
  if (fileList.value.length < 2) {
    notice.error({
      title: `至少选择2个文件`,
      duration: 1000,
    });
    return;
  }
  let filePath!: string;
  const { dir, name } = window.api.formatFile(fileList.value[0].path);
  filePath = window.path.join(dir, `${name}-合并.mp4`);

  if (options.saveOriginPath) {
    if (await window.api.exits(filePath)) {
      notice.error({
        title: `${filePath}-文件已存在，请手动选择路径`,
        duration: 1000,
      });
      const file = await getDir(filePath);
      if (!file) {
        return;
      }
      filePath = file;
    }
  } else {
    const file = await getDir(filePath);
    if (!file) {
      return;
    }
    filePath = file;
  }

  const files = fileList.value.map((file) => {
    return window.api.formatFile(file.path);
  });
  try {
    window.api.mergeVideos(toRaw(files), { ...toRaw(options), savePath: filePath });
    notice.warning({
      title: `已加入任务队列，可在任务列表中查看进度`,
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

async function getDir(defaultPath: string) {
  const path = await window.api.showSaveDialog({
    defaultPath: defaultPath,
    filters: [
      { name: "视频文件", extensions: ["mp4"] },
      { name: "所有文件", extensions: ["*"] },
    ],
  });
  return path;
}

const fileSelect = ref(null);
const addVideo = async () => {
  // @ts-ignore
  fileSelect.value.select();
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
