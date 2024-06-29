<template>
  <div>
    <draggable v-model="fileList" :options="options" item-key="id" handle=".handle">
      <template #item="{ element, index }">
        <div :key="element.id" class="draggable" :title="element.path">
          <n-icon v-if="props.sort" size="20" class="handle">
            <MoveIcon />
          </n-icon>
          <editableText
            v-model="element.title"
            class="editable-text"
            :placeholder="placeholder"
            :validate="validate"
            :update="update"
          ></editableText>

          <n-icon style="margin-left: auto" size="20" class="remove" @click="remove(index)">
            <CloseIcon />
          </n-icon>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup lang="ts">
import draggable from "vuedraggable";

import editableText from "@renderer/components/EditableText.vue";
import { Move as MoveIcon, Close as CloseIcon } from "@vicons/ionicons5";
import filenamify from "filenamify/browser";

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
    placeholder: "请输入文件名",
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

// input相关操作
const validate = (value: string) => {
  return value.trim() !== "";
};
const update = (value: string) => {
  return filenamify(value.trim(), { replacement: "" });
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
  &:has(.editable-text:focus) {
    border: 1px solid #36ad6a;
  }
}
.handle {
  cursor: move;
  margin-right: 10px;
}
.remove {
  cursor: pointer;
  :hover {
    color: #18a058;
  }
}
</style>
