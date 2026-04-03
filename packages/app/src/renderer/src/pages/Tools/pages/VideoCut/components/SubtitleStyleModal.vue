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

      <div style="display: flex; gap: 20px">
        <!-- 左侧配置区 -->
        <div style="flex: 1; overflow-y: auto; max-height: calc(85vh - 150px)">
          <n-form label-placement="left" label-width="100px">
            <!-- 字体设置 -->
            <n-divider style="margin: 10px 0">字体设置</n-divider>

            <n-form-item label="字体名称">
              <n-input
                v-model:value="styleConfig.fontName"
                placeholder="如: Arial, 微软雅黑"
                clearable
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
          <n-button class="btn" @click="handleReset">恢复默认</n-button>
          <div style="flex: 1"></div>
          <n-button class="btn" @click="handleCancel">取消</n-button>
          <n-button class="btn" type="primary" @click="handleConfirm">确定</n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import type { SubtitleOptions } from "@biliLive-tools/types";
import subtitleStyleApi from "@renderer/apis/subtitleStyle";

const visible = defineModel<boolean>({ required: true, default: false });
const emit = defineEmits<{
  (event: "confirm", value: SubtitleOptions): void;
}>();

const props = defineProps<{
  initialConfig?: SubtitleOptions;
}>();

const styleConfig = ref<SubtitleOptions>({
  fontName: "Arial",
  fontSize: 24,
  primaryColour: "#FFFFFF",
  outlineColour: "#000000",
  backColour: "#000000",
  bold: 0,
  italic: 0,
  underline: 0,
  outline: 2,
  shadow: 1,
  alignment: 2,
  marginL: 20,
  marginR: 20,
  marginV: 20,
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
      if (props.initialConfig) {
        styleConfig.value = { ...props.initialConfig };
      } else {
        const defaultConfig = await subtitleStyleApi.getDefault();
        styleConfig.value = { ...defaultConfig };
      }
    }
  },
);

const handleReset = async () => {
  const defaultConfig = await subtitleStyleApi.getDefault();
  styleConfig.value = { ...defaultConfig };
};

const handleCancel = () => {
  visible.value = false;
};

const handleConfirm = () => {
  emit("confirm", { ...styleConfig.value });
  visible.value = false;
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
