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
        <p style="color: red">续传只会增加分p，不会对稿件进行编辑</p>
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
import { useAppConfig } from "@renderer/stores";
import { storeToRefs } from "pinia";

const { appConfig } = storeToRefs(useAppConfig());

const showModal = defineModel<boolean>("visible", { required: true, default: false });
const aid = defineModel<string>({ required: true });
const emits = defineEmits<{
  confirm: [aid: string];
}>();

// const props = withDefaults();

const list = ref<
  {
    stat: {
      aid: number;
      [key: string]: any;
    };
    Archive: {
      title: string;
      cover: string;
      [key: string]: any;
    };
    [key: string]: any;
  }[]
>([]);

const notice = useNotification();
const getArchives = async () => {
  const uid = appConfig.value.uid;
  if (!uid) {
    notice.warning({
      title: "请先登录",
      duration: 500,
    });
    return;
  }
  const data = await window.api.bili.getArchives(
    {
      pn: 1,
      ps: 20,
    },
    uid,
  );
  list.value = data.arc_audits;
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
  aid.value = String(item.stat.aid);
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
