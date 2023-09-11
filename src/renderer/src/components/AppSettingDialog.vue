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
      <div>
        <n-form ref="formRef" label-placement="left" :label-width="80">
          <n-form-item label="姓名">
            <n-input v-model:value="config.logLevel" placeholder="输入姓名" />
          </n-form-item>
          <!-- <n-form-item label="年龄">
            <n-input v-model:value="formValue.user.age" placeholder="输入年龄" />
          </n-form-item>
          <n-form-item label="电话号码">
            <n-input v-model:value="formValue.phone" placeholder="电话号码" />
          </n-form-item> -->
        </n-form>
      </div>
      <template #footer>
        <div class="footer">
          <n-button class="btn" @click="close">取消</n-button>
          <n-button type="primary" class="btn" @click="saveConfig"> 确认 </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
const showModal = defineModel<boolean>({ required: true, default: false });

// @ts-ignore
const config = ref({
  logLevel: "info",
});

// const handleChange = (value: DanmuConfig) => {
//   config.value = value;
// };

const saveConfig = async () => {
  // await window.api.saveDanmuConfig(toRaw(config.value));
  close();
};

const close = () => {
  showModal.value = false;
};
</script>

<style scoped lang="less">
.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 10px;
  }
}
</style>
