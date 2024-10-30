<template>
  <div
    ref="fileSelectArea"
    class="file-selet"
    :class="{
      dragging: isOverDropZone,
    }"
    :style="{
      height: props.height,
      cursor: props.disabled ? 'not-allowed' : 'pointer',
    }"
    @click="handleFileSelect"
  >
    <div v-if="fileList.length" class="files">
      <div v-for="(file, index) in fileList" :key="file.path" class="file">
        <div class="file-content">
          <span class="name">{{ file.filename }}</span>
          <n-icon
            size="20"
            :depth="3"
            class="remove-icon"
            :class="{
              'in-progress': props.disabled,
            }"
            @click.stop="removeItem(index)"
          >
            <CloseIcon />
          </n-icon>
        </div>
      </div>
    </div>
    <div v-else class="empty">
      <div style="margin-bottom: 12px">
        <n-icon size="48" :depth="3">
          <archive-icon />
        </n-icon>
      </div>
      <n-text style="font-size: 16px"> 点击或拖拽文件到该区域 </n-text>
      <p v-if="desc" style="margin: 8px 0 0 0">
        {{ props.desc }}
      </p>
      <template v-else>
        <p style="margin: 8px 0 0 0">
          <slot name="desc"></slot>
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArchiveOutline as ArchiveIcon, CloseOutline as CloseIcon } from "@vicons/ionicons5";
import { useDropZone } from "@vueuse/core";
import showDirectoryDialog from "@renderer/components/showDirectoryDialog";
import { formatFile } from "@renderer/utils";

import type { File as newFile } from "@biliLive-tools/types";

const props = withDefaults(
  defineProps<{
    extensions?: Array<string>;
    desc?: string;
    height?: string;
    disabled?: boolean;
    max?: number;
  }>(),
  {
    height: "200px",
    extensions: () => ["*"],
    disabled: false,
  },
);
const emits = defineEmits<{
  change: any[];
}>();

const fileList = defineModel<newFile[]>({ default: () => [] });
const fileSelectArea = ref<HTMLElement | null>(null);
const isWeb = computed(() => window.isWeb);

const handleFileSelect = async () => {
  if (props.disabled) return;
  let files: string[] | undefined = [];
  if (isWeb.value) {
    files = await showDirectoryDialog({
      type: "file",
      multi: true,
      exts: props.extensions,
    });
  } else {
    files = await window.api.openFile({
      multi: props.max === 1 ? false : true,
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
  let items = files
    .map(formatFile)
    .filter((file) => !fileList.value.map((item) => item.path).includes(file.path));

  if (props.max) {
    items = items.slice(0, props.max - fileList.value.length);
  }
  fileList.value.push(...items);
  emits("change", fileList.value);
};

const removeItem = (index: number) => {
  if (props.disabled) return;
  fileList.value.splice(index, 1);
  emits("change", fileList.value);
};

function onDrop(files: File[] | null) {
  if (window.isWeb) return;

  if (files) {
    let items = Array.from(files)
      .map((file) => formatFile(window.api.common.getPathForFile(file)))
      .filter((file) => !fileList.value.map((item) => item.path).includes(file.path))
      .filter((file) => {
        if (props.extensions.includes("*")) return true;
        if (props.extensions && props.extensions.length) {
          return props.extensions.includes(file.ext.slice(1));
        }
        return true;
      });

    if (props.max) {
      items = items.slice(0, props.max - fileList.value.length);
    }
    fileList.value.push(...items);
    emits("change", fileList.value);
  }
}
const onOver = (_files: File[] | null, event: DragEvent) => {
  if (window.isWeb) return;

  if (props.disabled) {
    event.dataTransfer!.dropEffect = "none";
  } else {
    event.dataTransfer!.dropEffect = "copy";
  }
  if (fileList.value.length >= props.max!) {
    event.dataTransfer!.dropEffect = "none";
  } else {
    event.dataTransfer!.dropEffect = "copy";
  }
};

const { isOverDropZone } = useDropZone(fileSelectArea, {
  onDrop,
  onOver,
});
</script>

<style scoped lang="less">
.file-selet {
  height: 200px;
  border: 1px dashed rgb(224, 224, 230);
  border-radius: 3px;
  overflow: auto;
  padding: 10px;

  &.dragging {
    border: 1px dashed #18a058;
  }
}
.file {
  margin-bottom: 10px;
  .file-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .name {
    }
    .remove-icon {
      cursor: pointer;
    }
    .remove-icon.in-progress {
      color: #ccc;
      cursor: not-allowed;
      &:hover {
        color: #ccc;
      }
    }
    .remove-icon:hover {
      color: red;
    }
  }
}
.file-selet:hover {
  border: 1px dashed #18a058;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 100%;
}
</style>
