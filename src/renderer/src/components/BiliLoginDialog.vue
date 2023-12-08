<!-- bili登录弹框 -->
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
        <template v-if="props.success === 'start'">
          <h2>
            检测到你正在进行登录，请根据提示完成登录，完成登录后回到本应用继续操作<br />
            推荐使用浏览器或扫描二维码登录<br />
            如无法扫码，请在本页面点击“读取最新二维码”按钮，然后使用B站官方客户端扫描二维码登录
          </h2>
          <n-button type="primary" @click="readQrCode">读取最新二维码</n-button>
          <div v-if="qrCodeImage">
            <img height="150" width="150" :src="qrCodeImage" />
          </div>
        </template>

        <h2 v-else-if="props.success === 'success'">登录成功，请关闭本窗口</h2>
        <h2 v-else-if="props.success === 'fail'" style="color: red">
          登录失败，可能是由于你关闭了登录窗口或者该登录方法已失效，请重试
        </h2>
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
const showModal = defineModel<boolean>({ required: true, default: false });
const emits = defineEmits<{
  close: [string];
}>();

const notice = useNotification();

const props = withDefaults(
  defineProps<{
    success?: "start" | "success" | "fail";
  }>(),
  {
    success: "start",
  },
);

watch(
  () => props.success,
  async (val) => {
    if (val === "success") {
      // 登录成功后将cookies保存到用户文件夹
      try {
        await window.api.bili.saveCookie();
        window.biliApi.loadCookie();
        notice.success({
          title: "保存B站登录信息成功",
          duration: 2000,
        });
      } catch (e: unknown) {
        console.log(e);

        notice.error({
          title: "保存B站登录信息失败",
          description: String(e),
        });
      }
    }
  },
);

const qrCodeImage = ref("");
const readQrCode = async () => {
  const base64Image = await window.api.bili.readQrCode();
  qrCodeImage.value = `data:image/png;base64,${base64Image}`;
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
    emits("close", props.success);
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
