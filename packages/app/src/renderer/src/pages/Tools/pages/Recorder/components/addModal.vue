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
      <n-form label-placement="left" :label-width="150">
        <h4>支持斗鱼、虎牙平台、B站、抖音，玩具级录播，请做好踩坑的准备</h4>

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
        <n-form-item
          v-if="
            config.providerId !== 'Bilibili' &&
            config.providerId !== 'DouYu' &&
            config.providerId !== 'HuYa'
          "
        >
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

        <template v-if="config.providerId === 'Bilibili'">
          <n-form-item>
            <template #label>
              <Tip :text="textInfo.bili.uid.text">{{ textInfo.bili.uid.tip }}</Tip>
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
              <Tip :text="textInfo.bili.quality.text" :tip="textInfo.bili.quality.tip"></Tip>
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
          <n-form-item>
            <template #label>
              <Tip :text="textInfo.bili.formatName.text" :tip="textInfo.bili.formatName.tip"></Tip>
            </template>
            <n-select
              v-model:value="config.formatName"
              :options="streamFormatOptions"
              :disabled="globalFieldsObj.formatName"
            />
            <n-checkbox v-model:checked="globalFieldsObj.formatName" class="global-checkbox"
              >全局</n-checkbox
            >
          </n-form-item>
          <n-form-item>
            <template #label>
              <Tip :text="textInfo.bili.codecName.text" :tip="textInfo.bili.codecName.tip"></Tip>
            </template>
            <n-select
              v-model:value="config.codecName"
              :options="streamCodecOptions"
              :disabled="globalFieldsObj.codecName"
            />
            <n-checkbox v-model:checked="globalFieldsObj.codecName" class="global-checkbox"
              >全局</n-checkbox
            >
          </n-form-item>
          <n-form-item v-if="config.formatName !== 'flv_only'">
            <template #label>
              <Tip
                :tip="textInfo.bili.useM3U8Proxy.tip"
                :text="textInfo.bili.useM3U8Proxy.text"
              ></Tip>
            </template>
            <n-switch
              v-model:value="config.useM3U8Proxy"
              :disabled="globalFieldsObj.useM3U8Proxy"
            />
            <n-checkbox v-model:checked="globalFieldsObj.useM3U8Proxy" class="global-checkbox"
              >全局</n-checkbox
            >
          </n-form-item>
          <n-form-item>
            <template #label>
              <Tip
                :tip="textInfo.bili.qualityRetry.tip"
                :text="textInfo.bili.qualityRetry.text"
              ></Tip>
            </template>
            <n-input-number
              v-model:value="config.qualityRetry"
              min="0"
              step="1"
              :disabled="globalFieldsObj.qualityRetry"
            >
            </n-input-number>
            <n-checkbox v-model:checked="globalFieldsObj.qualityRetry" class="global-checkbox"
              >全局</n-checkbox
            >
          </n-form-item>
          <!-- <n-form-item>
            <template #label>
              <Tip
                :tip="textInfo.bili.useM3U8Proxy.tip"
                :text="textInfo.bili.useM3U8Proxy.text"
              ></Tip>
            </template>
            <n-switch
              v-model:value="config.useM3U8Proxy"
              :disabled="globalFieldsObj.useM3U8Proxy"
            />
            <n-checkbox v-model:checked="globalFieldsObj.useM3U8Proxy" class="global-checkbox"
              >全局</n-checkbox
            >
          </n-form-item> -->
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
          <n-form-item>
            <template #label>
              <Tip
                :tip="textInfo.bili.qualityRetry.tip"
                :text="textInfo.bili.qualityRetry.text"
              ></Tip>
            </template>
            <n-input-number
              v-model:value="config.qualityRetry"
              min="0"
              step="1"
              :disabled="globalFieldsObj.qualityRetry"
            >
            </n-input-number>
            <n-checkbox v-model:checked="globalFieldsObj.qualityRetry" class="global-checkbox"
              >全局</n-checkbox
            >
          </n-form-item>
        </template>
        <template v-if="config.providerId === 'HuYa'">
          <n-form-item>
            <template #label>
              <Tip text="画质" tip="如果找不到对应画质，会使用较清晰的源"></Tip>
            </template>
            <n-select
              v-model:value="config.quality"
              :options="huyaQualityOptions"
              :disabled="globalFieldsObj.quality"
            />
            <n-checkbox v-model:checked="globalFieldsObj.quality" class="global-checkbox"
              >全局</n-checkbox
            >
          </n-form-item>
          <!-- <n-form-item>
            <template #label>
              <Tip
                :tip="textInfo.bili.qualityRetry.tip"
                :text="textInfo.bili.qualityRetry.text"
              ></Tip>
            </template>
            <n-input-number
              v-model:value="config.qualityRetry"
              min="0"
              step="1"
              :disabled="globalFieldsObj.qualityRetry"
            >
            </n-input-number>
            <n-checkbox v-model:checked="globalFieldsObj.qualityRetry" class="global-checkbox"
              >全局</n-checkbox
            >
          </n-form-item> -->
        </template>
        <template v-if="config.providerId !== 'DouYin'">
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
              <span class="inline-flex"> 高能弹幕(SC) </span>
            </template>
            <n-switch v-model:value="config.saveSCDanma" :disabled="globalFieldsObj.saveSCDanma" />
            <n-checkbox v-model:checked="globalFieldsObj.saveSCDanma" class="global-checkbox"
              >全局</n-checkbox
            >
          </n-form-item>
        </template>

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
            <span class="inline-flex"> 保存封面 </span>
          </template>
          <n-switch v-model:value="config.saveCover" :disabled="globalFieldsObj.saveCover" />
          <n-checkbox v-model:checked="globalFieldsObj.saveCover" class="global-checkbox"
            >全局</n-checkbox
          >
        </n-form-item>

        <template template v-if="config.providerId !== 'DouYin'">
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
          <n-form-item
            v-if="
              !config.disableProvideCommentsWhenRecording &&
              ['Bilibili', 'DouYu'].includes(config.providerId)
            "
          >
            <template #label>
              <span class="inline-flex"> 高能弹幕(SC) </span>
            </template>
            <n-switch v-model:value="config.saveSCDanma" :disabled="globalFieldsObj.saveSCDanma" />
            <n-checkbox v-model:checked="globalFieldsObj.saveSCDanma" class="global-checkbox"
              >全局</n-checkbox
            >
          </n-form-item>
        </template>
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
import {
  qualityOptions,
  biliQualityOptions,
  douyuQualityOptions,
  streamFormatOptions,
  textInfo,
  streamCodecOptions,
  huyaQualityOptions,
} from "@renderer/enums/recorder";

import type { Recorder } from "@biliLive-tools/types";

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

const globalFieldsObj = ref<Record<NonNullable<Recorder["noGlobalFollowFields"]>[number], boolean>>(
  {
    quality: true,
    disableProvideCommentsWhenRecording: true,
    saveGiftDanma: true,
    saveSCDanma: true,
    segment: true,
    uid: true,
    saveCover: true,
    qualityRetry: true,
    formatName: true,
    useM3U8Proxy: true,
    codecName: true,
  },
);

const config = ref<Omit<Recorder, "id">>({
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
  qualityRetry: 0,
  formatName: "auto",
  useM3U8Proxy: false,
  codecName: "auto",
});

const confirm = async () => {
  if (!config.value.channelId) {
    notice.error({
      title: "请输入正确的房间链接",
      duration: 1000,
    });
    return;
  }
  config.value.noGlobalFollowFields = (
    Object.keys(globalFieldsObj.value) as Recorder["noGlobalFollowFields"]
  ).filter((key) => !globalFieldsObj.value[key]);
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
  } else if (res.providerId === "HuYa") {
    config.value.quality = 0;
  } else {
    config.value.quality = "highest";
  }
};

watch(showModal, async (val) => {
  if (val) {
    channelIdUrl.value = "";
    owner.value = "";
    config.value = {
      providerId: "DouYu",
      channelId: "",
      segment: 90,
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
      extra: {},
      qualityRetry: 0,
      formatName: "auto",
      useM3U8Proxy: false,
      codecName: "auto",
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
      qualityRetry: !(config.value?.noGlobalFollowFields ?? []).includes("qualityRetry"),
      formatName: !(config.value?.noGlobalFollowFields ?? []).includes("formatName"),
      useM3U8Proxy: !(config.value?.noGlobalFollowFields ?? []).includes("useM3U8Proxy"),
      codecName: !(config.value?.noGlobalFollowFields ?? []).includes("codecName"),
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
      } else if (config.value.providerId === "HuYa") {
        config.value.quality = appConfig.value.recorder.huya.quality;
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
    if (val.qualityRetry) {
      config.value.qualityRetry = appConfig.value.recorder.qualityRetry;
    }
    if (val.formatName) {
      config.value.formatName = appConfig.value.recorder.bilibili.formatName;
    }
    if (val.useM3U8Proxy) {
      config.value.useM3U8Proxy = appConfig.value.recorder.bilibili.useM3U8Proxy;
    }
    if (val.codecName) {
      config.value.codecName = appConfig.value.recorder.bilibili.codecName;
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
