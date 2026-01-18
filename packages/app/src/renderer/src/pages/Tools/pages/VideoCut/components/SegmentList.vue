<template>
  <div class="cut-list">
    <div class="btns">
      <n-icon
        size="20"
        class="pointer icon"
        title="在当前时间开始当前片段(I)"
        style="padding: 2px"
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
      <n-icon size="24" class="pointer icon" title="删除片段(del)" @click="deleteCut">
        <MinusOutlined></MinusOutlined>
      </n-icon>
      <n-icon
        size="20"
        class="pointer icon cut-set-end"
        title="在当前时间结束当前片段(O)"
        style="padding: 2px"
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

      <Tip class="cut-search-danmu">
        <ul>
          <li>I 在当前时间开始当前片段</li>
          <li>O 在当前时间结束当前片段</li>
          <li>F2 重命名</li>
          <li>up 上一个片段</li>
          <li>down 下一个片段</li>
          <li>del 删除片段</li>
          <li>ctrl+n 新建片段</li>
          <li>space 播放/暂停</li>
          <li>ctrl+left 后退1秒</li>
          <li>ctrl+right 前进1秒</li>
          <li>ctrl+s 保存到项目</li>
          <li>ctrl+shift+s 另存为项目</li>
          <li>ctrl+enter 导出</li>
          <li>ctrl+z 撤销</li>
          <li>ctrl+shift+z 重做</li>
          <li>ctrl+k 切换弹幕搜索</li>
        </ul>
      </Tip>
    </div>

    <div class="view">
      <div
        v-for="cut in cuts"
        :key="cut.id"
        class="cut"
        role="button"
        :class="{
          checked: cut.checked,
          selected: selectCutId === cut.id,
        }"
        :style="{
          '--active-border-color': generateDistinctColor(cut.index, true),
        }"
        @click="handleSelectCut(cut.id)"
        @dblclick="navVideo(cut.start)"
        @contextmenu.prevent="showContextMenu($event, cut)"
      >
        <div class="time">
          {{ secondsToTimemark(cut.start) }}-<span>{{ secondsToTimemark(cut.end) }}</span>
        </div>
        <div class="name" style="color: skyblue">{{ cut.name }}</div>
        <div v-if="cut.end" class="duration">
          持续时间：{{ secondsToTimemark(cut.end - cut.start) }}
        </div>
        <div class="icon">
          <n-icon v-if="cut.checked" size="20" :depth="3" @click.stop="toggleChecked(cut.id)">
            <CheckmarkCircleOutline></CheckmarkCircleOutline>
          </n-icon>
          <n-icon v-else size="20" :depth="3" @click.stop="toggleChecked(cut.id)">
            <RadioButtonOffSharp></RadioButtonOffSharp>
          </n-icon>
        </div>
        <div class="edit-icon">
          <n-icon size="20" :depth="3" @click.stop="editCut(cut.id)">
            <Pencil></Pencil>
          </n-icon>
        </div>
        <n-spin :size="18" class="loading" style="--n-size: 18px" v-if="cut.loading" />
      </div>
    </div>
  </div>

  <n-modal
    v-model:show="cutEditVisible"
    preset="dialog"
    title="编辑片段名称"
    :show-icon="false"
    :closable="false"
    auto-focus
  >
    <n-input
      v-model:value="tempCutName"
      placeholder="请输入片段名称"
      @keydown.enter="confirmEditCutName"
    ></n-input>
    <template #action>
      <n-button @click="cutEditVisible = false">取消</n-button>
      <n-button type="primary" @click="confirmEditCutName">确定</n-button>
    </template>
  </n-modal>

  <SearchPopover
    v-model:visible="searchDanmuVisible"
    :file="props.files.originDanmuPath"
    :danma-list="props.danmaList"
    :danmaSearchMask="props.danmaSearchMask"
    @add-segment="addCut"
    @set-location="navVideo"
  >
    <span
      size="30"
      class="pointer icon cut-search-danmu"
      title="搜索弹幕，可拖动(ctrl+k)"
      style="position: fixed; display: inline-block; width: 30px; height: 30px; z-index: 10"
      ref="el"
      :style="style"
      @click="searchDanmu"
    >
      <SearchIcon></SearchIcon>
    </span>
  </SearchPopover>
</template>

<script setup lang="ts">
import { useThemeStore } from "@renderer/stores/theme";
import SearchPopover from "./SearchPopover.vue";
import { secondsToTimemark } from "@renderer/utils";
import { useSegmentStore } from "@renderer/stores";
import {
  RadioButtonOffSharp,
  CheckmarkCircleOutline,
  Pencil,
  Search as SearchIcon,
  PlayCircleOutline,
} from "@vicons/ionicons5";
import { MinusOutlined, PlusOutlined } from "@vicons/material";
import { Delete24Regular } from "@vicons/fluent";
import { generateDistinctColor } from "@renderer/utils";
import { aiApi } from "@renderer/apis";
import { useConfirm } from "@renderer/hooks";

import hotkeys from "hotkeys-js";
import { useDraggable, useEventListener, useWindowSize } from "@vueuse/core";
import ContextMenu from "@imengyu/vue3-context-menu";
import { NIcon } from "naive-ui";

import type ArtplayerType from "artplayer";
import type { DanmuItem } from "@biliLive-tools/types";
import type { Segment } from "@renderer/stores";

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
  // 切换弹幕搜索
  hotkeys("ctrl+k", function () {
    searchDanmu();
  });
  // 新建片段
  hotkeys("ctrl+n", function (event) {
    event.preventDefault();
    addCut();
  });
  // 切换到当前开始片段
  // hotkeys("enter", function () {});
});

interface Props {
  danmaList: DanmuItem[];
  files: {
    originDanmuPath: string | null;
    originVideoPath: string | null;
  };
  danmaSearchMask: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  danmaList: () => [],
});

const el = ref<HTMLElement | null>(null);

const { width, height } = useWindowSize();
const notice = useNotification();
const confirm = useConfirm();
const { x, y, style } = useDraggable(el, {
  initialValue: { x: width.value - 100, y: height.value - 40 },
});

useEventListener(window, "resize", () => {
  x.value = width.value - 100;
  y.value = height.value - 40;
});

const videoInstance = inject("videoInstance") as Ref<ArtplayerType>;

const { cuts, selectCutId } = storeToRefs(useSegmentStore());
const { addSegment, removeSegment, updateSegment, toggleSegment, selectCut, insertSegmentAfter } =
  useSegmentStore();

const toggleChecked = (id: string) => {
  toggleSegment(id);
};
// 编辑片段名称
const cutEditVisible = ref(false);
const tempCutName = ref("");

/**
 * 编辑片段名称
 */
const editCut = (id: string) => {
  const cut = cuts.value.find((c) => c.id === id);
  if (!cut) return;
  cutEditVisible.value = true;
  tempCutName.value = cut.name;
  selectCutId.value = id;
};

/*
 * 重命名
 */
const rename = () => {
  if (!selectCutId.value) {
    return;
  }
  editCut(selectCutId.value);
};

/**
 * 确认编辑片段名称
 */
const confirmEditCutName = () => {
  if (!selectCutId.value) return;
  updateSegment(selectCutId.value, { name: tempCutName.value });
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
 * @param id 片段ID
 */
const handleSelectCut = (id: string) => {
  selectCut(id);
};

/**
 * 添加片段
 */
const addCut = (iOptions: { start?: number; end?: number; name?: string; id?: string } = {}) => {
  if (!props.files.originVideoPath) {
    notice.error({
      title: "请先加载视频文件",
      duration: 1000,
    });
    return;
  }
  const options = Object.assign(
    {
      start: videoInstance.value.currentTime,
      name: "",
      checked: true,
    },
    iOptions,
  );
  if (options.end) {
    options.end = Math.min(options.end, videoInstance.value.duration);
  } else {
    options.end = Math.min(options.start + 60 * 5, videoInstance.value.duration);
  }
  addSegment(options as any);
  console.log("cuts", cuts.value);
};

/**
 * 删除片段
 */
const deleteCut = () => {
  if (!selectCutId.value) {
    return;
  }
  removeSegment(selectCutId.value);
};

/**
 * 在当前时间开始当前片段
 */
const setStartTime = () => {
  if (!selectCutId.value) {
    return;
  }
  if (!videoInstance) return;
  const selectedCut = cuts.value.find((c) => c.id === selectCutId.value);
  if (!selectedCut || videoInstance.value.currentTime > selectedCut.end) {
    return;
  }
  updateSegment(selectCutId.value, { start: videoInstance.value.currentTime });
};

/**
 * 在当前时间结束当前片段
 */
const setEndTime = () => {
  if (!selectCutId.value) {
    return;
  }
  if (!videoInstance) return;
  const selectedCut = cuts.value.find((c) => c.id === selectCutId.value);
  if (!selectedCut || videoInstance.value.currentTime < selectedCut.start) {
    return;
  }
  updateSegment(selectCutId.value, { end: videoInstance.value.currentTime });
};

/**
 * 下一个片段
 */
const nextSegment = () => {
  if (!selectCutId.value) {
    if (cuts.value.length > 0) {
      selectCut(cuts.value[0].id);
    }
    return;
  }
  const currentIndex = cuts.value.findIndex((c) => c.id === selectCutId.value);
  if (currentIndex === -1 || currentIndex === cuts.value.length - 1) {
    return;
  }
  selectCut(cuts.value[currentIndex + 1].id);
};
/**
 * 上一个片段
 */
const prevSegment = () => {
  if (!selectCutId.value) {
    if (cuts.value.length > 0) {
      selectCut(cuts.value[cuts.value.length - 1].id);
    }
    return;
  }
  const currentIndex = cuts.value.findIndex((c) => c.id === selectCutId.value);
  if (currentIndex === -1 || currentIndex === 0) {
    return;
  }
  selectCut(cuts.value[currentIndex - 1].id);
};

const searchDanmuVisible = ref(false);
/**
 * 搜索弹幕
 */
const searchDanmu = () => {
  searchDanmuVisible.value = !searchDanmuVisible.value;
};

/**
 * 切割片段
 * @param segment 要切割的片段
 */
const splitSegment = (segment: Segment) => {
  if (!videoInstance.value) return;
  if (segment.loading) {
    notice.warning({
      title: "片段正在处理，无法切割",
      duration: 2000,
    });
    return;
  }

  const currentTime = videoInstance.value.currentTime;

  // 判断当前时间点是否在segment中
  if (currentTime <= segment.start || currentTime >= segment.end!) {
    notice.warning({
      title: "当前时间点不在该片段范围内",
      duration: 2000,
    });
    return;
  }

  // 设置当前segment的结束时间为当前时间
  updateSegment(segment.id, { end: currentTime });

  // 在当前segment后面插入新的segment
  insertSegmentAfter(segment.id, {
    start: currentTime,
    end: segment.end,
    name: segment.name ? `${segment.name}-2` : "",
    checked: segment.checked,
  });
};

function renderIcon(icon: Component) {
  // 高度和宽度22px
  return () =>
    h(NIcon, { style: { fontSize: "17px", "font-size": "17px" } }, { default: () => h(icon) });
}

const songRecognize = async (segment: Segment) => {
  if (!props.files.originVideoPath) {
    notice.error({
      title: "请先加载视频文件",
      duration: 1000,
    });
    return;
  }
  // TODO:
  // 点击波形图，设置为当前片段
  // 波形图配置颜色

  const [status] = await confirm.warning({
    content: `此功能使用AI用于针对片段进行歌曲识别，使用前请先去配置阿里云相关key。\n
    原理为将音频转换为文本，之后将文本交给ai来判断歌曲名称，更多参见文档`,
    showCheckbox: true,
    showAgainKey: "videoSongRecognizeWarning",
  });
  if (!status) return;

  try {
    updateSegment(segment.id, { loading: true });

    const data = await aiApi.songRecognize(
      props.files.originVideoPath!,
      segment.start,
      segment.end!,
    );
    updateSegment(segment.id, { name: data.name });
    if (data.name) {
      notice.success({
        title: `歌曲识别成功：${data.name}`,
        duration: 3000,
      });
    } else {
      notice.warning({
        title: `未能识别出歌曲`,
        duration: 3000,
      });
    }
  } finally {
    updateSegment(segment.id, { loading: false });
  }
};

const themeStore = useThemeStore();
const showContextMenu = (e: MouseEvent, segment: Segment) => {
  //这个函数与 this.$contextmenu 一致
  const osTheme = themeStore.theme === "dark" ? "default dark" : "default";
  ContextMenu.showContextMenu({
    theme: osTheme,
    x: e.x,
    y: e.y,
    items: [
      {
        label: "播放",
        onClick: () => {
          if (videoInstance.value) {
            videoInstance.value!.seek = segment.start;
            videoInstance.value.play();
          }
        },
        icon: renderIcon(PlayCircleOutline),
      },
      {
        label: "编辑",
        onClick: () => {
          editCut(segment.id);
        },
        icon: renderIcon(Pencil),
      },
      {
        label: "删除",
        onClick: () => {
          removeSegment(segment.id);
        },
        icon: renderIcon(Delete24Regular),
      },
      {
        label: "切换状态",
        onClick: () => {
          toggleChecked(segment.id);
        },
      },
      {
        label: "切割",
        onClick: () => {
          splitSegment(segment);
        },
      },
      {
        label: "歌曲识别",
        onClick: async () => {
          songRecognize(segment);
        },
      },
    ],
  });
};
</script>

<style scoped lang="less">
.cut-list {
  position: relative;

  .view {
    // max-height: calc(100vh - 100px);
    min-width: 210px;
    overflow: auto;
  }
  .btns {
    // position: absolute;

    // left: 50%;
    // top: 0;
    // transform: translate(-50%, -120%);
    display: flex;
    gap: 5px;
    margin-bottom: 10px;
    justify-content: center;
    align-items: center;
    .icon {
      border: 1px solid rgba(204, 204, 204, 1);
      border-radius: 2px;
      &:hover {
        border-color: #358457;
      }
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
      border-color: var(--active-border-color);
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
    .loading {
      position: absolute;
      top: 4px;
      right: 4px;
    }
  }
}
</style>
