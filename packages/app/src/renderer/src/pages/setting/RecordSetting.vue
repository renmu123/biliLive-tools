<template>
  <div class="">
    <h2>录制配置</h2>
    <n-form label-placement="left" :label-width="140">
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 保存文件夹 </span>
        </template>
        <n-input
          v-model:value="config.recorder.savePath"
          placeholder="请选择要保存的文件夹"
          clearable
        />
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 文件命名规则 </span>
        </template>
        <n-input
          v-model:value="config.recorder.nameRule"
          placeholder="请输入文件命名规则"
          clearable
        />
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 自动录制 </span>
        </template>
        <n-switch v-model:value="config.recorder.autoRecord" />
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 检查间隔 </span>
        </template>
        <n-input-number v-model:value="config.recorder.checkInterval" min="10" step="10">
          <template #suffix>秒</template>
        </n-input-number>
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 画质 </span>
        </template>
        <n-select v-model:value="config.recorder.quality" :options="qualityOptions" />
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
        <n-switch v-model:value="config.recorder.recordDanmaku" />
      </n-form-item>
      <n-form-item v-if="config.recorder.recordDanmaku">
        <template #label>
          <span class="inline-flex"> 保存礼物 </span>
        </template>
        待实现
      </n-form-item>
      <n-form-item v-if="config.recorder.recordDanmaku">
        <template #label>
          <span class="inline-flex"> 保存高能弹幕 </span>
        </template>
        待实现
      </n-form-item>
      <n-form-item v-if="config.recorder.recordDanmaku">
        <template #label>
          <span class="inline-flex"> 自动转换为ass </span>
        </template>
        待实现
      </n-form-item>
      <n-form-item v-if="config.recorder.recordDanmaku && false">
        <template #label>
          <span class="inline-flex"> ass转换预设 </span>
        </template>
        待实现
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import type { AppConfig } from "@biliLive-tools/types";

const config = defineModel<AppConfig>("data", {
  default: () => {},
});

const qualityOptions = [
  { label: "highest", value: "最高" },
  { label: "high", value: "高" },
  { label: "medium", value: "中" },
  { label: "low", value: "低" },
  { label: "lowest", value: "最低" },
];
</script>

<style scoped lang="less">
.item {
  display: flex;
}
</style>
