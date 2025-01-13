<template>
  <PartArea
    v-if="fileList.length !== 0"
    v-model="fileList"
    :sort="props.sort"
    :placeholder="props.inputPlaceholder"
    @add-danmaku="addDanmaku"
  ></PartArea>
  <FileArea
    v-else
    :extensions="props.extensions"
    :desc="props.areaPlaceholder"
    @change="addOldFile"
  ></FileArea>
</template>

<script setup lang="ts">
import FileArea from "@renderer/components/FileArea.vue";
import PartArea from "./PartArea.vue";
import showDirectoryDialog from "@renderer/components/showDirectoryDialog";

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

const addOldFile = (data: { name: string; path: string }[]) => {
  // fileList.value = data.map((item) => ({
  //   id: uuid(),
  //   title: item.name,
  //   videoPath: item.path,
  //   danmakuPath: "",
  // }));
  handleFiles(data.map((item) => item.path));
};

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

defineExpose({
  select,
});
</script>

<style scoped></style>
