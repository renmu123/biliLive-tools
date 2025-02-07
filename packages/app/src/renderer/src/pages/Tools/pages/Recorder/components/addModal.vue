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
        <h4>支持斗鱼、虎牙平台、B站，玩具级录播，请做好踩坑的准备</h4>

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
            <span class="inline-flex"> 自动录制 </span>
          </template>
          <n-switch
            v-model:value="config.disableAutoCheck"
            :checked-value="false"
            :unchecked-value="true"
          />
        </n-form-item>
        <n-form-item>
          <template #label>
            <span class="inline-flex">
              发送至webhook
              <Tip tip="你可以在设置中进行处理，主要用于弹幕压制以及上传功能"></Tip>
            </span>
          </template>
          <n-switch v-model:value="config.sendToWebhook" />
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
        <n-form-item v-if="config.providerId !== 'Bilibili' && config.providerId !== 'DouYu'">
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
        <!-- <n-form-item>
          <template #label>
            <span class="inline-flex"> 线路 </span>
          </template>
          待实现
        </n-form-item> -->
        <n-form-item>
          <template #label>
            <span class="inline-flex"> 保存封面 </span>
          </template>
          <n-switch v-model:value="config.saveCover" :disabled="globalFieldsObj.saveCover" />
          <n-checkbox v-model:checked="globalFieldsObj.saveCover" class="global-checkbox"
            >全局</n-checkbox
          >
        </n-form-item>
        <template v-if="config.providerId === 'Bilibili'">
          <n-form-item>
            <template #label>
              <Tip text="B站录制账号">登录才能录制高清画质</Tip>
            </template>
            <n-select
              v-model:value="config.uid"
              :options="userList"
              label-field="name"
              value-field="uid"
              clearable
              :disabled="globalFieldsObj.uid"
            />
            <n-checkbox v-model:checked="globalFieldsObj.uid" class="global-checkbox"
              >全局</n-checkbox
            >
          </n-form-item>
          <n-form-item>
            <template #label>
              <Tip text="画质" tip="如果找不到对应画质，会使用较清晰的源"></Tip>
            </template>
            <n-select
              v-model:value="config.quality"
              :options="biliQualityOptions"
              :disabled="globalFieldsObj.quality"
            />
            <n-checkbox v-model:checked="globalFieldsObj.quality" class="global-checkbox"
              >全局</n-checkbox
            >
          </n-form-item>
        </template>
        <template v-if="config.providerId === 'DouYu'">
          <n-form-item>
            <template #label>
              <Tip text="画质" tip="如果找不到对应画质，会使用较清晰的源"></Tip>
            </template>
            <n-select
              v-model:value="config.quality"
              :options="douyuQualityOptions"
              :disabled="globalFieldsObj.quality"
            />
            <n-checkbox v-model:checked="globalFieldsObj.quality" class="global-checkbox"
              >全局</n-checkbox
            >
          </n-form-item>
        </template>

        <h2>弹幕</h2>
        <n-form-item>
          <template #label>
            <span class="inline-flex"> 弹幕录制 </span>
          </template>
          <n-switch
            v-model:value="config.disableProvideCommentsWhenRecording"
            :disabled="globalFieldsObj.disableProvideCommentsWhenRecording"
            :checked-value="false"
            :unchecked-value="true"
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
import { useAppConfig } from "@renderer/stores";
import { useUserInfoStore } from "@renderer/stores";

import type { LocalRecordr, BaseRecordr } from "@biliLive-tools/types";

interface Props {
  id?: string;
}
const notice = useNotification();
const { appConfig } = storeToRefs(useAppConfig());
const { userList } = storeToRefs(useUserInfoStore());

const showModal = defineModel<boolean>("visible", { required: true, default: false });
const props = defineProps<Props>();
const emits = defineEmits<{
  (event: "confirm"): void;
}>();

const hasGlobalFields: (keyof Omit<BaseRecordr, "line" | "convert2Mp4" | "qualityRetry">)[] = [
  "quality",
  "disableProvideCommentsWhenRecording",
  "saveGiftDanma",
  "saveSCDanma",
  "segment",
  "saveCover",
];

// @ts-ignore
const globalFieldsObj = ref<Record<(typeof hasGlobalFields)[number], boolean>>({});
for (const key of hasGlobalFields) {
  globalFieldsObj.value[key] = true;
}

const config = ref<Omit<LocalRecordr, "id" | "qualityRetry">>({
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
  sendToWebhook: false,
  noGlobalFollowFields: [],
  saveCover: false,
  extra: {},
});

const qualityOptions = [
  { value: "highest", label: "最高" },
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
  { value: "lowest", label: "最低" },
];
const biliQualityOptions = [
  {
    value: 10000,
    label: "原画(10000)",
  },
  {
    value: 30000,
    label: "杜比(30000)",
  },
  {
    value: 20000,
    label: "4K(20000)",
  },
  {
    value: 400,
    label: "蓝光(400)",
  },
  {
    value: 250,
    label: "超清(250)",
  },
  {
    value: 150,
    label: "高清(150)",
  },
  {
    value: 80,
    label: "流畅(80)",
  },
];

const douyuQualityOptions = [
  {
    value: 0,
    label: "原画",
  },
  {
    value: 8,
    label: "蓝光8M",
  },
  {
    value: 4,
    label: "蓝光4M",
  },
  {
    value: 3,
    label: "超清",
  },
  {
    value: 2,
    label: "高清",
  },
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
    (key) => !globalFieldsObj.value[key as keyof typeof globalFieldsObj.value],
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
  const res = await recoderApi.resolveChannel(channelIdUrl.value);
  if (!res) {
    notice.error({
      title: "解析失败",
      duration: 1000,
    });
    return;
  }

  config.value.channelId = res.channelId;
  config.value.providerId = res.providerId;
  config.value.remarks = res.owner;
  owner.value = res.owner;
  config.value.extra = config.value.extra ?? {};
  config.value.extra!.createTimestamp = Date.now();
  if (res.providerId === "Bilibili") {
    config.value.quality = 10000;
    config.value.extra!.recorderUid = res.uid;
  } else if (res.providerId === "DouYu") {
    config.value.quality = 0;
  }
};

watch(showModal, async (val) => {
  if (val) {
    channelIdUrl.value = "";
    owner.value = "";
    config.value = {
      providerId: "DouYu",
      channelId: "",
      segment: 60,
      quality: 0,
      disableProvideCommentsWhenRecording: true,
      saveGiftDanma: false,
      saveSCDanma: true,
      streamPriorities: [],
      sourcePriorities: [],
      disableAutoCheck: false,
      sendToWebhook: false,
      noGlobalFollowFields: [],
      uid: undefined,
      saveCover: false,
    };

    if (props.id) {
      await getRecordSetting();
    }
    globalFieldsObj.value = {
      quality: !(config.value?.noGlobalFollowFields ?? []).includes("quality"),
      disableProvideCommentsWhenRecording: !(config.value?.noGlobalFollowFields ?? []).includes(
        "disableProvideCommentsWhenRecording",
      ),
      saveGiftDanma: !(config.value?.noGlobalFollowFields ?? []).includes("saveGiftDanma"),
      saveSCDanma: !(config.value?.noGlobalFollowFields ?? []).includes("saveSCDanma"),
      segment: !(config.value?.noGlobalFollowFields ?? []).includes("segment"),
      uid: !(config.value?.noGlobalFollowFields ?? []).includes("uid"),
      saveCover: !(config.value?.noGlobalFollowFields ?? []).includes("saveCover"),
    };
  }
});

watch(
  () => globalFieldsObj.value,
  (val) => {
    if (val.quality) {
      if (config.value.providerId === "Bilibili") {
        config.value.quality = appConfig.value.recorder.bilibili.quality;
      } else if (config.value.providerId === "DouYu") {
        config.value.quality = appConfig.value.recorder.douyu.quality;
      } else {
        config.value.quality = appConfig.value.recorder.quality;
      }
    }
    if (val.disableProvideCommentsWhenRecording) {
      config.value.disableProvideCommentsWhenRecording =
        appConfig.value.recorder.disableProvideCommentsWhenRecording;
    }
    if (val.saveGiftDanma) {
      config.value.saveGiftDanma = appConfig.value.recorder.saveGiftDanma;
    }
    if (val.saveSCDanma) {
      config.value.saveSCDanma = appConfig.value.recorder.saveSCDanma;
    }
    if (val.segment) {
      config.value.segment = appConfig.value.recorder.segment;
    }
    if (val.uid) {
      config.value.uid = appConfig.value.recorder.bilibili.uid;
    }
    if (val.saveCover) {
      config.value.saveCover = appConfig.value.recorder.saveCover;
    }
  },
  {
    deep: true,
  },
);
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
