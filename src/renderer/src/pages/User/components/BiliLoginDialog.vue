<!-- biliup登录弹框 -->
<template>
  <n-modal v-model:show="showModal" :mask-closable="false" auto-focus>
    <n-card
      style="width: calc(100% - 60px)"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
      class="card"
    >
      <div style="text-align: center">
        <h2 v-if="text">登录成功，请关闭本窗口</h2>
        <h2>使用b站app扫码完成登录<br /></h2>
        <QRCodeVue3 v-if="url" :value="url" />
      </div>
      <template #footer>
        <div class="footer">
          <n-button class="btn" @click="close">取消</n-button>
          <n-button type="primary" class="btn" @click="confirm"> 确认 </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import QRCodeVue3 from "qrcode-vue3";

const showModal = defineModel<boolean>({ required: true, default: false });
const emits = defineEmits<{
  close: [];
}>();

const notice = useNotification();

const url = ref("");
const text = ref("");
const onOpen = async () => {
  text.value = "";
  url.value = await window.api.bili.login();

  window.api.bili.onLogin("completed", async (_, res) => {
    console.log("completed", res);
    text.value = "登录成功，请关闭本窗口";
    try {
      notice.success({
        title: "登录成功",
        duration: 1000,
      });
      confirm();
    } catch (e: unknown) {
      notice.error({
        title: "登录失败",
        description: String(e),
      });
    }
  });
  window.api.bili.onLogin("error", (_, res) => {
    console.log("error", res);
    text.value = res.message;
  });
};

const close = () => {
  showModal.value = false;
};

const confirm = () => {
  showModal.value = false;
};

watch(
  () => showModal.value,
  () => {
    if (showModal.value) {
      onOpen();
    } else {
      window.api.bili.loginCancel();
      emits("close");
    }
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
</style>
