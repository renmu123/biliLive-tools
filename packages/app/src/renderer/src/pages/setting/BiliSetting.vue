<template>
  <div class="">
    <h2>Bilibili上传配置</h2>
    <n-form label-placement="left" :label-width="140">
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
          <span class="inline-flex"> 并发 </span>
        </template>
        <n-input-number v-model:value="config.biliUpload.concurrency" min="1" max="128">
        </n-input-number>
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex">
            检查间隔
            <Tip tip="用于自动评论的检查稿件间隔时间，请勿设置过短以免触发风控"></Tip>
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
  { label: "bda2", value: "bda2" },
  { label: "qn", value: "qn" },
  { label: "qnhk", value: "qnhk" },
  { label: "bldsa", value: "bldsa" },
];
</script>

<style scoped lang="less">
.item {
  display: flex;
}
</style>
