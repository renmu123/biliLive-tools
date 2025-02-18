<template>
  <n-modal v-model:show="visible" :show-icon="false" :closable="false" auto-focus>
    <n-card
      style="width: 700px"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
      class="card"
    >
      <div style="display: flex; flex-direction: column; gap: 10px">
        <h3>
          共有{{ cuts.length }}个切片，此次将导出
          <span style="color: skyblue"> {{ selectedCuts.length }} </span> 个视频
        </h3>

        <p style="color: red; margin-top: 0">{{ noDanmuTips }}</p>
        <div class="flex" style="align-items: center">
          选择视频预设：
          <n-cascader
            v-model:value="exportOptions.ffmpegPresetId"
            placeholder="请选择预设"
            expand-trigger="click"
            :options="ffmpegOptions"
            check-strategy="child"
            :show-path="false"
            :filterable="true"
            style="width: 200px; text-align: left"
          />
          <Tip> 推荐采用质量模式，以自适应视频质量，视频编码不能使用copy </Tip>
        </div>
        <div class="flex" style="align-items: center">
          <n-radio-group v-model:value="exportOptions.saveRadio">
            <n-space class="flex align-center column">
              <n-radio :value="1"> 保存到视频文件夹 </n-radio>
              <n-radio :value="2"> </n-radio>
              <n-input
                v-model:value="exportOptions.savePath"
                placeholder="选择文件夹"
                style="width: 300px"
              />
              <n-icon size="30" style="margin-left: 0px" class="pointer" @click="getDir">
                <FolderOpenOutline />
              </n-icon>
            </n-space>
          </n-radio-group>
        </div>
        <div>
          <n-radio-group v-model:value="exportOptions.override">
            <n-space>
              <n-radio :value="true"> 覆盖文件 </n-radio>
              <n-radio :value="false"> 跳过存在文件 </n-radio>
            </n-space>
          </n-radio-group>
        </div>
        <div>
          <n-checkbox v-model:checked="exportOptions.ignoreDanmu" style="margin-top: 10px">
            忽略弹幕
          </n-checkbox>
        </div>
        <div>
          <div style="margin-bottom: 5px">
            输出文件名：<span style="color: red">{{ exportError }}</span>
          </div>
          <div>
            <n-input
              v-model:value="exportOptions.title"
              placeholder="请输入视频标题"
              clearable
              style="margin-right: 10px"
            />
            <span
              v-for="item in titleList"
              :key="item.value"
              :title="item.label"
              class="title-var"
              @click="setTitleVar(item.value)"
              >{{ item.value }}</span
            >
          </div>
        </div>
      </div>
      <template #footer>
        <div class="footer">
          <n-button class="btn" @click="visible = false">取消</n-button>
          <n-button class="btn" type="primary" @click="confirmExport">确定</n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { toReactive } from "@vueuse/core";

import { ffmpegPresetApi } from "@renderer/apis";
import { FolderOpenOutline } from "@vicons/ionicons5";
import { useFfmpegPreset, useAppConfig, useSegmentStore } from "@renderer/stores";
import filenamify from "filenamify/browser";
import { secondsToTimemark } from "@renderer/utils";
import { showDirectoryDialog } from "@renderer/utils/fileSystem";

interface Props {
  files: {
    videoPath: string | null;
    danmuPath: string | null;
  };
}

const props = withDefaults(defineProps<Props>(), {
  files: () => {
    return {
      videoPath: null,
      danmuPath: null,
    };
  },
});

// const emits = defineEmits<{
//   (event: "confirm", value: DanmuConfig): void;
// }>();

const visible = defineModel<boolean>({ required: true, default: false });

const { ffmpegOptions } = storeToRefs(useFfmpegPreset());
const { appConfig } = storeToRefs(useAppConfig());
const { cuts, selectedCuts } = storeToRefs(useSegmentStore());

const notice = useNotification();

const exportOptions = toReactive(
  computed({
    get: () => appConfig.value.tool.videoCut,
    set: (value) => {
      appConfig.value.tool.videoCut = value;
    },
  }),
);

const confirmExport = async () => {
  if (!exportOptions.ffmpegPresetId) {
    notice.error({
      title: "请选择预设",
      duration: 1000,
    });
    return;
  }
  let savePath: string;

  if (exportOptions.saveRadio === 1) {
    savePath = window.path.dirname(props.files.videoPath!);
  } else if (exportOptions.saveRadio === 2) {
    if (exportOptions.savePath === "") {
      notice.error({
        title: "请选择保存路径",
        duration: 1000,
      });
      return;
    }
    if (window.path.isAbsolute(exportOptions.savePath)) {
      savePath = exportOptions.savePath;
    } else {
      // 相对路径和视频路径拼接
      savePath = window.path.join(
        window.path.dirname(props.files.videoPath!),
        exportOptions.savePath,
      );
      if (!(await window.api.exits(savePath))) {
        // 不存在则创建
        await window.api.common.mkdir(savePath);
      }
    }
  } else {
    notice.error({
      title: "不支持此项配置",
      duration: 1000,
    });
    return;
  }
  const ffmpegOptiosn = (await ffmpegPresetApi.get(exportOptions.ffmpegPresetId)).config;
  let index = 1;
  for (const cut of selectedCuts.value) {
    const start = cut.start;
    const end = cut.end;
    const label = cut.name;

    const title = filenamify(
      exportOptions.title
        .replace("{{filename}}", window.path.parse(props.files.videoPath!).name)
        .replace("{{label}}", label)
        .replace("{{num}}", index.toString())
        .replace("{{from}}", secondsToTimemark(start).replaceAll(":", "."))
        .replace("{{to}}", secondsToTimemark(end).replaceAll(":", "."))
        .trim(),
      { replacement: "" },
    );
    await window.api.mergeAssMp4(
      {
        videoFilePath: props.files.videoPath!,
        assFilePath: exportOptions.ignoreDanmu ? "" : props.files.danmuPath,
        outputPath: window.path.join(savePath, `${title}.mp4`),
        hotProgressFilePath: undefined,
      },
      { removeOrigin: false, override: exportOptions.override },
      {
        ...ffmpegOptiosn,
        ss: start,
        to: end,
      },
    );
    index += 1;
  }
  notice.info({
    title: "已加入任务队列",
    duration: 1000,
  });
  visible.value = false;
};

const noDanmuTips = computed(() => {
  if (props.files.danmuPath) {
    return "";
  } else {
    return "如果不需要弹幕，视频预设推荐使用copy，这样就不需要重新编码，但是只会在关键帧切割，导致视频长度不准确";
  }
});

async function getDir() {
  const path = await showDirectoryDialog({
    defaultPath: exportOptions.savePath,
  });
  if (!path) return;
  exportOptions.savePath = path;
}

const titleList = ref([
  {
    value: "{{filename}}",
    label: "视频文件名",
  },
  {
    value: "{{label}}",
    label: "分段名",
  },
  {
    value: "{{num}}",
    label: "分段序号",
  },
  {
    value: "{{from}}",
    label: "分段开始时间",
  },
  {
    value: "{{to}}",
    label: "分段结束时间",
  },
]);
const setTitleVar = (value: string) => {
  exportOptions.title += value;
};
const exportError = computed(() => {
  if (
    exportOptions.title.includes("{{from}}") ||
    exportOptions.title.includes("{{num}}") ||
    exportOptions.title.includes("{{to}}")
  ) {
    return "";
  } else {
    return "输出文件名模板会导致文件名重复（您正在尝试导出多个同名文件）";
  }
});
</script>

<style scoped lang="less">
.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 10px;
  }
}

.title-var {
  display: inline-block;
  margin-top: 4px;
  margin-right: 10px;
  padding: 4px 8px;
  border-radius: 5px;
  background-color: #f0f0f0;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  &:not(.disabled):hover {
    background-color: #e0e0e0;
  }
  &.disabled {
    cursor: not-allowed;
  }
}
</style>
