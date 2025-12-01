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

interface File {
  id: string;
  title: string;
  path: string;
  visible: boolean;
}

const fileList = defineModel<File[]>({ required: true });

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
const emits = defineEmits<{
  (event: "change", value: File[]): void;
}>();

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

  const newFiles = files
    .filter((file) => {
      return !fileList.value.some((item) => item.path === file);
    })
    .map((file) => ({
      id: uuid(),
      title: window.path.parse(file).name,
      path: file,
      visible: false,
    }));
  fileList.value = fileList.value.concat(newFiles);
};

watch(
  fileList,
  () => {
    emits("change", fileList.value);
  },
  { deep: true },
);

// 拖拽相关
function onDrop(files: globalThis.File[] | null) {
  if (window.isWeb) return;

  if (files) {
    const filePaths = Array.from(files).map((file) => window.api.common.getPathForFile(file));
    const newFiles = filePaths
      .filter((file) => {
        // 过滤已存在的文件
        if (fileList.value.some((item) => item.path === file)) return false;
        // 过滤不符合扩展名的文件
        const ext = window.path.extname(file).slice(1).toLowerCase();
        return props.extensions.some((allowedExt) => allowedExt.toLowerCase() === ext);
      })
      .map((file) => ({
        id: uuid(),
        title: window.path.parse(file).name,
        path: file,
        visible: false,
      }));
    fileList.value = fileList.value.concat(newFiles);
  }
}

function onOver(_files: globalThis.File[] | null, event: DragEvent) {
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
