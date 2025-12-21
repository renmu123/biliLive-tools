<template>
  <div
    ref="dropZoneRef"
    :class="{ dragging: isOverDropZone }"
    style="border: 1px dashed rgb(224, 224, 230); border-radius: 4px; transition: border-color 0.2s"
  >
    <PartArea
      v-if="fileList.length !== 0"
      v-model="fileList"
      :sort="props.sort"
      :placeholder="props.inputPlaceholder"
      @add-danmaku="addDanmaku"
    ></PartArea>
    <div v-else class="empty-area" :class="{ dragging: isOverDropZone }" @click="select">
      <div style="margin-bottom: 12px">
        <n-icon size="48" :depth="3">
          <ArchiveIcon />
        </n-icon>
      </div>
      <n-text style="font-size: 16px">点击或拖拽文件到该区域</n-text>
      <p v-if="props.areaPlaceholder" style="margin: 8px 0 0 0">
        {{ props.areaPlaceholder }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import PartArea from "./PartArea.vue";
import showDirectoryDialog from "@renderer/components/showDirectoryDialog";
import { useDropZone } from "@vueuse/core";
import { ArchiveOutline as ArchiveIcon } from "@vicons/ionicons5";

import { supportedVideoExtensions, uuid } from "@renderer/utils";

const fileList = defineModel<
  {
    id: string;
    title: string;
    videoPath: string;
    danmakuPath?: string;
  }[]
>({ required: true });

const props = withDefaults(
  defineProps<{
    sort?: boolean;
    inputPlaceholder?: string;
    areaPlaceholder?: string;
    extensions?: string[];
  }>(),
  {
    sort: true,
    inputPlaceholder: "请输入",
    areaPlaceholder: "请选择视频文件",
    extensions: () => supportedVideoExtensions,
  },
);

const dropZoneRef = ref<HTMLElement | null>(null);

const select = async () => {
  let files: string[] | undefined = [];
  if (window.isWeb) {
    files = await showDirectoryDialog({
      type: "file",
      multi: true,
      exts: props.extensions,
    });
  } else {
    files = await window.api.openFile({
      multi: true,
      filters: [
        {
          name: "file",
          extensions: props.extensions,
        },
        {
          name: "所有文件",
          extensions: ["*"],
        },
      ],
    });
  }

  if (!files) return;
  if (files.length === 0) return;

  handleFiles(files);
};

const handleFiles = (files: string[]) => {
  const danmuFiles: string[] = [];
  const videoFiles: string[] = [];
  files.forEach((file) => {
    if (file.endsWith(".xml") || file.endsWith(".ass")) {
      danmuFiles.push(file);
    } else {
      videoFiles.push(file);
    }
  });

  const newFiles = videoFiles
    .filter((file) => {
      return !fileList.value.some((item) => item.videoPath === file);
    })
    .map((file) => ({
      id: uuid(),
      title: window.path.parse(file).name,
      videoPath: file,
      danmakuPath: "",
    }));

  const allFiles = fileList.value.concat(newFiles);
  const danmuItems = danmuFiles.map((file) => {
    return {
      path: file,
      name: window.path.parse(file).name,
    };
  });

  if (danmuItems) {
    allFiles.forEach((item) => {
      if (item.danmakuPath) return;
      const videoName = window.path.parse(item.videoPath).name;

      const danmuItem = danmuItems.find((item) => item.name === videoName);
      if (danmuItem) {
        item.danmakuPath = danmuItem.path;
      }
    });
  }

  fileList.value = allFiles;
};

const addDanmaku = async (index: number) => {
  let files: string[] | undefined = [];
  const extensions = ["xml", "ass"];
  if (window.isWeb) {
    files = await showDirectoryDialog({
      type: "file",
      multi: false,
      exts: extensions,
    });
  } else {
    files = await window.api.openFile({
      multi: false,
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
  }
  console.log("files", files);

  if (!files) return;
  if (files.length === 0) return;

  fileList.value[index].danmakuPath = files[0];
};

// 拖拽相关
function onDrop(files: File[] | null) {
  if (window.isWeb) return;

  if (files) {
    const filePaths = Array.from(files).map((file) => window.api.common.getPathForFile(file));
    handleFiles(filePaths);
  }
}

function onOver(_files: File[] | null, event: DragEvent) {
  if (window.isWeb) return;
  event.dataTransfer!.dropEffect = "copy";
}

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop,
  onOver,
});

defineExpose({
  select,
});
</script>

<style scoped>
.empty-area {
  height: 200px;
  border: 1px dashed rgb(224, 224, 230);
  border-radius: 3px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  cursor: pointer;
  transition: border-color 0.2s;
}

.empty-area:hover,
.empty-area.dragging {
  border-color: #18a058;
}

.dragging {
  border-color: #18a058 !important;
}
</style>
