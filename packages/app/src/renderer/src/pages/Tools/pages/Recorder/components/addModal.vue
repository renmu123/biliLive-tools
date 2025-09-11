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
        <h4>支持斗鱼、虎牙、B站、抖音，玩具级录播，请做好踩坑的准备</h4>

        <n-form-item v-if="!isEdit">
          <template #label>
            <Tip
              text="直播间链接"
              tip="如果链接无法解析，请尝试使用标准直播间链接<br/>斗鱼：https://www.douyu.com/房间号<br/>虎牙：https://www.huya.com/房间号<br/>B站：https://live.bilibili.com/房间号<br/>抖音：https://live.douyin.com/房间号<br/>抖音：https://wwww.douyin.com/user/xxxxx"
            ></Tip>
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
            <Tip
              text="发送至webhook"
              tip="你可以在设置中进行处理，主要用于弹幕压制以及上传功能"
            ></Tip>
          </template>
          <n-switch v-model:value="config.sendToWebhook" />
        </n-form-item>
        <n-form-item v-if="!config.disableAutoCheck">
          <template #label>
            <Tip
              text="录制开始通知"
              tip="默认使用系统通知，具体前往设置通知中修改，一场直播只会通知一次"
            ></Tip>
          </template>
          <n-switch v-model:value="config.liveStartNotification" />
        </n-form-item>

        <n-form-item>
          <template #label>
            <Tip
              :text="textInfo.common.recorderType.text"
              :tip="textInfo.common.recorderType.tip"
            ></Tip>
          </template>
          <n-select
            v-model:value="config.recorderType"
            :options="recorderTypeOptions"
            :disabled="globalFieldsObj.recorderType"
          />
          <n-checkbox v-model:checked="globalFieldsObj.recorderType" class="global-checkbox"
            >全局</n-checkbox
          >
        </n-form-item>
        <n-form-item
          v-if="
            config.providerId !== 'Bilibili' &&
            config.providerId !== 'DouYu' &&
            config.providerId !== 'HuYa' &&
            config.providerId !== 'DouYin'
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
              :options="biliStreamFormatOptions"
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
          <n-form-item v-if="!config.disableProvideCommentsWhenRecording">
            <template #label>
              <Tip
                text="禁止标题关键词"
                tip="如果直播间标题包含这些关键词，则不会自动录制，多个关键词请用英文逗号分隔，手动录制的不会被影响"
              ></Tip>
            </template>
            <n-input v-model:value="config.titleKeywords" placeholder="例如：回放,录播,重播" />
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
          <n-form-item>
            <template #label>
              <Tip text="线路" tip="如果设置的不存在，会采用默认"></Tip>
            </template>
            <n-select
              v-model:value="config.source"
              :options="douyuSourceOptions"
              :disabled="globalFieldsObj.source"
            />
            <n-checkbox v-model:checked="globalFieldsObj.source" class="global-checkbox"
              >全局</n-checkbox
            >
          </n-form-item>
          <n-form-item>
            <template #label>
              <Tip
                text="禁止标题关键词"
                tip="如果直播间标题包含这些关键词，则不会自动录制，多个关键词请用英文逗号分隔，录制中的直播隔约每五分钟会进行检查，手动录制的不会被影响"
              ></Tip>
            </template>
            <n-input v-model:value="config.titleKeywords" placeholder="例如：回放,录播,重播" />
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
          <n-form-item>
            <template #label>
              <Tip
                :text="textInfo.douyin.formatName.text"
                :tip="textInfo.douyin.formatName.tip"
              ></Tip>
            </template>
            <n-select
              v-model:value="config.formatName"
              :options="douyinStreamFormatOptions"
              :disabled="globalFieldsObj.formatName"
            />
            <n-checkbox v-model:checked="globalFieldsObj.formatName" class="global-checkbox"
              >全局</n-checkbox
            >
          </n-form-item>
          <n-form-item>
            <template #label>
              <Tip text="线路" tip="如果设置的不存在，会采用默认"></Tip>
            </template>
            <n-select
              v-model:value="config.source"
              :options="huyaSourceOptions"
              :disabled="globalFieldsObj.source"
            />
            <n-checkbox v-model:checked="globalFieldsObj.source" class="global-checkbox"
              >全局</n-checkbox
            >
          </n-form-item>
        </template>
        <template v-if="config.providerId === 'DouYin'">
          <n-form-item>
            <template #label>
              <Tip text="画质" tip="如果找不到对应画质，会使用较清晰的源"></Tip>
            </template>
            <n-select
              v-model:value="config.quality"
              :options="douyinQualityOptions"
              :disabled="globalFieldsObj.quality"
            />
            <n-checkbox v-model:checked="globalFieldsObj.quality" class="global-checkbox"
              >全局</n-checkbox
            >
          </n-form-item>
          <n-form-item>
            <template #label>
              <Tip
                :text="textInfo.douyin.formatName.text"
                :tip="textInfo.douyin.formatName.tip"
              ></Tip>
            </template>
            <n-select
              v-model:value="config.formatName"
              :options="douyinStreamFormatOptions"
              :disabled="globalFieldsObj.formatName"
            />
            <n-checkbox v-model:checked="globalFieldsObj.formatName" class="global-checkbox"
              >全局</n-checkbox
            >
          </n-form-item>
          <n-form-item>
            <template #label>
              <Tip text="Cookie" tip="用于录制会员直播"></Tip>
            </template>
            <n-input
              v-model:value="config.cookie"
              type="password"
              :disabled="globalFieldsObj.cookie"
            />
            <n-checkbox v-model:checked="globalFieldsObj.cookie" class="global-checkbox"
              >全局</n-checkbox
            >
          </n-form-item>
          <n-form-item>
            <template #label>
              <Tip text="双屏直播流" tip="开启后如果是双屏直播，那么就使用拼接的流"></Tip>
            </template>
            <n-switch
              v-model:value="config.doubleScreen"
              :disabled="globalFieldsObj.doubleScreen"
            />
            <n-checkbox v-model:checked="globalFieldsObj.doubleScreen" class="global-checkbox"
              >全局</n-checkbox
            >
          </n-form-item>
        </template>

        <n-form-item v-if="config.providerId !== 'HuYa' && config.providerId !== 'DouYin'">
          <template #label>
            <Tip text="只录制音频" tip="会选择纯音频流，B站只支持flv流，抖音请在画质中选择"></Tip>
          </template>
          <n-switch v-model:value="config.onlyAudio" />
        </n-form-item>
        <n-form-item>
          <template #label>
            <Tip :text="textInfo.common.format.text" :tip="textInfo.common.format.tip"></Tip>
          </template>
          <n-select
            v-model:value="config.videoFormat"
            :options="videoFormatOptions"
            :disabled="globalFieldsObj.videoFormat"
          />
          <n-checkbox v-model:checked="globalFieldsObj.videoFormat" class="global-checkbox"
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
            min="-1"
            step="1"
            :disabled="globalFieldsObj.qualityRetry"
          >
          </n-input-number>
          <n-checkbox v-model:checked="globalFieldsObj.qualityRetry" class="global-checkbox"
            >全局</n-checkbox
          >
        </n-form-item>
        <n-form-item>
          <template #label>
            <Tip text="分段时间" tip="0为不分段"></Tip>
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
        <n-form-item>
          <template #label>
            <Tip text="监控时间段" tip="仅在时间段内进行监控，有助于减少风控的可能"></Tip>
          </template>
          <n-time-picker v-model:formatted-value="config.handleTime[0]" clearable />
          ~
          <n-time-picker v-model:formatted-value="config.handleTime[1]" clearable />
        </n-form-item>

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
        <n-form-item
          v-if="
            !config.disableProvideCommentsWhenRecording && !['HuYa'].includes(config.providerId)
          "
        >
          <template #label>
            <Tip
              text="服务端时间戳"
              tip="使用服务端返回的弹幕时间戳而非本地收到的时间戳，用于处理某些主播的弹幕时间戳不准确的问题"
            ></Tip>
          </template>
          <n-switch
            v-model:value="config.useServerTimestamp"
            :disabled="globalFieldsObj.useServerTimestamp"
          />
          <n-checkbox v-model:checked="globalFieldsObj.useServerTimestamp" class="global-checkbox"
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
import {
  qualityOptions,
  biliQualityOptions,
  douyuQualityOptions,
  biliStreamFormatOptions,
  textInfo,
  streamCodecOptions,
  huyaQualityOptions,
  douyinQualityOptions,
  douyuSourceOptions,
  videoFormatOptions,
  douyinStreamFormatOptions,
  huyaSourceOptions,
  recorderTypeOptions,
} from "@renderer/enums/recorder";
import { useConfirm } from "@renderer/hooks";

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
    source: true,
    videoFormat: true,
    recorderType: true,
    cookie: true,
    doubleScreen: true,
    useServerTimestamp: true,
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
  titleKeywords: "",
  liveStartNotification: false,
  source: "auto",
  videoFormat: "auto",
  recorderType: "ffmpeg",
  cookie: "",
  doubleScreen: true,
  useServerTimestamp: true,
  handleTime: ["", ""],
});

const confirmDialog = useConfirm();
const confirm = async () => {
  if (!config.value.channelId) {
    notice.error({
      title: "请输入正确的房间链接",
      duration: 1000,
    });
    return;
  }

  if (config.value.providerId === "Bilibili" && !config.value.uid) {
    const [status] = await confirmDialog.warning({
      title: "确认添加",
      content: `B站录制高清画质需要设置账号，你可能尚未设置，尽可能使用使用小号，使用此功能默认需要你为可能的风控负责，是否继续？`,
      showCheckbox: true,
      showAgainKey: "recorder-bili-account",
    });
    if (!status) return;
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
  if (!config.value.handleTime) {
    config.value.handleTime = [null, null];
  }
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
  config.value.extra!.avatar = res.avatar;
  if (res.providerId === "Bilibili") {
    config.value.quality = appConfig.value.recorder.bilibili.quality;
    config.value.extra!.recorderUid = res.uid;
  } else if (res.providerId === "DouYu") {
    config.value.quality = appConfig.value.recorder.douyu.quality;
  } else if (res.providerId === "HuYa") {
    config.value.quality = appConfig.value.recorder.huya.quality;
  } else if (res.providerId === "DouYin") {
    config.value.quality = appConfig.value.recorder.douyin.quality;
    config.value.cookie = appConfig.value.recorder.douyin.cookie;
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
      titleKeywords: "",
      liveStartNotification: false,
      source: "auto",
      videoFormat: "auto",
      recorderType: "ffmpeg",
      cookie: "",
      doubleScreen: true,
      useServerTimestamp: true,
      handleTime: [null, null],
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
      source: !(config.value?.noGlobalFollowFields ?? []).includes("source"),
      videoFormat: !(config.value?.noGlobalFollowFields ?? []).includes("videoFormat"),
      recorderType: !(config.value?.noGlobalFollowFields ?? []).includes("recorderType"),
      cookie: !(config.value?.noGlobalFollowFields ?? []).includes("cookie"),
      doubleScreen: !(config.value?.noGlobalFollowFields ?? []).includes("doubleScreen"),
      useServerTimestamp: !(config.value?.noGlobalFollowFields ?? []).includes(
        "useServerTimestamp",
      ),
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
      } else if (config.value.providerId === "DouYin") {
        config.value.quality = appConfig.value.recorder.douyin.quality;
      } else {
        config.value.quality = appConfig.value.recorder.quality;
      }
    }
    if (val.formatName) {
      if (config.value.providerId === "Bilibili") {
        config.value.formatName = appConfig.value.recorder.bilibili.formatName;
      } else if (config.value.providerId === "DouYin") {
        config.value.formatName = appConfig.value.recorder.douyin.formatName;
      } else if (config.value.providerId === "HuYa") {
        config.value.formatName = appConfig.value.recorder.huya.formatName;
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

    if (val.useM3U8Proxy) {
      config.value.useM3U8Proxy = appConfig.value.recorder.bilibili.useM3U8Proxy;
    }
    if (val.codecName) {
      config.value.codecName = appConfig.value.recorder.bilibili.codecName;
    }
    if (val.source) {
      if (config.value.providerId === "DouYu") {
        config.value.source = appConfig.value.recorder.douyu.source;
      } else if (config.value.providerId === "HuYa") {
        config.value.source = appConfig.value.recorder.huya.source;
      } else {
        config.value.source = "auto";
      }
    }
    if (val.videoFormat) {
      config.value.videoFormat = appConfig.value.recorder.videoFormat;
    }
    if (val.recorderType) {
      config.value.recorderType = appConfig.value.recorder.recorderType;
    }
    if (val.cookie) {
      config.value.cookie = appConfig.value.recorder.douyin.cookie;
    }
    if (val.doubleScreen) {
      config.value.doubleScreen = appConfig.value.recorder.douyin.doubleScreen;
    }
    if (val.useServerTimestamp) {
      config.value.useServerTimestamp = appConfig.value.recorder.useServerTimestamp;
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
