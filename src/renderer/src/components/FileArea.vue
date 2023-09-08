<template>
  <div
    ref="fileSelectArea"
    class="file-selet"
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
        <n-progress
          v-if="file.percentage"
          type="line"
          :status="file.percentageStatus"
          :percentage="file.percentage"
          :indicator-placement="'outside'"
          :show-indicator="false"
          style="--n-rail-height: 6px"
        />
      </div>
    </div>
    <div v-else class="empty">
      <div style="margin-bottom: 12px">
        <n-icon size="48" :depth="3">
          <archive-icon />
        </n-icon>
      </div>
      <n-text style="font-size: 16px"> 点击或拖拽文件到该区域来上传 </n-text>
      <n-p v-if="desc" depth="3" style="margin: 8px 0 0 0">
        {{ props.desc }}
      </n-p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArchiveOutline as ArchiveIcon, CloseOutline as CloseIcon } from "@vicons/ionicons5";

import type { File } from "../../../types";

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
// const emits = defineEmits<{
//   change: any[];
// }>();

const fileList = defineModel<
  (File & {
    percentage?: number;
    percentageStatus?: "success" | "info" | "error";
  })[]
>({ required: true });

const fileSelectArea = ref<HTMLElement | null>(null);

const handleFileSelect = async () => {
  if (props.disabled) return;
  const files = await window.api.openFile({
    multi: props.max === 1 ? false : true,
    filters: [
      {
        name: "file",
        extensions: props.extensions,
      },
    ],
  });
  if (!files) return;
  let items = files
    .map(window.api.formatFile)
    .filter((file) => !fileList.value.map((item) => item.path).includes(file.path));

  if (props.max) {
    items = items.slice(0, props.max - fileList.value.length);
  }
  fileList.value.push(...items);
};

const removeItem = (index: number) => {
  if (props.disabled) return;
  fileList.value.splice(index, 1);
};

onMounted(() => {
  fileSelectArea.value!.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  fileSelectArea.value!.addEventListener("drop", (event) => {
    event.preventDefault();
    if (props.disabled) return;

    const files = event.dataTransfer!.files;
    if (files) {
      let items = Array.from(files)
        .map((file) => window.api.formatFile(file.path))
        .filter((file) => !fileList.value.map((item) => item.path).includes(file.path));

      if (props.max) {
        items = items.slice(0, props.max - fileList.value.length);
      }
      fileList.value.push(...items);
    }
  });
});
</script>

<style scoped lang="less">
.file-selet {
  height: 200px;
  border: 1px dashed rgb(224, 224, 230);
  border-radius: 3px;
  overflow: auto;
  padding: 10px;
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
