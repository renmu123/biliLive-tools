<!-- bili登录弹框 -->
<template>
  <n-modal v-model:show="showModal" :mask-closable="false" auto-focus :on-after-enter="handleOpen">
    <n-card
      style="width: calc(100% - 60px); max-height: 80%"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
      class="card"
    >
      <div>
        <div style="display: flex; gap: 10px">
          <n-input v-model:value="aid" placeholder="请输入需要续传视频的aid" />
          <n-button class="btn" @click="close">取消</n-button>
          <n-button type="primary" class="btn" @click="confirm"> 确认 </n-button>
        </div>
        <div class="media-container">
          <div v-for="item in list" :key="item.stat.aid" class="media" @click="selectMedia(item)">
            <img :src="item.Archive.cover" referrerpolicy="no-referrer" class="cover" />
            <div class="title">{{ item.Archive.title }}</div>
          </div>
        </div>
      </div>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
const showModal = defineModel<boolean>("visible", { required: true, default: false });
const aid = defineModel<number>({ required: true });
const emits = defineEmits<{
  confirm: [aid: number];
}>();

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
  if (!aid.value) {
    return;
  }
  emits("confirm", aid.value);
  showModal.value = false;
};

const selectMedia = (item) => {
  aid.value = item.stat.aid;
};
</script>

<style scoped lang="less">
.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 10px;
  }
}

.media-container {
  display: flex;
  flex-wrap: wrap;
  background-color: #eee;
  justify-content: center;
  margin-top: 20px;
  gap: 10px;

  .media {
    padding: 10px;
    background-color: white;
    border: 2px solid #fff;

    width: 160px;
    .cover {
      width: 160px;
      height: 100px;
    }
  }
  .media:hover {
    cursor: pointer;
    border-color: skyblue;
  }
}
</style>
