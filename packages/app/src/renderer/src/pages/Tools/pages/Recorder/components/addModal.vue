<template>
  <n-modal v-model:show="showModal" :show-icon="false" :closable="false">
    <n-card
      style="width: 700px"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
      class="card"
    >
      <n-form label-placement="left" :label-width="140">
        <n-form-item v-if="!isEdit">
          <template #label>
            <span class="inline-flex"> 直播间链接 </span>
          </template>
          <n-input
            v-model:value.trim="channelIdUrl"
            placeholder="输入后自动解析"
            @blur="onChannelIdInputEnd"
          >
          </n-input>
        </n-form-item>
        <n-form-item v-if="!isEdit">
          <template #label>
            <span class="inline-flex"> 主播名称 </span>
          </template>
          <n-input v-model:value.trim="owner" :disabled="true" placeholder="输入房间链接后自动解析">
          </n-input>
        </n-form-item>
        <n-form-item :disabled="true">
          <template #label>
            <span class="inline-flex"> 房间号 </span>
          </template>
          <n-input
            v-model:value.trim="config.channelId"
            :disabled="true"
            placeholder="输入房间链接后自动解析"
          >
          </n-input>
        </n-form-item>
        <n-form-item :disabled="isEdit">
          <template #label>
            <span class="inline-flex"> 备注 </span>
          </template>
          <n-input v-model:value="config.remarks" placeholder="请输入备注（可选）"> </n-input>
        </n-form-item>
        <n-form-item>
          <template #label>
            <span class="inline-flex"> 禁用自动录制 </span>
          </template>
          <n-switch v-model:value="config.disableAutoCheck" />
        </n-form-item>
        <n-form-item>
          <template #label>
            <span class="inline-flex">
              分段录制
              <Tip tip="0为不分段"></Tip>
            </span>
          </template>
          <n-input-number
            v-model:value="config.segment"
            min="0"
            step="10"
            style="width: 100%"
            :disabled="globalFieldsObj.segment"
          >
            <template #suffix>分钟</template>
          </n-input-number>
          <n-checkbox v-model:checked="globalFieldsObj.segment" class="global-checkbox"
            >全局</n-checkbox
          >
        </n-form-item>
        <n-form-item>
          <template #label>
            <span class="inline-flex"> 画质 </span>
          </template>
          <n-select
            v-model:value="config.quality"
            :options="qualityOptions"
            :disabled="globalFieldsObj.quality"
          />
          <n-checkbox v-model:checked="globalFieldsObj.quality" class="global-checkbox"
            >全局</n-checkbox
          >
        </n-form-item>
        <n-form-item>
          <template #label>
            <span class="inline-flex"> 线路 </span>
          </template>
          待实现
          <n-checkbox v-model:checked="globalFieldsObj.line" class="global-checkbox"
            >全局</n-checkbox
          >
        </n-form-item>

        <h2>弹幕录制</h2>
        <n-form-item>
          <template #label>
            <span class="inline-flex"> 禁止弹幕录制 </span>
          </template>
          <n-switch
            v-model:value="config.disableProvideCommentsWhenRecording"
            :disabled="globalFieldsObj.disableProvideCommentsWhenRecording"
          />
          <n-checkbox
            v-model:checked="globalFieldsObj.disableProvideCommentsWhenRecording"
            class="global-checkbox"
            >全局</n-checkbox
          >
        </n-form-item>
        <n-form-item v-if="!config.disableProvideCommentsWhenRecording">
          <template #label>
            <span class="inline-flex"> 保存礼物 </span>
          </template>
          <n-switch
            v-model:value="config.saveGiftDanma"
            :disabled="globalFieldsObj.saveGiftDanma"
          />
          <n-checkbox v-model:checked="globalFieldsObj.saveGiftDanma" class="global-checkbox"
            >全局</n-checkbox
          >
        </n-form-item>
        <n-form-item v-if="!config.disableProvideCommentsWhenRecording">
          <template #label>
            <span class="inline-flex"> 保存高能弹幕 </span>
          </template>
          <n-switch v-model:value="config.saveSCDanma" :disabled="globalFieldsObj.saveSCDanma" />
          <n-checkbox v-model:checked="globalFieldsObj.saveSCDanma" class="global-checkbox"
            >全局</n-checkbox
          >
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="footer">
          <n-button class="btn" @click="cancel"> 取消 </n-button>
          <n-button type="primary" class="btn" @click="confirm"> 确认 </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { recoderApi } from "@renderer/apis";

import type { LocalRecordr, BaseRecordr } from "@biliLive-tools/types";

interface Props {
  id?: string;
}
const notice = useNotification();

const showModal = defineModel<boolean>("visible", { required: true, default: false });
const props = defineProps<Props>();
const emits = defineEmits<{
  (event: "confirm"): void;
}>();

const hasGlobalFields: (keyof BaseRecordr)[] = [
  "quality",
  "line",
  "disableProvideCommentsWhenRecording",
  "saveGiftDanma",
  "saveSCDanma",
  "segment",
];

const globalFieldsObj = ref<Record<(typeof hasGlobalFields)[number], boolean>>({
  quality: true,
  line: true,
  disableProvideCommentsWhenRecording: true,
  saveGiftDanma: true,
  saveSCDanma: true,
  segment: true,
});

const config = ref<Omit<LocalRecordr, "id">>({
  providerId: "DouYu",
  channelId: "",
  segment: 60,
  quality: "highest",
  disableProvideCommentsWhenRecording: false,
  saveGiftDanma: false,
  saveSCDanma: true,
  streamPriorities: [],
  sourcePriorities: [],
  disableAutoCheck: false,
  noGlobalFollowFields: hasGlobalFields,
});

const qualityOptions = [
  { value: "highest", label: "最高" },
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
  { value: "lowest", label: "最低" },
];

const confirm = async () => {
  if (!config.value.channelId) {
    notice.error({
      title: "请输入正确的房间链接",
      duration: 1000,
    });
    return;
  }
  config.value.noGlobalFollowFields = Object.keys(globalFieldsObj.value).filter(
    (key) => globalFieldsObj.value[key as keyof typeof globalFieldsObj.value],
  ) as (keyof BaseRecordr)[];
  if (isEdit.value) {
    if (!props.id) return;
    await recoderApi.update(props.id, { id: props.id, ...config.value });
  } else {
    await recoderApi.add(config.value);
  }
  emits("confirm");
  showModal.value = false;
};

const cancel = () => {
  showModal.value = false;
};

const getRecordSetting = async () => {
  if (!props.id) return;
  config.value = await recoderApi.get(props.id);
};
const isEdit = computed(() => !!props.id);

const channelIdUrl = ref("");
const owner = ref("");
const onChannelIdInputEnd = async () => {
  if (!channelIdUrl.value) return;
  console.log("onChannelIdInputEnd");
  const res = await recoderApi.resolveChannel(channelIdUrl.value);
  if (!res) {
    notice.error({
      title: "解析失败",
      duration: 1000,
    });
    return;
  }

  config.value.channelId = res.channelId;
  owner.value = res.owner;
};

watchEffect(async () => {
  if (showModal.value) {
    channelIdUrl.value = "";
    owner.value = "";
    config.value = {
      providerId: "DouYu",
      channelId: "",
      segment: 60,
      quality: "highest",
      disableProvideCommentsWhenRecording: true,
      saveGiftDanma: false,
      saveSCDanma: true,
      streamPriorities: [],
      sourcePriorities: [],
      disableAutoCheck: false,
      noGlobalFollowFields: hasGlobalFields,
    };
  }
  if (props.id) {
    await getRecordSetting();
  }

  globalFieldsObj.value = {
    quality: (config.value?.noGlobalFollowFields ?? []).includes("quality"),
    line: (config.value?.noGlobalFollowFields ?? []).includes("line"),
    disableProvideCommentsWhenRecording: (config.value?.noGlobalFollowFields ?? []).includes(
      "disableProvideCommentsWhenRecording",
    ),
    saveGiftDanma: (config.value?.noGlobalFollowFields ?? []).includes("saveGiftDanma"),
    saveSCDanma: (config.value?.noGlobalFollowFields ?? []).includes("saveSCDanma"),
    segment: (config.value?.noGlobalFollowFields ?? []).includes("segment"),
  };
  // TODO: 设置全局显示的值
});
</script>

<style scoped lang="less">
.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 10px;
  }
}

.global-checkbox {
  flex: none;
  margin-left: auto;
  :deep(.n-checkbox-box-wrapper) {
    margin-left: 10px;
  }
  :deep(.n-checkbox__label) {
    padding-right: 0px;
  }
}
</style>
