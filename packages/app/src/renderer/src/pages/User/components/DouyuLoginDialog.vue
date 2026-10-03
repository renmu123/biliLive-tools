<template>
  <n-modal v-model:show="showModal" :mask-closable="false" auto-focus>
    <n-card
      style="width: calc(100% - 60px); max-width: 520px"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
    >
      <div class="content">
        <h2>{{ text || "使用斗鱼 App 扫码登录" }}</h2>
        <n-qr-code v-if="url" :value="url" color="#ff6a2a" background-color="#fff" :size="250" />
      </div>
      <template #footer>
        <div class="footer">
          <n-button @click="close">取消</n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { douyuApi } from "@renderer/apis";

const showModal = defineModel<boolean>({ required: true, default: false });
const emits = defineEmits<{ confirm: []; close: [] }>();
const notice = useNotification();
const url = ref("");
const id = ref("");
const text = ref("");
let timer: number | undefined;
let completed = false;

const clearTimer = () => {
  if (timer !== undefined) window.clearTimeout(timer);
  timer = undefined;
};

const poll = async () => {
  if (!showModal.value || !id.value) return;
  try {
    const result = await douyuApi.loginPoll(id.value);
    if (result.status === "completed") {
      completed = true;
      notice.success({ title: "斗鱼登录成功", duration: 1000 });
      emits("confirm");
      showModal.value = false;
      return;
    }
    if (result.status === "error") {
      text.value = result.failReason || "登录失败";
      notice.error({ title: "斗鱼登录失败", description: text.value });
      return;
    }
    timer = window.setTimeout(poll, 2000);
  } catch (error) {
    text.value = error instanceof Error ? error.message : "登录失败";
  }
};

const onOpen = async () => {
  completed = false;
  url.value = "";
  id.value = "";
  text.value = "正在获取二维码…";
  try {
    const result = await douyuApi.qrcode();
    if (!showModal.value) return;
    id.value = result.id;
    url.value = result.url;
    text.value = "使用斗鱼 App 扫码登录";
    timer = window.setTimeout(poll, 1000);
  } catch (error) {
    text.value = error instanceof Error ? error.message : "获取二维码失败";
  }
};

const close = () => {
  showModal.value = false;
};

watch(showModal, async (visible) => {
  if (visible) {
    await onOpen();
  } else {
    clearTimer();
    if (!completed && id.value) {
      await douyuApi.loginCancel(id.value).catch(() => undefined);
    }
    emits("close");
  }
});

onBeforeUnmount(clearTimer);
</script>

<style scoped>
.content {
  text-align: center;
}
.footer {
  text-align: right;
}
</style>
