<template>
  <div class="cut-list">
    <div
      v-for="(cut, index) in cuts"
      :key="index"
      class="cut"
      :class="{
        checked: cut.checked,
      }"
      @dblclick="navVideo(cut.start)"
    >
      <div class="time">
        {{ secondsToTimemark(cut.start) }}-<span>{{
          secondsToTimemark(cut.end || props.videoDuration)
        }}</span>
      </div>
      <div class="name" style="color: skyblue">{{ cut.name }}</div>
      <div v-if="cut.end" class="duration">
        持续时间：{{ secondsToTimemark(cut.end || props.videoDuration - cut.start) }}
      </div>
      <div class="icon">
        <n-icon v-if="cut.checked" size="20" :depth="3" @click.stop="toggleChecked(index)">
          <CheckmarkCircleOutline></CheckmarkCircleOutline>
        </n-icon>
        <n-icon v-else size="20" :depth="3" @click.stop="toggleChecked(index)">
          <RadioButtonOffSharp></RadioButtonOffSharp>
        </n-icon>
      </div>
      <div class="edit-icon">
        <n-icon size="20" :depth="3" @click.stop="editCut(index)">
          <Pencil></Pencil>
        </n-icon>
      </div>
    </div>
  </div>

  <n-modal
    v-model:show="cutEditVisible"
    preset="dialog"
    title="编辑名称"
    :show-icon="false"
    :closable="false"
    auto-focus
  >
    <n-input
      v-model:value="tempCutName"
      placeholder="请输入切片名称"
      @keydown.enter="confirmEditCutName"
    ></n-input>
    <template #action>
      <n-button @click="cutEditVisible = false">取消</n-button>
      <n-button type="primary" @click="confirmEditCutName">确定</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { secondsToTimemark } from "@renderer/utils";
import { useSegmentStore } from "@renderer/stores";
import { RadioButtonOffSharp, CheckmarkCircleOutline, Pencil } from "@vicons/ionicons5";
import { storeToRefs } from "pinia";

interface Props {
  videoDuration: number;
}

const props = withDefaults(defineProps<Props>(), {
  videoDuration: 0,
});
const emits = defineEmits<{
  (event: "seek", value: number): void;
}>();

const { cuts } = storeToRefs(useSegmentStore());

const toggleChecked = (index: number) => {
  cuts.value[index].checked = !cuts.value[index].checked;
};
// 编辑切片名称
const cutEditVisible = ref(false);
const tempCutName = ref("");
const tempCutIndex = ref(-1);
const editCut = (index: number) => {
  console.log(cuts.value[index]);
  cutEditVisible.value = true;
  tempCutName.value = cuts.value[index].name;
  tempCutIndex.value = index;
};

const confirmEditCutName = () => {
  cuts.value[tempCutIndex.value].name = tempCutName.value;
  cutEditVisible.value = false;
};
/**
 * 导航到视频指定位置
 */
const navVideo = (start: number) => {
  emits("seek", start);
};
</script>

<style scoped lang="less">
.cut-list {
  .cut {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 4px 6px;
    margin-bottom: 6px;
    position: relative;
    opacity: 0.5;
    cursor: default;
    &.checked {
      opacity: 1;
    }
    &:hover {
      .icon {
        display: block;
      }
      .edit-icon {
        display: block;
      }
    }
    .time {
    }
    .name {
    }
    .duration {
    }
    .icon {
      display: none;
      cursor: pointer;
      position: absolute;
      right: 4px;
      bottom: 0px;
    }
    .edit-icon {
      display: none;
      cursor: pointer;
      position: absolute;
      right: 24px;
      bottom: 0px;
    }
  }
}
</style>
