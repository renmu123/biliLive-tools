<template>
  <n-modal v-model:show="showModal" :mask-closable="false">
    <n-card
      class="download-modal"
      :bordered="false"
      size="large"
      role="dialog"
      aria-modal="true"
      closable
      @close="showModal = false"
    >
      <template #header>
        <div class="modal-header">
          <div class="modal-title">下载视频</div>
          <div class="video-title" :title="props.detail.title">{{ props.detail.title }}</div>
        </div>
      </template>

      <div class="modal-content">
        <section class="section">
          <div class="section-header">
            <div class="section-title">选择文件</div>
            <n-checkbox
              :checked="allChecked"
              :indeterminate="selectIds.length > 0 && !allChecked"
              @update:checked="handleCheckedChange"
            >
              全选（{{ selectIds.length }}/{{ props.detail.parts.length }}）
            </n-checkbox>
          </div>
          <div class="file-container">
            <n-checkbox-group v-model:value="selectIds">
              <div v-for="file in props.detail.parts" :key="file.partId" class="file">
                <n-checkbox :value="file.partId" :aria-label="`选择 ${file.name}.mp4`" />
                <span v-if="!file.isEditing" class="file-name" :title="`${file.name}.mp4`">
                  {{ file.name }}.mp4
                </span>
                <n-input
                  v-else
                  v-model:value="file.name"
                  class="file-name-input"
                  size="small"
                  placeholder="请输入文件名"
                  @keyup.enter="editPart(file)"
                >
                  <template #suffix>.mp4</template>
                </n-input>
                <n-button
                  quaternary
                  circle
                  size="small"
                  :aria-label="file.isEditing ? '完成编辑文件名' : '编辑文件名'"
                  :title="file.isEditing ? '完成编辑文件名' : '编辑文件名'"
                  @click="editPart(file)"
                >
                  <template #icon
                    ><n-icon><EditOutlined /></n-icon
                  ></template>
                </n-button>
              </div>
            </n-checkbox-group>
          </div>
        </section>

        <section class="section">
          <div class="section-title">下载选项</div>
          <div class="option-list">
            <div class="option-row">
              <span class="option-label">文件冲突</span>
              <n-radio-group v-model:value="options.override">
                <n-space>
                  <n-radio :value="true">覆盖文件</n-radio>
                  <n-radio :value="false">跳过存在文件</n-radio>
                </n-space>
              </n-radio-group>
            </div>
            <div v-if="props.detail.resolutions.length > 0" class="option-row">
              <span
                class="option-label"
                title="清晰度取第一P视频，如果后续视频不存在相应清晰度，取最好清晰度"
                >清晰度</span
              >
              <n-select
                v-model:value="options.douyuResolution"
                :options="props.detail.resolutions"
                class="resolution-select"
              />
            </div>
            <div v-if="cOptions.hasDanmuOptions" class="option-row">
              <span class="option-label">弹幕</span>
              <n-radio-group v-model:value="options.danmu">
                <n-space>
                  <n-radio v-for="option in danmuOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </n-radio>
                </n-space>
              </n-radio-group>
            </div>
            <div v-if="cOptions.hasAudioOnlyOptions" class="option-row">
              <span class="option-label">只下载音频</span>
              <n-switch v-model:value="options.onlyAudio" />
            </div>
            <div v-if="cOptions.hasDanmuOnlyOptions" class="option-row">
              <span class="option-label">只下载弹幕</span>
              <n-switch v-model:value="options.onlyDanmu" />
            </div>
          </div>
        </section>

        <section class="section">
          <label class="section-title" for="download-save-path">保存位置</label>
          <div class="path">
            <n-input
              id="download-save-path"
              v-model:value="options.savePath"
              placeholder="请选择或输入下载目录"
            />
            <n-button aria-label="选择下载目录" title="选择下载目录" @click="selectFolder">
              <template #icon
                ><n-icon><FolderOpenOutline /></n-icon
              ></template>
              浏览
            </n-button>
          </div>
        </section>
      </div>

      <template #footer>
        <div class="modal-actions">
          <n-button @click="showModal = false">取消</n-button>
          <n-button
            type="primary"
            :disabled="selectIds.length === 0 || !options.savePath"
            @click="download"
          >
            下载
          </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { toReactive } from "@vueuse/core";
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
    hasDanmuOnlyOptions: boolean;
  };
}

const danmuOptions = [
  { label: "无", value: "none" },
  { label: "xml", value: "xml" },
];

const { appConfig } = storeToRefs(useAppConfig());
const options = toReactive(
  computed({
    get: () => appConfig.value.tool.download,
    set: (value) => {
      appConfig.value.tool.download = value;
    },
  }),
);

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
      onlyDanmu: boolean;
    },
  ): void;
}>();

const notice = useNotification();
const download = () => {
  // 如果开启了只下载弹幕，但没有选择弹幕格式，则提示错误
  if (props.cOptions.hasDanmuOnlyOptions && options.onlyDanmu && options.danmu === "none") {
    notice.error({
      content: "只下载弹幕时，请选择弹幕格式",
      duration: 3000,
    });
    return;
  }
  emits("confirm", {
    ids: selectIds.value,
    savePath: options.savePath,
    danmu: options.danmu,
    onlyAudio: options.onlyAudio,
    resoltion: options.douyuResolution,
    override: options.override,
    onlyDanmu: options.onlyDanmu,
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
.download-modal {
  width: min(680px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;

  :deep(.n-card__content) {
    min-height: 0;
    overflow-y: auto;
  }
}

.modal-header {
  min-width: 0;
}

.modal-title {
  font-weight: 600;
}

.video-title {
  margin-top: 4px;
  font-size: 13px;
  font-weight: 400;
  opacity: 0.7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section + .section {
  margin-top: 22px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.section-title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}

.section-header .section-title {
  margin-bottom: 0;
}

.file-container {
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  padding: 4px 10px;

  .file {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 38px;

    & + .file {
      border-top: 1px solid var(--n-border-color);
    }
  }
}

.file-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-name-input {
  flex: 1;
  min-width: 0;
}

.option-list {
  display: grid;
  gap: 14px;
}

.option-row {
  display: flex;
  align-items: center;
  min-height: 34px;
  gap: 16px;
}

.option-label {
  flex: 0 0 90px;
}

.resolution-select {
  width: 180px;
  max-width: 100%;
}

.path {
  display: flex;
  align-items: center;
  gap: 10px;

  .n-button {
    flex-shrink: 0;
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 520px) {
  .option-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .option-label {
    flex-basis: auto;
  }
}
</style>
