<template>
  <div class="cut-list">
    <div class="btns">
      <n-icon
        size="20"
        class="pointer icon"
        title="在当前时间开始当前片段"
        style="padding: 4px"
        @click="setStartTime"
      >
        <svg
          stroke="currentColor"
          fill="currentColor"
          stroke-width="0"
          viewBox="0 0 384 512"
          role="button"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M135.652 0c23.625 0 43.826 20.65 43.826 44.8v99.851c17.048-16.34 49.766-18.346 70.944 6.299 22.829-14.288 53.017-2.147 62.315 16.45C361.878 158.426 384 189.346 384 240c0 2.746-.203 13.276-.195 16 .168 61.971-31.065 76.894-38.315 123.731C343.683 391.404 333.599 400 321.786 400H150.261l-.001-.002c-18.366-.011-35.889-10.607-43.845-28.464C93.421 342.648 57.377 276.122 29.092 264 10.897 256.203.008 242.616 0 224c-.014-34.222 35.098-57.752 66.908-44.119 8.359 3.583 16.67 8.312 24.918 14.153V44.8c0-23.45 20.543-44.8 43.826-44.8zM136 416h192c13.255 0 24 10.745 24 24v48c0 13.255-10.745 24-24 24H136c-13.255 0-24-10.745-24-24v-48c0-13.255 10.745-24 24-24zm168 28c-11.046 0-20 8.954-20 20s8.954 20 20 20 20-8.954 20-20-8.954-20-20-20z"
          ></path>
        </svg>
      </n-icon>
      <n-icon size="24" class="pointer icon cut-add-segment" title="添加片段" @click="addCut">
        <PlusOutlined></PlusOutlined>
      </n-icon>
      <n-icon size="24" class="pointer icon" title="删除片段" @click="deleteCut">
        <MinusOutlined></MinusOutlined>
      </n-icon>
      <n-icon
        size="20"
        class="pointer icon cut-set-end"
        title="在当前时间结束当前片段"
        style="padding: 4px"
        @click="setEndTime"
      >
        <svg
          stroke="currentColor"
          fill="currentColor"
          stroke-width="0"
          viewBox="0 0 384 512"
          role="button"
          xmlns="http://www.w3.org/2000/svg"
          style="transform: matrix(-1, 0, 0, 1, 0, 0)"
        >
          <path
            d="M135.652 0c23.625 0 43.826 20.65 43.826 44.8v99.851c17.048-16.34 49.766-18.346 70.944 6.299 22.829-14.288 53.017-2.147 62.315 16.45C361.878 158.426 384 189.346 384 240c0 2.746-.203 13.276-.195 16 .168 61.971-31.065 76.894-38.315 123.731C343.683 391.404 333.599 400 321.786 400H150.261l-.001-.002c-18.366-.011-35.889-10.607-43.845-28.464C93.421 342.648 57.377 276.122 29.092 264 10.897 256.203.008 242.616 0 224c-.014-34.222 35.098-57.752 66.908-44.119 8.359 3.583 16.67 8.312 24.918 14.153V44.8c0-23.45 20.543-44.8 43.826-44.8zM136 416h192c13.255 0 24 10.745 24 24v48c0 13.255-10.745 24-24 24H136c-13.255 0-24-10.745-24-24v-48c0-13.255 10.745-24 24-24zm168 28c-11.046 0-20 8.954-20 20s8.954 20 20 20 20-8.954 20-20-8.954-20-20-20z"
          ></path>
        </svg>
      </n-icon>
      <n-icon size="24" class="pointer icon cut-sc-view" title="切换视图" @click="toggleSc">
        <Refresh></Refresh>
      </n-icon>
      <n-icon
        size="24"
        class="pointer icon cut-search-danmu"
        title="搜索弹幕，仅限xml"
        @click="searchDanmu"
      >
        <SearchIcon></SearchIcon>
      </n-icon>
      <Tip class="cut-search-danmu">
        <h4>快捷键</h4>
        <ul>
          <li>ctrl+s 保存到llc项目</li>
          <li>ctrl+shift+s 另存为llc项目</li>
          <li>ctrl+enter 导出</li>
          <li>ctrl+z 撤销</li>
          <li>ctrl+shift+z 重做</li>
          <li>I 在当前时间开始当前片段</li>
          <li>O 在当前时间结束当前片段</li>
          <li>up 上一个片段</li>
          <li>down 下一个片段</li>
          <li>del 删除片段</li>
          <li>space 播放/暂停</li>
          <li>ctrl+left 后退1秒</li>
          <li>ctrl+right 前进1秒</li>
          <li>ctrl+k 切换视图</li>
        </ul>
      </Tip>
    </div>

    <div class="view">
      <template v-if="scView">
        <div v-if="scList.length" class="sc-list">
          <div
            v-for="(sc, index) in scList"
            :key="index"
            class="cut"
            style="opacity: 1"
            @dblclick="navVideo(sc.ts)"
          >
            <div class="time">{{ sc.user }}-{{ secondsToTimemark(sc.ts) }}</div>
            <div class="text">{{ sc.text }}</div>
          </div>
        </div>
        <div v-else class="empty" style="text-align: center">没有解析到sc</div>
      </template>
      <template v-else>
        <div
          v-for="(cut, index) in cuts"
          :key="index"
          class="cut"
          role="button"
          :class="{
            checked: cut.checked,
            selected: selectCutIndex === index,
          }"
          @click="selectCut(index)"
          @dblclick="navVideo(cut.start)"
        >
          <div class="time">
            {{ secondsToTimemark(cut.start) }}-<span>{{ secondsToTimemark(cut.end) }}</span>
          </div>
          <div class="name" style="color: skyblue">{{ cut.name }}</div>
          <div v-if="cut.end" class="duration">
            持续时间：{{ secondsToTimemark(cut.end - cut.start) }}
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
      </template>
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
      placeholder="请输片段名称"
      @keydown.enter="confirmEditCutName"
    ></n-input>
    <template #action>
      <n-button @click="cutEditVisible = false">取消</n-button>
      <n-button type="primary" @click="confirmEditCutName">确定</n-button>
    </template>
  </n-modal>
  <SearchModal
    v-model:visible="searchDanmuVisible"
    :file="props.files.originDanmuPath"
    :danma-list="props.danmaList"
    @add-segment="addCut"
  ></SearchModal>
</template>

<script setup lang="ts">
import SearchModal from "./SearchModal.vue";
import { secondsToTimemark } from "@renderer/utils";
import { useSegmentStore } from "@renderer/stores";
import {
  RadioButtonOffSharp,
  CheckmarkCircleOutline,
  Pencil,
  Refresh,
  Search as SearchIcon,
} from "@vicons/ionicons5";
import { MinusOutlined, PlusOutlined } from "@vicons/material";
import hotkeys from "hotkeys-js";

import type ArtplayerType from "artplayer";
import type { DanmuItem } from "@biliLive-tools/types";

onActivated(() => {
  // 重命名
  hotkeys("f2", function () {
    rename();
  });
  // 在当前时间开始当前片段
  hotkeys("I", function () {
    setStartTime();
  });
  // 在当前时间结束当前片段
  hotkeys("O", function () {
    setEndTime();
  });
  // 上一个片段
  hotkeys("up", function (event) {
    event.preventDefault();
    prevSegment();
  });
  // 下一个片段
  hotkeys("down", function (event) {
    event.preventDefault();
    nextSegment();
  });
  // 删除片段
  hotkeys("del", function () {
    deleteCut();
  });
  // 切换视图
  hotkeys("ctrl+k", function () {
    toggleSc();
  });
  // 切换到当前开始片段
  // hotkeys("enter", function () {});
});

interface Props {
  danmaList: DanmuItem[];
  files: {
    originDanmuPath: string | null;
  };
}

const props = withDefaults(defineProps<Props>(), {
  danmaList: () => [],
});

const scList = computed(() => {
  return props.danmaList.filter((item) => item.type === "sc");
});
// const emits = defineEmits<{
//   (event: "seek", value: number): void;
// }>();
const videoInstance = inject("videoInstance") as Ref<ArtplayerType>;

const notice = useNotification();
const { cuts } = storeToRefs(useSegmentStore());
const { addSegment, removeSegment, updateSegment, toggleSegment } = useSegmentStore();

const toggleChecked = (index: number) => {
  toggleSegment(index);
};
// 编辑片段名称
const cutEditVisible = ref(false);
const tempCutName = ref("");
const selectCutIndex = ref(-1);

/**
 * 编辑片段名称
 */
const editCut = (index: number) => {
  cutEditVisible.value = true;
  tempCutName.value = cuts.value[index].name;
  selectCutIndex.value = index;
};

/*
 * 重命名
 */
const rename = () => {
  if (selectCutIndex.value === -1) {
    return;
  }
  editCut(selectCutIndex.value);
};

/**
 * 确认编辑片段名称
 */
const confirmEditCutName = () => {
  updateSegment(selectCutIndex.value, "name", tempCutName.value);
  cutEditVisible.value = false;
};

/**
 * 导航到视频指定位置
 * @param start 片段开始时间
 */
const navVideo = (start: number) => {
  videoInstance.value!.seek = start;
};

/**
 * 选择片段
 * @param index 片段索引
 */
const selectCut = (index: number) => {
  selectCutIndex.value = index;
};

/**
 * 添加片段
 */
const addCut = (iOptions: { start?: number; end?: number; name?: string } = {}) => {
  const options = Object.assign(
    {
      start: videoInstance.value.currentTime,
      name: "",
      checked: true,
    },
    iOptions,
  );
  addSegment(options);

  selectCutIndex.value = cuts.value.length - 1;
};

/**
 * 删除片段
 */
const deleteCut = () => {
  if (selectCutIndex.value === -1) {
    return;
  }
  removeSegment(selectCutIndex.value);
  selectCutIndex.value = cuts.value.length - 1;
};

/**
 * 在当前时间开始当前片段
 */
const setStartTime = () => {
  if (selectCutIndex.value === -1) {
    return;
  }
  if (!videoInstance) return;
  if (videoInstance.value.currentTime > cuts.value[selectCutIndex.value].end) {
    return;
  }
  updateSegment(selectCutIndex.value, "start", videoInstance.value.currentTime);
};

/**
 * 在当前时间结束当前片段
 */
const setEndTime = () => {
  if (selectCutIndex.value === -1) {
    return;
  }
  if (!videoInstance) return;
  if (videoInstance.value.currentTime < cuts.value[selectCutIndex.value].start) {
    return;
  }
  updateSegment(selectCutIndex.value, "end", videoInstance.value.currentTime);
};

/**
 * 下一个片段
 */
const nextSegment = () => {
  if (selectCutIndex.value === -1) {
    if (cuts.value.length > 0) {
      selectCut(0);
    }
    return;
  }
  if (selectCutIndex.value === cuts.value.length - 1) {
    return;
  }
  selectCut(selectCutIndex.value + 1);
};
/**
 * 上一个片段
 */
const prevSegment = () => {
  if (selectCutIndex.value === -1) {
    if (cuts.value.length > 0) {
      selectCut(cuts.value.length - 1);
    }
    return;
  }
  if (selectCutIndex.value === 0) {
    return;
  }
  selectCut(selectCutIndex.value - 1);
};

const scView = ref(false);
/**
 * 切换为sc视图
 */
const toggleSc = () => {
  scView.value = !scView.value;
};

const searchDanmuVisible = ref(false);
/**
 * 搜索弹幕
 */
const searchDanmu = () => {
  console.log(props.files.originDanmuPath);
  if (!props.files.originDanmuPath) return;
  if (!props.files.originDanmuPath.endsWith(".xml")) {
    notice.warning({
      title: "仅支持xml格式弹幕",
      duration: 1000,
    });
    return;
  }
  searchDanmuVisible.value = true;
};
</script>

<style scoped lang="less">
.cut-list {
  position: relative;

  .view {
    max-height: calc(100vh - 100px);
    overflow: auto;
  }
  .btns {
    position: absolute;

    left: 50%;
    top: 0;
    transform: translate(-50%, -120%);
    display: flex;
    gap: 5px;
    margin-bottom: 5px;
    justify-content: center;
    align-items: center;
    .icon {
      border: 1px solid rgba(204, 204, 204, 1);
      border-radius: 2px;
    }
  }
  .cut {
    border: 2px solid rgba(204, 204, 204, 0.5);
    border-radius: 4px;
    padding: 4px 6px;
    margin-bottom: 6px;
    position: relative;
    opacity: 0.5;
    cursor: default;
    &.checked {
      opacity: 1;
    }
    &.selected {
      border-color: skyblue;
      border-width: 2px;
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
