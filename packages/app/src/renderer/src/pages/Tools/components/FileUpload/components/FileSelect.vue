<template>
  <PartArea
    v-if="fileList.length !== 0"
    v-model="fileList"
    :sort="props.sort"
    :placeholder="props.inputPlaceholder"
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
import { supportedVideoExtensions, uuid } from "@renderer/utils";

const fileList = defineModel<
  {
    id: string;
    title: string;
    path: string;
    visible: boolean;
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
  fileList.value = data.map((item) => ({
    id: uuid(),
    title: item.name,
    path: item.path,
    visible: false,
  }));
};

const select = async () => {
  const files = await window.api.openFile({
    multi: true,
    filters: [
      {
        name: "file",
        extensions: supportedVideoExtensions,
      },
      {
        name: "所有文件",
        extensions: ["*"],
      },
    ],
  });
  if (!files) return;
  const newFiles = files.map((file) => ({
    id: uuid(),
    title: window.path.parse(file).name,
    path: file,
    visible: false,
  }));
  fileList.value = fileList.value.concat(newFiles);
};

defineExpose({
  select,
});
</script>

<style scoped></style>
