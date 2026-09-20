<template>
  <div class="">
    <n-form label-placement="left" :label-width="labelWidth">
      <n-form-item>
        <template #label>
          <Tip
            text="上传线路池"
            tip="每个视频上传会话只会从所选线路池中选择一次线路，同一视频的全部分片不会中途换线。自动线路只能单独使用。"
            placement="bottom"
          ></Tip>
        </template>
        <n-select
          v-model:value="selectedLines"
          :options="lineOptions"
          filterable
          multiple
          :max-tag-count="'responsive'"
          placeholder="请至少选择一条上传线路"
        />
      </n-form-item>
      <n-form-item>
        <template #label>
          <Tip
            text="线路调度"
            tip="单线路固定使用；轮询会按账号在每个新视频上传会话间依次切换；随机只会从所选线路池中选择。"
          ></Tip>
        </template>
        <n-select
          v-model:value="lineStrategy"
          :options="lineStrategyOptions"
          :disabled="selectedLines.length === 1"
        />
      </n-form-item>
      <n-form-item>
        <template #label>
          <Tip text="重试次数" tip="如果你经常上传失败，那么试试拉大参数吧"></Tip>
        </template>
        <n-input-number v-model:value="config.biliUpload.retryTimes" min="0" max="30">
        </n-input-number>
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 重试延迟 </span>
        </template>
        <n-input-number
          v-model:value="config.biliUpload.retryDelay"
          min="0"
          max="10000"
          step="1000"
        >
          <template #suffix>毫秒</template>
        </n-input-number>
      </n-form-item>
      <n-form-item>
        <template #label>
          <Tip text="并发" tip="单个分P内上传并发数，并非全局最大上传任务限制"></Tip>
        </template>
        <n-input-number v-model:value="config.biliUpload.concurrency" min="1" max="128">
        </n-input-number>
      </n-form-item>
      <n-form-item>
        <template #label>
          <Tip text="限速" tip="0为不限速，仅为单个上传任务的限速，并非全局"></Tip>
        </template>
        <n-input-number v-model:value="config.biliUpload.limitRate" min="0" step="1024">
          <template #suffix>KB</template>
        </n-input-number>
      </n-form-item>
      <n-form-item>
        <template #label>
          <Tip
            text="稿件检查间隔"
            tip="用于自动评论及上传审核的检查稿件间隔时间，请勿设置过短以免触发风控"
          ></Tip>
        </template>
        <n-input-number
          v-model:value="config.biliUpload.checkInterval"
          min="60"
          step="60"
          placeholder="请输入检查间隔"
        >
          <template #suffix>秒</template>
        </n-input-number>
      </n-form-item>
      <n-form-item>
        <template #label>
          <Tip
            text="投稿最短间隔"
            tip="默认没有间隔，上传和编辑都会被算入，主要用于对抗风控~"
          ></Tip>
        </template>
        <n-input-number
          v-model:value="config.biliUpload.minUploadInterval"
          min="0"
          step="10"
          placeholder="请输入检查间隔"
        >
          <template #suffix>分钟</template>
        </n-input-number>
      </n-form-item>
      <n-form-item>
        <template #label>
          <Tip
            text="缓存投稿失败视频"
            tip="将上传完成的视频缓存到本地，如果出现投稿失败，可以直接复用视频ID，避免视频重新上传"
          ></Tip>
        </template>
        <n-switch v-model:value="config.biliUpload.useUploadPartPersistence" />
      </n-form-item>
      <n-form-item>
        <template #label>
          <Tip
            text="使用必剪api"
            tip="开启后，投稿使用必剪接口，编辑仍然使用web接口，用于解决部分风控"
          ></Tip>
        </template>
        <n-switch v-model:value="config.biliUpload.useBCutAPI" />
      </n-form-item>
      <n-form-item>
        <template #label>
          <Tip
            text="自动更新帐号授权"
            tip="一天检查一次，过期时间在十天以下时会尝试自动更新，如果因某些情况授权已失效，会更新失败"
          ></Tip>
        </template>
        <n-switch v-model:value="config.biliUpload.accountAutoCheck" />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { useBreakpoints } from "@renderer/hooks";
import {
  BILI_UPLOAD_ACTIVE_LINE_SELECTORS,
  BILI_UPLOAD_LEGACY_LINE_SELECTORS,
  normalizeBiliUploadRouteConfig,
} from "@biliLive-tools/shared/biliUploadRoute.js";
import { resolveBiliUploadLineSelection } from "./biliUploadLines";

import type { AppConfig, BiliUploadLineStrategy } from "@biliLive-tools/types";

const config = defineModel<AppConfig>("data", {
  default: () => {},
});
const { isMobile } = useBreakpoints();
const labelWidth = computed(() => {
  return isMobile.value ? "90px" : "150px";
});

const selectedLines = computed<string[]>({
  get() {
    return normalizeBiliUploadRouteConfig(config.value.biliUpload).lines;
  },
  set(value) {
    const lines = resolveBiliUploadLineSelection(value, selectedLines.value);
    config.value.biliUpload.lines = lines;
    config.value.biliUpload.line = lines[0];
    if (lines.length === 1) {
      config.value.biliUpload.lineStrategy = "fixed";
    } else if (
      config.value.biliUpload.lineStrategy !== "round-robin" &&
      config.value.biliUpload.lineStrategy !== "random"
    ) {
      config.value.biliUpload.lineStrategy = "round-robin";
    }
  },
});

const lineStrategy = computed<BiliUploadLineStrategy>({
  get() {
    return normalizeBiliUploadRouteConfig(config.value.biliUpload).lineStrategy;
  },
  set(value) {
    config.value.biliUpload.lineStrategy = selectedLines.value.length === 1 ? "fixed" : value;
  },
});

const lineStrategyOptions = computed(() => {
  if (selectedLines.value.length === 1) {
    return [{ label: "固定", value: "fixed" }];
  }
  return [
    { label: "轮询", value: "round-robin" },
    { label: "随机", value: "random" },
  ];
});

const lineOptions = [
  { label: "自动", value: "auto" },
  ...BILI_UPLOAD_ACTIVE_LINE_SELECTORS.map((line) => ({ label: line, value: line })),
  {
    type: "group",
    key: "outdated",
    label: "可能已失效线路（仅供测试）",
    children: BILI_UPLOAD_LEGACY_LINE_SELECTORS.map((line) => ({ label: line, value: line })),
  },
];
</script>

<style scoped lang="less">
.item {
  display: flex;
}
</style>
