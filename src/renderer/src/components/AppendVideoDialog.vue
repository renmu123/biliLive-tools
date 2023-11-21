<!-- bili登录弹框 -->
<template>
  <n-modal v-model:show="showModal" :mask-closable="false" auto-focus :on-after-enter="handleOpen">
    <n-card
      style="width: calc(100% - 60px)"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
      class="card"
    >
      <div style="text-align: center">
        <div v-for="item in list" :key="item.stat.aid">
          <image :src="item.Archive.cver" />
        </div>
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

// const props = withDefaults();

const list = ref([]);
const getArchives = async () => {
  const { data } = await window.biliApi.getArchives();
  list.value = data.arc_audits;
  console.log(list.value);
};
const handleOpen = () => {
  console.log("open");
  getArchives();
};
const close = () => {
  showModal.value = false;
};

const confirm = () => {
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
