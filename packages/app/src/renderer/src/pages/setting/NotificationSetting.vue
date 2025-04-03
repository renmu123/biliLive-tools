<template>
  <n-form label-placement="left" :label-width="120">
    <n-form-item label="通知类型">
      <n-select
        v-model:value="config.notification.setting.type"
        :options="typeOptions"
        placeholder="请选择通知类型"
        clearable
      />
      <n-button
        v-if="config.notification.setting.type"
        type="primary"
        style="margin-left: 10px"
        @click="notifyTest"
      >
        测试
      </n-button>
    </n-form-item>

    <template v-if="config.notification.setting.type === NotificationType.mail">
      <n-form-item>
        <template #label>
          <span class="inline-flex">
            <span> 服务器地址 </span>
            <Tip tip="请自行查询并配置服务商的smtp服务器"></Tip>
          </span>
        </template>
        <n-input
          v-model:value="config.notification.setting.mail.host"
          placeholder="请输入服务器地址"
        ></n-input>
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 端口号 </span>
        </template>
        <n-input
          v-model:value="config.notification.setting.mail.port"
          placeholder="请输入端口号"
        ></n-input> </n-form-item
      ><n-form-item>
        <template #label>
          <span class="inline-flex"> TLS </span>
        </template>
        <n-switch v-model:value="config.notification.setting.mail.secure" /> </n-form-item
      ><n-form-item>
        <template #label>
          <span class="inline-flex"> 邮箱账户 </span>
        </template>
        <n-input
          v-model:value="config.notification.setting.mail.user"
          placeholder="请输入邮箱账户"
        ></n-input> </n-form-item
      ><n-form-item>
        <template #label>
          <span class="inline-flex"> 授权码 </span>
        </template>
        <n-input
          v-model:value="config.notification.setting.mail.pass"
          placeholder="请输入授权码"
          type="password"
          show-password-on="click"
        ></n-input> </n-form-item
      ><n-form-item>
        <template #label>
          <span class="inline-flex"> 收件人邮箱 </span>
        </template>
        <n-input
          v-model:value="config.notification.setting.mail.to"
          placeholder="请输入收件人邮箱"
        ></n-input> </n-form-item
    ></template>
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
          type="password"
          placeholder="请输入server酱key"
          show-password-on="click"
        ></n-input> </n-form-item
    ></template>
    <template v-else-if="config.notification.setting.type === NotificationType.tg">
      <n-form-item>
        <template #label>
          <span class="inline-flex"> token </span>
        </template>
        <n-input
          v-model:value="config.notification.setting.tg.key"
          placeholder="请输入tg bot的token"
          type="password"
          show-password-on="click"
        ></n-input> </n-form-item
      ><n-form-item>
        <template #label>
          <span class="inline-flex"> chat_id </span>
        </template>
        <n-input
          v-model:value="config.notification.setting.tg.chat_id"
          placeholder="请输入chat_id"
        ></n-input> </n-form-item
    ></template>
    <template v-else-if="config.notification.setting.type === NotificationType.ntfy">
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 服务器地址 </span>
        </template>
        <n-input
          v-model:value="config.notification.setting.ntfy.url"
          placeholder="请输入服务器地址"
        ></n-input> </n-form-item
      ><n-form-item>
        <template #label>
          <span class="inline-flex"> topic </span>
        </template>
        <n-input
          v-model:value="config.notification.setting.ntfy.topic"
          placeholder="请输入topic"
        ></n-input> </n-form-item
    ></template>
    <template v-else-if="config.notification.setting.type === NotificationType.allInOne">
      <n-form-item>
        <template #label>
          <Tip
            tip="项目：https://github.com/CaoMeiYouRen/push-all-in-cloud，包含/push"
            text="服务器地址"
          ></Tip>
        </template>
        <n-input
          v-model:value="config.notification.setting.allInOne.server"
          placeholder="请输入服务器地址"
        ></n-input> </n-form-item
      ><n-form-item>
        <template #label>
          <span class="inline-flex"> Push Key </span>
        </template>
        <n-input
          v-model:value="config.notification.setting.allInOne.key"
          placeholder="请输入push key"
          type="password"
          show-password-on="click"
        ></n-input> </n-form-item
    ></template>

    <n-divider />

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
    <n-form-item label="B站下载任务">
      <n-checkbox-group v-model:value="config.notification.task.download">
        <n-space item-style="display: flex;">
          <n-checkbox value="success" label="成功" />
          <n-checkbox value="failure" label="失败" />
        </n-space>
      </n-checkbox-group>
    </n-form-item>
    <n-form-item label="斗鱼下载任务">
      <n-checkbox-group v-model:value="config.notification.task.douyuDownload">
        <n-space item-style="display: flex;">
          <n-checkbox value="success" label="成功" />
          <n-checkbox value="failure" label="失败" />
        </n-space>
      </n-checkbox-group>
    </n-form-item>
    <n-form-item label="稿件审核状态">
      <n-checkbox-group v-model:value="config.notification.task.mediaStatusCheck">
        <n-space item-style="display: flex;">
          <n-checkbox value="success" label="通过" />
          <n-checkbox value="failure" label="失败" />
        </n-space>
      </n-checkbox-group>
    </n-form-item>
    <n-form-item label="直播通知">
      <n-select
        v-model:value="config.notification.taskNotificationType.liveStart"
        :options="typeOptions"
        placeholder="请选择通知类型，不选则使用全局通知类型"
        clearable
        style="width: 200px"
      />
    </n-form-item>
    <n-form-item>
      <template #label>
        <Tip
          tip="检测目录的磁盘空间，如果低于阈值则发送通知，两个小时检查一次"
          text="硬盘容量检测"
        ></Tip>
      </template>
      <n-checkbox-group v-model:value="config.notification.task.diskSpaceCheck.values">
        <n-space item-style="display: flex;">
          <n-checkbox value="bilirecorder" label="录播姬工作目录" />
          <n-checkbox value="bililiveTools" label="直播录制目录" />
        </n-space>
      </n-checkbox-group>

      <n-input-number
        v-model:value="config.notification.task.diskSpaceCheck.threshold"
        step="1"
        min="1"
      >
        <template #suffix> GB </template>
      </n-input-number>
    </n-form-item>
  </n-form>
</template>

<script setup lang="ts">
import { configApi } from "@renderer/apis";
import { cloneDeep } from "lodash-es";
import { NotificationType } from "@biliLive-tools/shared/enum.js";

import type { AppConfig } from "@biliLive-tools/types";

const config = defineModel<AppConfig>("data", {
  default: () => {},
});

const typeOptions = [
  { value: NotificationType.system, label: "系统通知" },
  { value: NotificationType.mail, label: "邮箱" },
  { value: NotificationType.tg, label: "tg bot" },
  { value: NotificationType.server, label: "server酱" },
  { value: NotificationType.ntfy, label: "ntfy" },
  { value: NotificationType.allInOne, label: "push all in cloud" },
];

const notice = useNotification();

const notifyTest = async () => {
  await configApi.notifyTest(
    "我是一条测试信息",
    "我是一条测试信息",
    cloneDeep(config.value),
    config.value.notification.setting.type,
  );
  notice.info({
    title: "已尝试发送测试信息，请注意查收",
    duration: 2000,
  });
};
</script>

<style scoped lang="less">
.item {
  display: flex;
}
</style>
