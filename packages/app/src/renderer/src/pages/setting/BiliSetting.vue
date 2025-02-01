<template>
  <div class="">
    <n-form label-placement="left" :label-width="150">
      <n-form-item>
        <template #label>
          <span class="inline-flex">
            线路
            <Tip
              :tip="`上传线路，自动会根据网络情况选择最优线路，如果上传失败请手动选择线路，切换后请上传测试线路能否实际使用。<br/>访问查询：<a href='https://member.bilibili.com/preupload?r=ping' target='_blank'>https://member.bilibili.com/preupload?r=ping</a>`"
            ></Tip>
          </span>
        </template>
        <n-select v-model:value="config.biliUpload.line" :options="lineOptions" />
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 重试次数 </span>
        </template>
        <n-input-number v-model:value="config.biliUpload.retryTimes" min="0" max="20">
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
          <span class="inline-flex">
            并发
            <Tip tip="单个分P上传并发数，并非全局最大上传数"></Tip>
          </span>
        </template>
        <n-input-number v-model:value="config.biliUpload.concurrency" min="1" max="128">
        </n-input-number>
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex">
            限速
            <Tip tip="0为不限速，仅为单个上传任务的限速，并非全局"></Tip>
          </span>
        </template>
        <n-input-number v-model:value="config.biliUpload.limitRate" min="0" step="1024">
          <template #suffix>KB</template>
        </n-input-number>
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex">
            稿件检查间隔
            <Tip tip="用于自动评论及上传审核的检查稿件间隔时间，请勿设置过短以免触发风控"></Tip>
          </span>
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
import type { AppConfig } from "@biliLive-tools/types";

const config = defineModel<AppConfig>("data", {
  default: () => {},
});

const lineOptions = [
  { label: "自动", value: "auto" },
  { label: "cs-bda2", value: "cs-bda2" },
  { label: "cs-bldsa", value: "cs-bldsa" },
  { label: "cs-tx", value: "cs-tx" },
  { label: "cs-txa", value: "cs-txa" },
  { label: "cs-alia", value: "cs-alia" },
  { label: "jd-bldsa", value: "jd-bldsa" },
  { label: "jd-bd", value: "jd-bd" },
  { label: "jd-tx", value: "jd-tx" },
  { label: "jd-txa", value: "jd-txa" },
  { label: "jd-alia", value: "jd-alia" },
];
</script>

<style scoped lang="less">
.item {
  display: flex;
}
</style>
