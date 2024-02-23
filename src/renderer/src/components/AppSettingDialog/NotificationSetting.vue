<template>
  <div class="">
    <n-form ref="formRef" label-placement="left" :label-width="120">
      <h2>通知配置</h2>
      <n-form-item label="通知类型">
        <n-select v-model:value="config.notification.setting.type" :options="typeOptions" />
      </n-form-item>

      <template v-if="config.notification.setting.type === NotificationType.mail"></template>
      <template v-else-if="config.notification.setting.type === NotificationType.server">
        <n-form-item>
          <template #label>
            <span class="inline-flex">
              key
              <Tip tip="详情请参考官网：https://sct.ftqq.com/"></Tip>
            </span>
          </template>
          <n-input
            v-model:value="config.notification.setting.server.key"
            placeholder="请输入server酱key"
          ></n-input> </n-form-item
      ></template>

      <h2>任务</h2>
      <n-form-item label="ffmpeg任务">
        <n-checkbox-group v-model:value="config.notification.task.ffmpeg">
          <n-space item-style="display: flex;">
            <n-checkbox value="success" label="成功" />
            <n-checkbox value="failure" label="失败" />
          </n-space>
        </n-checkbox-group>
      </n-form-item>
      <n-form-item label="弹幕转换任务">
        <n-checkbox-group v-model:value="config.notification.task.danmu">
          <n-space item-style="display: flex;">
            <n-checkbox value="success" label="成功" />
            <n-checkbox value="failure" label="失败" />
          </n-space>
        </n-checkbox-group>
      </n-form-item>
      <n-form-item label="上传任务">
        <n-checkbox-group v-model:value="config.notification.task.upload">
          <n-space item-style="display: flex;">
            <n-checkbox value="success" label="成功" />
            <n-checkbox value="failure" label="失败" />
          </n-space>
        </n-checkbox-group>
      </n-form-item>
      <n-form-item label="下载任务">
        <n-checkbox-group v-model:value="config.notification.task.download">
          <n-space item-style="display: flex;">
            <n-checkbox value="success" label="成功" />
            <n-checkbox value="failure" label="失败" />
          </n-space>
        </n-checkbox-group>
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import type { AppConfig } from "../../../../types";
import { NotificationType } from "../../../../types/enum";

const config = defineModel<AppConfig>("data", {
  default: () => {},
});

const typeOptions = [
  { value: undefined, label: "无" },
  { value: NotificationType.mail, label: "邮箱" },
  { value: NotificationType.server, label: "server酱" },
];
</script>

<style scoped lang="less">
.item {
  display: flex;
}
</style>
