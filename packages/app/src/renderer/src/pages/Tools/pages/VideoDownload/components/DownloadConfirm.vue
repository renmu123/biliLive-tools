<template>
  <n-modal
    v-model:show="showModal"
    :mask-closable="false"
    auto-focus
    preset="dialog"
    :show-icon="false"
    :title="props.detail.title"
  >
    <div class="container">
      <div style="margin-bottom: 10px">
        <n-checkbox :checked="allChecked" @update:checked="handleCheckedChange" />
        选集：({{ selectIds.length }}/{{ props.detail.parts.length }})
      </div>
      <div class="file-container">
        <n-checkbox-group v-model:value="selectIds">
          <div v-for="file in props.detail.parts" :key="file.partId" class="file">
            <n-checkbox :value="file.partId" style="margin-right: 10px" />
            <span v-if="!file.isEditing">{{ file.name }}.mp4</span>
            <n-input
              v-else
              v-model:value="file.name"
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

      <div style="margin-top: 10px; display: flex; align-items: center">
        <span style="font-size: 12px; flex: none">文件冲突：</span>
        <n-radio-group v-model:value="options.override">
          <n-space>
            <n-radio :value="true"> 覆盖文件 </n-radio>
            <n-radio :value="false"> 跳过存在文件 </n-radio>
          </n-space>
        </n-radio-group>
      </div>

      <div
        v-if="props.detail.resolutions.length > 0"
        style="margin-top: 10px; display: flex; align-items: center"
      >
        <span
          style="font-size: 12px; flex: none"
          title="清晰度取第一P视频，如果后续视频不存在相应分清晰度，取最好清晰度"
          >清晰度：</span
        >
        <n-select
          v-model:value="options.douyuResolution"
          :options="props.detail.resolutions"
          style="width: 150px"
        />
      </div>
      <div
        v-if="cOptions.hasDanmuOptions"
        style="margin-top: 10px; display: flex; align-items: center"
      >
        <span style="font-size: 12px; flex: none">弹幕：</span>
        <n-select v-model:value="options.danmu" :options="danmuOptions" style="width: 100px" />
      </div>
      <div
        v-if="cOptions.hasAudioOnlyOptions"
        style="margin-top: 10px; display: flex; align-items: center"
      >
        <span style="font-size: 12px; flex: none">只下载音频：</span>
        <n-switch v-model:value="options.onlyAudio" />
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

import type { VideoAPI } from "@biliLive-tools/http/types/video.js";

interface Props {
  detail: VideoAPI["parseVideo"]["Resp"];
  cOptions: {
    hasDanmuOptions: boolean;
    hasAudioOnlyOptions: boolean;
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
    value: {
      ids: (number | string)[];
      savePath: string;
      danmu: "none" | "xml";
      resoltion: string | "highest";
      override: boolean;
      onlyAudio: boolean;
    },
  ): void;
}>();

const download = () => {
  emits("confirm", {
    ids: selectIds.value,
    savePath: options.savePath,
    danmu: options.danmu,
    onlyAudio: options.onlyAudio,
    resoltion: options.douyuResolution,
    override: options.override,
  });
};

const editPart = (file: { name: string; isEditing: boolean }) => {
  file.name = sanitizeFileName(file.name.trim());
  if (file.name === "") {
    file.name = "未命名";
  }
  file.isEditing = !file.isEditing;
};

const selectFolder = async () => {
  let dir: string | undefined;
  if (window.isWeb) {
    dir = (
      await showDirectoryDialog({
        type: "directory",
      })
    )?.[0];
  } else {
    dir = await window.api.openDirectory({
      defaultPath: options.savePath,
    });
  }

  if (!dir) return;

  options.savePath = dir;
};

const allChecked = computed({
  get: () => selectIds.value.length === props.detail.parts.length,
  set: (value: boolean) => {
    selectIds.value = value ? props.detail.parts.map((p) => p.partId) : [];
  },
});

const handleCheckedChange = (value: boolean) => {
  allChecked.value = value;
};
</script>

<style scoped lang="less">
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
