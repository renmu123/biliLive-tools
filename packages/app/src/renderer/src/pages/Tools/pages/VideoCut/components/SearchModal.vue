<template>
  <n-modal v-model:show="showModal" auto-focus :on-after-enter="handleOpen">
    <n-card
      style="width: calc(100% - 60px); max-height: 80%"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
      class="card"
    >
      <n-spin :show="loading">
        <n-input-group>
          <n-input v-model:value="form.value" placeholder="请输入关键字" @keyup.enter="search" />
          <n-button type="primary" ghost @click="search"> 搜索 </n-button>
        </n-input-group>
        <div style="margin-top: 10px">
          <n-radio-group v-model:value="form.content" name="radiogroup">
            <n-space>
              <n-radio value="content"> 内容 </n-radio>
              <n-radio value="user"> 用户名 </n-radio>
            </n-space>
          </n-radio-group>
          <n-checkbox v-model:checked="form.sc">sc</n-checkbox>
        </div>

        <n-virtual-list class="content" :item-size="30" :items="displayList">
          <template #default="{ item }">
            <div :key="`${item.ts}-${item.text}`" class="item" style="height: 30px">
              <span>{{ secondsToTimemark(item.ts) }}</span>
              <span style="color: #2b94ff">{{ item.user }}</span>
              <span v-if="item.type === 'sc'" style="color: #e57272">sc</span>
              <span> {{ item.text }}</span>
              <n-icon
                class="pointer"
                size="20"
                :depth="3"
                title="添加到切片"
                @click="addSegment(item)"
              >
                <AddIcon></AddIcon>
              </n-icon>
            </div>
          </template>
        </n-virtual-list>
      </n-spin>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { secondsToTimemark } from "@renderer/utils";
import { AddCircleOutline as AddIcon } from "@vicons/ionicons5";
import { watchThrottled } from "@vueuse/core";
import type { DanmuItem } from "@biliLive-tools/types";

interface Props {
  file: string | null;
  danmaList: DanmuItem[];
}
const props = defineProps<Props>();
const showModal = defineModel<boolean>("visible", { required: true, default: false });
const emits = defineEmits<{
  (
    event: "add-segment",
    value: {
      start?: number;
      end?: number;
      name?: string;
    },
  ): void;
}>();
const notice = useNotification();

const form = reactive({
  value: "",
  content: "content",
  sc: false,
});

const list = computed(() => props.danmaList);
const loading = ref(false);

const handleOpen = async () => {
  // open
  displayList.value = list.value;
};
const search = async () => {
  if (!form.value) return;
};

const displayList = ref<DanmuItem[]>([]);
watchThrottled(
  () => form,
  async () => {
    let data = list.value;
    if (form.sc) {
      data = list.value.filter((item) => item.type === "sc");
    }

    if (!form.value) {
      displayList.value = data;
    } else {
      {
        displayList.value = data.filter((item) => {
          if (form.content === "content") {
            if (!item.text) return false;
            console.log(item.text, form.value);
            return item.text.includes(form.value);
          } else {
            if (!item.user) return false;
            return item.user.includes(form.value);
          }
        });
      }
    }
  },
  { throttle: 500, deep: true },
);

// const displayList = computed(() => {
//   let data = list.value;
//   if (form.sc) {
//     data = list.value.filter((item) => item.type === "sc");
//   }

//   if (!form.value) return data;
//   return data.filter((item) => {
//     if (form.content === "content") {
//       if (!item.text) return false;
//       console.log(item.text, form.value);
//       return item.text.includes(form.value);
//     } else {
//       if (!item.user) return false;
//       return item.user.includes(form.value);
//     }
//   });
// });

const addSegment = (item: DanmuItem) => {
  emits("add-segment", {
    start: 0,
    end: item.ts,
    name: item.text,
  });
  notice.success({
    title: "添加成功",
    duration: 1000,
  });
};
</script>

<style scoped lang="less">
.content {
  min-height: 500px;
  margin-top: 20px;
  max-height: 500px;

  .item {
    display: flex;
    gap: 10px;
  }
}
</style>
