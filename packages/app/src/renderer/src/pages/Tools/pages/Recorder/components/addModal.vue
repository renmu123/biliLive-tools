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
        <n-form-item>
          <template #label>
            <span class="inline-flex"> 主播名称 </span>
          </template>
          <n-input
            v-model:value.trim="config.owner"
            :disabled="true"
            placeholder="输入房间链接后自动解析"
          >
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
            <span class="inline-flex">
              分段录制
              <Tip tip="0为不分段"></Tip>
            </span>
          </template>
          <n-input-number v-model:value="config.segment" min="0" step="10">
            <template #suffix>分钟</template>
          </n-input-number>
        </n-form-item>
        <n-form-item>
          <template #label>
            <span class="inline-flex"> 画质 </span>
          </template>
          <n-select v-model:value="config.quality" :options="qualityOptions" />
        </n-form-item>
        <n-form-item>
          <template #label>
            <span class="inline-flex"> 线路 </span>
          </template>
          待实现
        </n-form-item>

        <h2>弹幕录制</h2>
        <n-form-item>
          <template #label>
            <span class="inline-flex"> 弹幕录制 </span>
          </template>
          <n-switch v-model:value="config.disableProvideCommentsWhenRecording" />
        </n-form-item>
        <n-form-item v-if="config.disableProvideCommentsWhenRecording">
          <template #label>
            <span class="inline-flex"> 保存礼物 </span>
          </template>
          <n-switch v-model:value="config.saveGiftDanma" />
        </n-form-item>
        <n-form-item v-if="config.disableProvideCommentsWhenRecording">
          <template #label>
            <span class="inline-flex"> 保存高能弹幕 </span>
          </template>
          <n-switch v-model:value="config.saveSCDanma" />
        </n-form-item>
        <!-- <n-form-item v-if="config.recorder.disableProvideCommentsWhenRecording">
        <template #label>
          <span class="inline-flex"> 自动转换为ass </span>
        </template>
        待实现
      </n-form-item>
      <n-form-item v-if="config.recorder.disableProvideCommentsWhenRecording && false">
        <template #label>
          <span class="inline-flex"> ass转换预设 </span>
        </template>
        待实现
      </n-form-item> -->
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
import { useAppConfig } from "@renderer/stores";

import type { LocalRecordr } from "@biliLive-tools/types";

interface Props {
  id?: string;
}
const { appConfig } = storeToRefs(useAppConfig());
const notice = useNotification();
// const options = appConfig.value.tool.download;

const showModal = defineModel<boolean>("visible", { required: true, default: false });
const props = defineProps<Props>();
const emits = defineEmits<{
  (event: "confirm"): void;
}>();

const config = ref<Omit<LocalRecordr, "id">>({
  owner: "",
  providerId: "DouYu",
  channelId: "",
  segment: 60,
  quality: "highest",
  disableProvideCommentsWhenRecording: true,
  saveGiftDanma: false,
  saveSCDanma: true,
  streamPriorities: [],
  sourcePriorities: [],
  noGlobalFollowFields: [
    "quality",
    "line",
    "disableProvideCommentsWhenRecording",
    "saveGiftDanma",
    "saveSCDanma",
    "segment",
  ],
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
      title: "请输入房间号",
      duration: 1000,
    });
    return;
  }
  await recoderApi.add(config.value);
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
  config.value.owner = res.owner;
};

watchEffect(() => {
  if (!showModal.value) {
    channelIdUrl.value = "";
  }
  if (props.id) {
    getRecordSetting();
  }
});
</script>

<style scoped lang="less">
.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 10px;
  }
}
</style>
