<template>
  <n-modal
    v-model:show="showModal"
    :mask-closable="false"
    auto-focus
    preset="dialog"
    :show-icon="false"
  >
    <div class="container">
      <h4>{{ props.detail.title }}</h4>
      <div style="margin-bottom: 10px">
        <n-checkbox :checked="allChecked" @update:checked="handleCheckedChange" />
        选集：({{ selectIds.length }}/{{ props.detail.pages.length }})
      </div>
      <div class="file-container">
        <n-checkbox-group v-model:value="selectIds">
          <div v-for="file in props.detail.pages" :key="file.cid" class="file">
            <n-checkbox :value="file.cid" style="margin-right: 10px" />
            <span v-if="!file.editable">{{ file.part }}.mp4</span>
            <n-input
              v-else
              v-model:value="file.part"
              placeholder="请输入文件名"
              @keyup.enter="editPart(file)"
            >
              <template #suffix> .mp4 </template></n-input
            >
            <n-icon
              :size="13"
              class="btn pointer"
              title="编辑文件名"
              style="margin-left: 5px"
              @click="editPart(file)"
              ><EditOutlined
            /></n-icon>
          </div>
        </n-checkbox-group>
      </div>

      <!-- <div
        v-if="cOptions.hasDanmuOptions"
        style="margin-top: 10px; display: flex; align-items: center"
      >
        <span style="font-size: 12px; flex: none">分辨率：</span>
        <n-select v-model:value="options.danmu" :options="danmuOptions" style="width: 100px" />
      </div> -->
      <div
        v-if="cOptions.hasDanmuOptions"
        style="margin-top: 10px; display: flex; align-items: center"
      >
        <span style="font-size: 12px; flex: none">弹幕：</span>
        <n-select v-model:value="options.danmu" :options="danmuOptions" style="width: 100px" />
      </div>
      <div style="margin-top: 10px">
        <div style="font-size: 12px">下载到：</div>
        <div class="path">
          <n-input v-model:value="options.savePath" placeholder="请输入下载目录" />
          <n-icon style="margin-left: 10px" size="26" class="pointer" @click="selectFolder">
            <FolderOpenOutline />
          </n-icon>
        </div>
      </div>

      <n-button
        :disabled="selectIds.length === 0 || !options.savePath"
        type="primary"
        class="download-btn"
        @click="download"
      >
        下载
      </n-button>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { EditOutlined } from "@vicons/material";
import { sanitizeFileName } from "@renderer/utils";
import { FolderOpenOutline } from "@vicons/ionicons5";
import { useAppConfig } from "@renderer/stores";
import showDirectoryDialog from "@renderer/components/showDirectoryDialog";

interface Part {
  cid: number | string;
  part: string;
  editable: boolean;
}

interface Props {
  detail: {
    vid: string;
    title: string;
    pages: Part[];
  };
  cOptions: {
    hasDanmuOptions: boolean;
  };
}

const danmuOptions = [
  { label: "无", value: "none" },
  { label: "xml", value: "xml" },
];

const { appConfig } = storeToRefs(useAppConfig());
const options = reactive(appConfig.value?.tool?.download ?? {});

const showModal = defineModel<boolean>("visible", { required: true, default: false });
const selectIds = defineModel<(number | string)[]>("selectIds", { required: true, default: [] });
const props = defineProps<Props>();
const emits = defineEmits<{
  (
    event: "confirm",
    value: { ids: (number | string)[]; savePath: string; danmu: "none" | "xml" | "ass" },
  ): void;
}>();

const download = () => {
  emits("confirm", { ids: selectIds.value, savePath: options.savePath, danmu: options.danmu });
  showModal.value = false;
};

const editPart = (file: Part) => {
  file.part = sanitizeFileName(file.part);
  if (file.part.trim() === "") {
    file.part = "未命名";
  }
  file.editable = !file.editable;
};

const selectFolder = async () => {
  let dir: string | undefined;
  if (window.isWeb) {
    dir = await showDirectoryDialog({
      type: "directory",
    })[0];
  } else {
    dir = await window.api.openDirectory({
      defaultPath: options.savePath,
    });
  }

  if (!dir) return;

  options.savePath = dir;
};

const allChecked = computed({
  get: () => selectIds.value.length === props.detail.pages.length,
  set: (value: boolean) => {
    selectIds.value = value ? props.detail.pages.map((p) => p.cid) : [];
  },
});

const handleCheckedChange = (value: boolean) => {
  allChecked.value = value;
};
</script>

<style scoped lang="less">
.container {
  margin-top: 40px;
}
.file-container {
  height: 200px;
  overflow: auto;
  border: 1px solid #eeeeee;
  border-radius: 4px;
  padding: 10px;

  .file {
    margin-bottom: 5px;
    display: flex;
    align-items: center;
  }
}
.download-btn {
  width: 100%;
  margin-top: 10px;
}

.path {
  // border: 1px solid #eeeeee;
  border-radius: 4px;
  padding: 5px 0px;
  // margin-top: 10px;
  display: flex;
  align-items: center;
}
</style>
