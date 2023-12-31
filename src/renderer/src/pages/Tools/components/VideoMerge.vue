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
      <n-button type="primary" @click="convert"> 立即合并 </n-button>
      <Tip
        tip="在这种模式下，音频/视频文件可以被流式复制，只要它们共享质量（大小、编解码器、比特率）。<br/>注意：并非所有容器都支持流复制。如果出现播放问题或未合并文件，则可能需要重新编码。"
        :size="26"
      ></Tip>
    </div>
    <FileArea v-model="fileList" :extensions="['flv', 'mp4']" desc="请选择视频文件"></FileArea>

    <div class="flex align-center column" style="margin-top: 10px">
      <div></div>
      <div style="margin-top: 10px">
        <n-checkbox v-model:checked="clientOptions.saveOriginPath">
          保存到原始文件夹并自动重命名
        </n-checkbox>
        <n-checkbox v-model:checked="options.removeOrigin"> 完成后移除源文件 </n-checkbox>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FileArea from "@renderer/components/FileArea.vue";
import Tip from "@renderer/components/Tip.vue";
import type { File, VideoMergeOptions } from "../../../../../types";

const notice = useNotification();

const fileList = ref<
  (File & {
    percentage?: number;
    percentageStatus?: "success" | "info" | "error";
    taskId?: string;
  })[]
>([]);

const options = ref<VideoMergeOptions>({
  savePath: "",
  removeOrigin: false, // 完成后移除源文件
});
const clientOptions = ref({
  saveOriginPath: false, // 保存到原始文件夹并自动重命名
});

const convert = async () => {
  if (fileList.value.length < 2) {
    notice.error({
      title: `至少选择2个文件`,
      duration: 3000,
    });
    return;
  }
  let filePath!: string;
  if (clientOptions.value.saveOriginPath) {
    const { dir, name } = fileList.value[0];
    filePath = window.path.join(dir, `${name}-mergered.mp4`);
    if (await window.api.exits(filePath)) {
      notice.error({
        title: `${filePath}-文件已存在，请手动选择路径`,
        duration: 3000,
      });
      console.log("文件已存在，请手动选择路径");
      const file = await getDir();
      if (!file) {
        return;
      }
      filePath = file;
    }
  } else {
    const file = await getDir();
    if (!file) {
      return;
    }
    filePath = file;
  }
  options.value.savePath = filePath;

  try {
    window.api.mergeVideos(toRaw(fileList.value), toRaw(options.value));
    notice.warning({
      title: `已加入任务队列，可在任务列表中查看进度`,
      duration: 3000,
    });
  } catch (err) {
    notice.error({
      title: err as string,
      duration: 3000,
    });
  } finally {
    fileList.value = [];
  }
};

async function getDir() {
  const path = await window.api.showSaveDialog({
    filters: [
      { name: "视频文件", extensions: ["mp4"] },
      { name: "所有文件", extensions: ["*"] },
    ],
  });
  return path;
}
</script>

<style scoped lang="less">
.radio-group {
  :deep(.n-radio) {
    align-items: center;
  }
}
</style>
