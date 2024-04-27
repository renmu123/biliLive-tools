<template>
  <div>
    <draggable v-model="fileList" :options="options" item-key="id" handle=".handle">
      <template #item="{ element, index }">
        <div :key="element.id" class="draggable">
          <n-icon v-if="props.sort" size="20" class="handle">
            <MoveIcon />
          </n-icon>
          <n-input
            v-if="element.visible"
            v-model:value="element.title"
            type="text"
            :placeholder="props.placeholder"
            :maxlength="80"
            @keyup.enter="element.visible = false"
          />
          <span v-else>{{ element.title }}</span>

          <n-icon
            style="margin-left: auto"
            size="20"
            class="pointer"
            @click="element.visible = !element.visible"
          >
            <EditOutlined />
          </n-icon>
          <n-icon size="20" class="remove" @click="remove(index)">
            <CloseIcon />
          </n-icon>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup lang="ts">
import draggable from "vuedraggable";

import { Move as MoveIcon, Close as CloseIcon } from "@vicons/ionicons5";
import { EditOutlined } from "@vicons/material";

const fileList = defineModel<
  {
    id: string;
    title: string;
    path: string;
    visible: boolean;
  }[]
>({ required: true });

const props = withDefaults(
  defineProps<{
    sort?: boolean;
    placeholder?: string;
  }>(),
  {
    sort: true,
    placeholder: "请输入",
  },
);

const options = computed(() => {
  return {
    handle: ".handle",
    animation: 250,
  };
});

const remove = (index: number) => {
  fileList.value.splice(index, 1);
};
</script>

<style scoped lang="less">
.draggable {
  padding: 10px;
  margin: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  display: flex;
  align-items: center;
}
.handle {
  cursor: move;
  margin-right: 10px;
}
.remove {
  cursor: pointer;
}
</style>
