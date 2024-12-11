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
        <p>续传只会增加分p，不会对稿件进行编辑</p>
        <div style="display: flex; gap: 10px; align-items: center">
          <n-pagination
            v-model:page="page"
            :page-count="pageCount"
            size="medium"
            show-quick-jumper
          />

          <n-button style="margin-left: auto" class="btn" @click="close">取消</n-button>
          <n-button type="primary" class="btn" @click="confirm"> 确认 </n-button>
        </div>
        <div class="media-container">
          <div
            v-for="item in list"
            :key="item.Archive.aid"
            class="media"
            :class="{ selected: aid == item.Archive.aid }"
            @click="selectMedia(item)"
          >
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
import { biliApi } from "@renderer/apis";

const { appConfig } = storeToRefs(useAppConfig());

const showModal = defineModel<boolean>("visible", { required: true, default: false });
const aid = defineModel<string>({ required: true });
const emits = defineEmits<{
  confirm: [aid: string];
}>();
const notice = useNotification();

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

const page = ref(1);
const pageCount = ref(1);

watch(
  () => page.value,
  () => {
    getArchives();
  },
);

const getArchives = async () => {
  const uid = appConfig.value.uid;
  if (!uid) {
    notice.warning({
      title: "请先登录",
      duration: 500,
    });
    return;
  }
  const data = await biliApi.getArchives(
    {
      pn: page.value,
      ps: 20,
    },
    uid,
  );
  pageCount.value = Math.ceil(data.page.count / data.page.ps);

  list.value = data.arc_audits;
};
const handleOpen = () => {
  getArchives();
};
const close = () => {
  aid.value = "";
  showModal.value = false;
};

const confirm = async () => {
  if (!aid.value) {
    return;
  }
  emits("confirm", aid.value);
  showModal.value = false;
};

const selectMedia = (item) => {
  aid.value = String(item.Archive.aid);
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
  padding: 10px 0;
  gap: 10px;
  @media screen and (prefers-color-scheme: dark) {
    background: none;
  }

  .media {
    padding: 10px;
    background-color: white;
    @media screen and (prefers-color-scheme: dark) {
      background: none;
    }
    border: 2px solid #eee;
    border-radius: 5px;

    width: 160px;
    .cover {
      width: 160px;
      height: 100px;
    }
    &.selected {
      border-color: #358457;
    }
  }
}
</style>
