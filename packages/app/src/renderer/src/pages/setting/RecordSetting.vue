<template>
  <div class="">
    <h2>录制配置</h2>
    <p style="color: red">部分并非实时生效，需停止当前录制再重新开始</p>
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
      <n-form-item style="display: none">
        <template #label>
          <span class="inline-flex"> 自动录制 </span>
        </template>
        <n-switch v-model:value="config.recorder.autoRecord" />
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex">
            检查间隔
            <Tip tip="注意风控"></Tip>
          </span>
        </template>
        <n-input-number v-model:value="config.recorder.checkInterval" min="10" step="10">
          <template #suffix>秒</template>
        </n-input-number>
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex">
            分段录制
            <Tip tip="0为不分段"></Tip>
          </span>
        </template>
        <n-input-number v-model:value="config.recorder.segment" min="0" step="10">
          <template #suffix>分钟</template>
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
          <span class="inline-flex"> 禁止弹幕录制 </span>
        </template>
        <n-switch v-model:value="config.recorder.disableProvideCommentsWhenRecording" />
      </n-form-item>
      <n-form-item v-if="!config.recorder.disableProvideCommentsWhenRecording">
        <template #label>
          <span class="inline-flex"> 保存礼物 </span>
        </template>
        <n-switch v-model:value="config.recorder.saveGiftDanma" />
      </n-form-item>
      <n-form-item v-if="!config.recorder.disableProvideCommentsWhenRecording">
        <template #label>
          <span class="inline-flex"> 保存高能弹幕 </span>
        </template>
        <n-switch v-model:value="config.recorder.saveSCDanma" />
      </n-form-item>
      <!-- <n-form-item v-if="!config.recorder.disableProvideCommentsWhenRecording">
        <template #label>
          <span class="inline-flex"> 自动转换为ass </span>
        </template>
        待实现
      </n-form-item>
      <n-form-item v-if="!config.recorder.disableProvideCommentsWhenRecording && false">
        <template #label>
          <span class="inline-flex"> ass转换预设 </span>
        </template>
        待实现
      </n-form-item> -->
    </n-form>
  </div>
</template>

<script setup lang="ts">
import type { AppConfig } from "@biliLive-tools/types";

const config = defineModel<AppConfig>("data", {
  default: () => {},
});

const qualityOptions = [
  { value: "highest", label: "最高" },
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
  { value: "lowest", label: "最低" },
];
</script>

<style scoped lang="less">
.item {
  display: flex;
}
</style>
