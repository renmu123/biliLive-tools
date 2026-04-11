<template>
  <n-modal v-model:show="visible" :show-icon="false" :closable="false" auto-focus>
    <n-card
      style="width: 1200px; max-height: 85vh"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
      class="card"
    >
      <template #header>
        <h3 style="margin: 0">字幕样式配置</h3>
      </template>

      <div class="flex" style="gap: 10px; align-items: center; margin-bottom: 16px">
        <span style="flex: none">预设</span>
        <n-select v-model:value="presetId" :options="presetOptions" placeholder="选择预设" />
      </div>

      <div style="display: flex; gap: 20px">
        <!-- 左侧配置区 -->
        <div style="flex: 1; overflow-y: auto; max-height: calc(85vh - 150px)">
          <n-form label-placement="left" label-width="100px">
            <!-- 字体设置 -->
            <n-divider style="margin: 10px 0">字体设置</n-divider>

            <n-form-item label="字体名称">
              <n-select
                v-model:value="styleConfig.fontName"
                :options="fontOptions"
                filterable
                virtual-scroll
                clearable
                placeholder="不选就是默认字体"
              />
            </n-form-item>

            <n-form-item label="字体大小">
              <n-input-number
                v-model:value="styleConfig.fontSize"
                :min="8"
                :max="100"
                :step="1"
                style="width: 100%"
              />
            </n-form-item>

            <n-form-item label="粗体">
              <n-checkbox v-model:checked="isBold" @update:checked="updateBold">
                启用粗体
              </n-checkbox>
            </n-form-item>

            <n-form-item label="斜体">
              <n-checkbox v-model:checked="isItalic" @update:checked="updateItalic">
                启用斜体
              </n-checkbox>
            </n-form-item>

            <n-form-item label="下划线">
              <n-checkbox v-model:checked="isUnderline" @update:checked="updateUnderline">
                启用下划线
              </n-checkbox>
            </n-form-item>

            <!-- 颜色设置 -->
            <n-divider style="margin: 10px 0">颜色设置</n-divider>

            <n-form-item label="文字颜色">
              <n-color-picker v-model:value="styleConfig.primaryColour" :modes="['hex']" />
            </n-form-item>

            <n-form-item label="边框颜色">
              <n-color-picker v-model:value="styleConfig.outlineColour" :modes="['hex']" />
            </n-form-item>

            <n-form-item label="阴影颜色">
              <n-color-picker v-model:value="styleConfig.backColour" :modes="['hex']" />
            </n-form-item>

            <!-- 边框和阴影 -->
            <n-divider style="margin: 10px 0">边框和阴影</n-divider>

            <n-form-item label="边框宽度">
              <n-slider
                v-model:value="styleConfig.outline"
                :min="0"
                :max="10"
                :step="0.5"
                :marks="{ 0: '0', 2: '2', 5: '5', 10: '10' }"
              />
            </n-form-item>

            <n-form-item label="阴影距离">
              <n-slider
                v-model:value="styleConfig.shadow"
                :min="0"
                :max="10"
                :step="0.5"
                :marks="{ 0: '0', 1: '1', 5: '5', 10: '10' }"
              />
            </n-form-item>

            <!-- 位置设置 -->
            <n-divider style="margin: 10px 0">位置设置</n-divider>

            <n-form-item label="对齐方式">
              <n-select v-model:value="styleConfig.alignment" :options="alignmentOptions" />
            </n-form-item>

            <n-form-item label="左边距">
              <n-input-number
                v-model:value="styleConfig.marginL"
                :min="0"
                :max="500"
                :step="5"
                style="width: 100%"
              />
            </n-form-item>

            <n-form-item label="右边距">
              <n-input-number
                v-model:value="styleConfig.marginR"
                :min="0"
                :max="500"
                :step="5"
                style="width: 100%"
              />
            </n-form-item>

            <n-form-item label="垂直边距">
              <n-input-number
                v-model:value="styleConfig.marginV"
                :min="0"
                :max="500"
                :step="5"
                style="width: 100%"
              />
            </n-form-item>
          </n-form>
        </div>

        <!-- 右侧预览区 -->
        <div style="flex: 1; display: flex; flex-direction: column">
          <div style="margin-bottom: 10px; font-weight: bold">预览效果</div>
          <div
            style="
              flex: 1;
              background: skyblue;
              border-radius: 8px;
              position: relative;
              min-height: 300px;
              overflow: hidden;
            "
          >
            <div :style="previewContainerStyle">
              <div :style="previewTextStyle">这是字幕预览效果</div>
              <div :style="previewTextStyle">Subtitle Preview</div>
            </div>
          </div>
          <div style="margin-top: 10px; font-size: 12px; color: #999">
            提示：预览效果为近似效果，实际渲染以ffmpeg为准
          </div>
        </div>
      </div>

      <template #footer>
        <div class="footer">
          <div style="flex: 1"></div>
          <n-button
            v-if="presetId !== 'default'"
            text
            class="btn"
            type="error"
            @click="deletePreset"
            >删除</n-button
          >
          <n-button class="btn" @click="handleCancel">取消</n-button>
          <ButtonGroup :options="actionBtns" @click="handleActionClick">保存</ButtonGroup>
        </div>
      </template>

      <n-modal v-model:show="nameModelVisible">
        <n-card style="width: 600px" :bordered="false" role="dialog" aria-modal="true">
          <n-input
            v-model:value="tempPresetName"
            placeholder="请输入预设名称"
            maxlength="15"
            @keyup.enter="saveConfirm"
          />
          <template #footer>
            <div style="text-align: right">
              <n-button @click="nameModelVisible = false">取消</n-button>
              <n-button type="primary" style="margin-left: 10px" @click="saveConfirm"
                >确认</n-button
              >
            </div>
          </template>
        </n-card>
      </n-modal>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { subtitleStylePresetApi } from "@renderer/apis/presets";
import { commonApi } from "@renderer/apis";
import ButtonGroup from "@renderer/components/ButtonGroup.vue";
import { useConfirm } from "@renderer/hooks";
import { uuid } from "@renderer/utils";

import { cloneDeep } from "lodash-es";

import type { SubtitleOptions } from "@biliLive-tools/types";
import type { SubtitleStylePreset } from "@renderer/apis/presets/subtitleStyle";

const visible = defineModel<boolean>({ required: true, default: false });
const emit = defineEmits<{
  (event: "confirm", value: SubtitleOptions): void;
}>();

const notice = useNotification();
const confirmDialog = useConfirm();

const presetId = ref<string>("default");
const currentPreset = ref<SubtitleStylePreset>({
  id: "default",
  name: "默认配置",
  config: {},
});

const styleConfig = ref<SubtitleOptions>({
  fontName: undefined,
  fontSize: 22,
  primaryColour: "#FFFFFF", // 白色文字
  outlineColour: "#000000", // 黑色边框
  backColour: "#000000", // 黑色阴影
  bold: 0,
  italic: 0,
  underline: 0,
  outline: 1,
  shadow: 0,
  alignment: 2, // 居中下
  marginL: 20,
  marginR: 20,
  marginV: 0,
});

// 布尔值辅助变量
const isBold = computed({
  get: () => styleConfig.value.bold === -1,
  set: (val) => (styleConfig.value.bold = val ? -1 : 0),
});

const isItalic = computed({
  get: () => styleConfig.value.italic === -1,
  set: (val) => (styleConfig.value.italic = val ? -1 : 0),
});

const isUnderline = computed({
  get: () => styleConfig.value.underline === -1,
  set: (val) => (styleConfig.value.underline = val ? -1 : 0),
});

const updateBold = (val: boolean) => {
  styleConfig.value.bold = val ? -1 : 0;
};

const updateItalic = (val: boolean) => {
  styleConfig.value.italic = val ? -1 : 0;
};

const updateUnderline = (val: boolean) => {
  styleConfig.value.underline = val ? -1 : 0;
};

// 对齐方式选项
const alignmentOptions = [
  { label: "左下", value: 1 },
  { label: "底部居中", value: 2 },
  { label: "右下", value: 3 },
  { label: "中间居左", value: 9 },
  { label: "中间居中", value: 10 },
  { label: "中间居右", value: 11 },
  { label: "左上", value: 5 },
  { label: "顶部居中", value: 6 },
  { label: "右上", value: 7 },
];

// 预设选项
const presetOptions = ref<{ label: string; value: string }[]>([]);

const loadPresets = async () => {
  try {
    const presets = await subtitleStylePresetApi.list();
    presetOptions.value = presets.map((p) => ({
      label: p.name,
      value: p.id,
    }));
  } catch (error) {
    console.error("Failed to load presets:", error);
  }
};

// 预览容器样式
const previewContainerStyle = computed(() => {
  const alignment = styleConfig.value.alignment ?? 2;
  let justifyContent: "center" | "flex-start" | "flex-end" = "center";
  let alignItems: "flex-end" | "center" | "flex-start" = "flex-end";

  // 垂直对齐
  if ([1, 2, 3].includes(alignment)) {
    justifyContent = "flex-end"; // 下
  } else if ([9, 10, 11].includes(alignment)) {
    justifyContent = "center"; // 中
  } else if ([5, 6, 7].includes(alignment)) {
    justifyContent = "flex-start"; // 上
  }

  // 水平对齐
  if ([1, 9, 5].includes(alignment)) {
    alignItems = "flex-start"; // 左
  } else if ([2, 10, 6].includes(alignment)) {
    alignItems = "center"; // 中
  } else if ([3, 11, 7].includes(alignment)) {
    alignItems = "flex-end"; // 右
  }

  return {
    position: "absolute" as const,
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent,
    alignItems,
    padding: `${styleConfig.value.marginV ?? 20}px ${styleConfig.value.marginR ?? 20}px ${styleConfig.value.marginV ?? 20}px ${styleConfig.value.marginL ?? 20}px`,
  };
});

// 预览文字样式
const previewTextStyle = computed(() => {
  const outline = styleConfig.value.outline ?? 2;
  const shadow = styleConfig.value.shadow ?? 1;

  return {
    fontFamily: styleConfig.value.fontName || "Arial",
    fontSize: `${styleConfig.value.fontSize ?? 24}px`,
    color: styleConfig.value.primaryColour ?? "#FFFFFF",
    fontWeight: (styleConfig.value.bold === -1 ? "bold" : "normal") as "bold" | "normal",
    fontStyle: (styleConfig.value.italic === -1 ? "italic" : "normal") as "italic" | "normal",
    textDecoration: styleConfig.value.underline === -1 ? "underline" : "none",
    textShadow: `
      ${outline}px ${outline}px 0 ${styleConfig.value.outlineColour ?? "#000000"},
      -${outline}px ${outline}px 0 ${styleConfig.value.outlineColour ?? "#000000"},
      ${outline}px -${outline}px 0 ${styleConfig.value.outlineColour ?? "#000000"},
      -${outline}px -${outline}px 0 ${styleConfig.value.outlineColour ?? "#000000"},
      ${shadow}px ${shadow}px ${shadow * 2}px ${styleConfig.value.backColour ?? "#000000"}
    `,
    lineHeight: "1.5",
    textAlign: "center" as const,
  };
});

// 初始化配置
watch(
  () => visible.value,
  async (newVal) => {
    if (newVal) {
      await loadPresets();
      getFonts();
    }
  },
);

watch(
  () => presetId.value,
  async (val) => {
    if (val) {
      console.log("Selected preset ID:", val);
      try {
        currentPreset.value = await subtitleStylePresetApi.get(val);
        styleConfig.value = { ...currentPreset.value.config };
      } catch (error) {
        console.error("Failed to load preset:", error);
      }
    }
  },
);

const handleCancel = () => {
  visible.value = false;
};

const saveConfig = async () => {
  await subtitleStylePresetApi.save({
    ...currentPreset.value,
    config: toRaw(styleConfig.value),
  });
  notice.success({
    title: "保存成功",
    duration: 1000,
  });
  await loadPresets();
  confirm();
};

const confirm = () => {
  emit("confirm", styleConfig.value);
  visible.value = false;
};

const deletePreset = async () => {
  const [status] = await confirmDialog.warning({
    content: "是否确认删除该预设？",
  });
  if (!status) return;

  await subtitleStylePresetApi.remove(presetId.value);
  presetId.value = "default";
  notice.success({
    title: "删除成功",
    duration: 1000,
  });
  await loadPresets();
};

const nameModelVisible = ref(false);
const tempPresetName = ref("");
const isRename = ref(false);

const rename = async () => {
  tempPresetName.value = currentPreset.value.name;
  isRename.value = true;
  nameModelVisible.value = true;
};

const saveAs = async () => {
  isRename.value = false;
  tempPresetName.value = "";
  nameModelVisible.value = true;
};

const saveConfirm = async () => {
  if (!tempPresetName.value) {
    notice.warning({
      title: "预设名称不得为空",
      duration: 2000,
    });
    return;
  }

  const preset = cloneDeep(currentPreset.value);
  if (!isRename.value) {
    preset.id = uuid();
  }
  preset.name = tempPresetName.value;
  preset.config = toRaw(styleConfig.value);
  await subtitleStylePresetApi.save(preset);
  nameModelVisible.value = false;
  notice.success({
    title: "保存成功",
    duration: 1000,
  });
  presetId.value = preset.id;
  await loadPresets();
};

const actionBtns = ref([
  { label: "另存为", key: "saveAnother" },
  { label: "重命名", key: "rename" },
]);

const handleActionClick = async (key?: string | number) => {
  switch (key) {
    case "saveAnother":
      saveAs();
      break;
    case "rename":
      rename();
      break;
    case undefined:
      saveConfig();
      break;
  }
};

const fontOptions = ref<
  {
    label: string;
    value: string;
  }[]
>([]);
const getFonts = async () => {
  if (!window.isWeb) {
    // @ts-ignore
    const data = await window.queryLocalFonts();
    fontOptions.value = data.map((item: any) => {
      return {
        label: item.fullName,
        value: item.fullName,
      };
    });
  } else {
    try {
      const data = await commonApi.getFontList();
      fontOptions.value = data.map((item) => {
        return {
          label: item.fullName,
          value: item.fullName,
        };
      });
    } catch (error) {
      fontOptions.value = [];
      console.error(error);
    }
  }
};
</script>

<style scoped lang="less">
.footer {
  display: flex;
  align-items: center;
  gap: 10px;
  .btn + .btn {
    margin-left: 0;
  }
}
</style>
