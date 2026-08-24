<template>
  <n-modal v-model:show="visible" :mask-closable="false" :close-on-esc="!saving">
    <n-card
      class="designer-card"
      title="封面设计"
      :bordered="false"
      role="dialog"
      aria-modal="true"
      closable
      @close="close"
    >
      <div class="toolbar">
        <n-button type="primary" @click="addText">添加文字</n-button>
        <n-button @click="selectImages">添加图片</n-button>
        <n-button v-if="selectedLayer" @click="removeSelected">删除图层</n-button>
        <n-switch v-model:value="safeAreaVisible">
          <template #checked>显示 16:9 安全区</template>
          <template #unchecked>隐藏 16:9 安全区</template>
        </n-switch>
        <input
          ref="imageInputRef"
          type="file"
          accept=".png,.jpg,.jpeg"
          multiple
          class="hidden-input"
          @change="handleImageFiles"
        />
      </div>

      <div class="designer-body">
        <div ref="canvasHostRef" class="canvas-host">
          <div
            class="stage-shell"
            :style="{
              width: `${stageWidth}px`,
              height: `${stageHeight}px`,
            }"
          >
            <v-stage
              ref="stageRef"
              :config="stageConfig"
              @mousedown="handleStagePointer"
              @touchstart="handleStagePointer"
            >
              <v-layer>
                <v-rect :config="backgroundConfig" />
                <template v-for="layer in layers" :key="layer.id">
                  <v-text
                    v-if="layer.type === 'text'"
                    :config="textConfig(layer)"
                    @click="selectLayer(layer.id, $event)"
                    @tap="selectLayer(layer.id, $event)"
                    @dragend="updatePosition(layer, $event)"
                    @transformend="updateTransform(layer, $event)"
                  />
                  <v-image
                    v-else
                    :config="imageConfig(layer)"
                    @click="selectLayer(layer.id, $event)"
                    @tap="selectLayer(layer.id, $event)"
                    @wheel="handleImageWheel(layer, $event)"
                    @dragmove="constrainImageDrag(layer, $event)"
                    @dragend="updatePosition(layer, $event)"
                    @transformend="updateTransform(layer, $event)"
                  />
                </template>
                <v-rect v-if="safeAreaVisible" :config="safeAreaConfig" />
                <v-transformer ref="transformerRef" :config="transformerConfig" />
              </v-layer>
            </v-stage>
          </div>
        </div>

        <aside
          class="sidebar"
          :style="{
            maxHeight: `${stageHeight}px`,
          }"
        >
          <template v-if="selectedLayer">
            <h3>图层设置</h3>
            <template v-if="selectedLayer.type === 'text'">
              <label class="field field-wide">
                <span>文字</span>
                <n-input
                  v-model:value="selectedLayer.text"
                  type="textarea"
                  :autosize="{ minRows: 2, maxRows: 5 }"
                />
              </label>
              <label class="field">
                <span>字体</span>
                <n-select
                  v-model:value="selectedLayer.fontFamily"
                  :options="fontOptions"
                  filterable
                />
              </label>
              <div class="field-grid" style="margin-bottom: 10px">
                <label class="field">
                  <span>字号</span>
                  <n-input-number v-model:value="selectedLayer.fontSize" :min="12" :max="300" />
                </label>
                <label class="field">
                  <span>颜色</span>
                  <n-color-picker v-model:value="selectedLayer.fill" :show-alpha="false" />
                </label>
                <label class="field">
                  <span>对齐</span>
                  <n-select v-model:value="selectedLayer.align" :options="alignOptions" />
                </label>
              </div>
              <n-checkbox v-model:checked="selectedLayer.bold">粗体</n-checkbox>
              <n-divider>描边</n-divider>
              <div class="field-grid">
                <label class="field">
                  <span>描边颜色</span>
                  <n-color-picker v-model:value="selectedLayer.stroke" :show-alpha="false" />
                </label>
                <label class="field">
                  <span>描边宽度</span>
                  <n-input-number v-model:value="selectedLayer.strokeWidth" :min="0" :max="30" />
                </label>
              </div>
              <n-divider>阴影</n-divider>
              <div class="field-grid">
                <label class="field">
                  <span>阴影颜色</span>
                  <n-color-picker v-model:value="selectedLayer.shadowColor" />
                </label>
                <label class="field">
                  <span>模糊</span>
                  <n-input-number v-model:value="selectedLayer.shadowBlur" :min="0" :max="60" />
                </label>
                <label class="field">
                  <span>横向偏移</span>
                  <n-input-number
                    v-model:value="selectedLayer.shadowOffsetX"
                    :min="-100"
                    :max="100"
                  />
                </label>
                <label class="field">
                  <span>纵向偏移</span>
                  <n-input-number
                    v-model:value="selectedLayer.shadowOffsetY"
                    :min="-100"
                    :max="100"
                  />
                </label>
              </div>
            </template>
            <template v-else>
              <div class="image-actions">
                <n-button size="small" @click="fitSelectedImage('cover')">铺满画布</n-button>
                <n-button size="small" @click="fitSelectedImage('contain')">完整显示</n-button>
              </div>
            </template>

            <n-divider>通用</n-divider>
            <label class="field field-wide">
              <span>透明度 {{ Math.round(selectedLayer.opacity * 100) }}%</span>
              <n-slider v-model:value="selectedLayer.opacity" :min="0" :max="1" :step="0.01" />
            </label>
            <label class="field field-wide">
              <span>旋转角度</span>
              <n-input-number v-model:value="selectedLayer.rotation" :min="-180" :max="180" />
            </label>
          </template>
          <n-empty v-else description="选择一个图层以编辑" size="small" />

          <n-divider>图层</n-divider>
          <div class="layer-list">
            <div
              v-for="layer in reversedLayers"
              :key="layer.id"
              class="layer-item"
              :class="{ active: layer.id === selectedId }"
              @click="selectedId = layer.id"
            >
              <n-checkbox
                :checked="layer.visible"
                title="显示图层"
                @click.stop
                @update:checked="layer.visible = $event"
              />
              <span class="layer-name">{{ layerName(layer) }}</span>
              <n-button text size="tiny" title="上移" @click.stop="moveLayer(layer.id, 1)"
                >↑</n-button
              >
              <n-button text size="tiny" title="下移" @click.stop="moveLayer(layer.id, -1)"
                >↓</n-button
              >
              <n-button text size="tiny" title="删除" @click.stop="removeLayer(layer.id)"
                >×</n-button
              >
            </div>
          </div>
        </aside>
      </div>

      <template #footer>
        <div class="footer-actions">
          <span class="canvas-size">输出尺寸：1200 × 900</span>
          <n-button :disabled="saving" @click="close">取消</n-button>
          <n-button type="primary" :loading="saving || exporting" @click="complete">
            完成
          </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { useResizeObserver } from "@vueuse/core";
import { uuid } from "@renderer/utils";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 900;

type Align = "left" | "center" | "right";
type ImageFit = "cover" | "contain";

interface LayerBase {
  id: string;
  type: "text" | "image";
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
  visible: boolean;
}

interface TextLayer extends LayerBase {
  type: "text";
  text: string;
  width: number;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  fill: string;
  align: Align;
  stroke: string;
  strokeWidth: number;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
}

interface ImageLayer extends LayerBase {
  type: "image";
  name: string;
  source: string;
  constrainToCanvas: boolean;
  width: number;
  height: number;
  image: HTMLImageElement;
}

type CoverLayer = TextLayer | ImageLayer;

const props = withDefaults(
  defineProps<{
    initialSrc?: string;
    saving?: boolean;
  }>(),
  {
    initialSrc: "",
    saving: false,
  },
);

const visible = defineModel<boolean>("show", { default: false });
const emit = defineEmits<{
  complete: [file: File];
}>();

const notice = useNotification();
const layers = ref<CoverLayer[]>([]);
const selectedId = ref<string | null>(null);
const safeAreaVisible = ref(true);
const exporting = ref(false);
const stageRef = ref<any>(null);
const transformerRef = ref<any>(null);
const imageInputRef = ref<HTMLInputElement | null>(null);
const canvasHostRef = ref<HTMLElement | null>(null);
const stageScale = ref(0.6);
const objectUrls = new Set<string>();

const stageWidth = computed(() => CANVAS_WIDTH * stageScale.value);
const stageHeight = computed(() => CANVAS_HEIGHT * stageScale.value);
const stageConfig = computed(() => ({
  width: stageWidth.value,
  height: stageHeight.value,
  scaleX: stageScale.value,
  scaleY: stageScale.value,
}));
const backgroundConfig = {
  x: 0,
  y: 0,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  fill: "#ffffff",
  listening: false,
};
const safeAreaConfig = {
  x: 0,
  y: (CANVAS_HEIGHT - (CANVAS_WIDTH * 9) / 16) / 2,
  width: CANVAS_WIDTH,
  height: (CANVAS_WIDTH * 9) / 16,
  stroke: "#18a058",
  strokeWidth: 4,
  dash: [16, 10],
  listening: false,
};
const transformerConfig = {
  rotateEnabled: true,
  keepRatio: true,
  flipEnabled: false,
  borderStroke: "#18a058",
  anchorStroke: "#18a058",
  anchorFill: "#ffffff",
  anchorSize: 14,
  boundBoxFunc: (
    oldBox: { width: number; height: number },
    newBox: { width: number; height: number },
  ) => {
    if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) return oldBox;
    return newBox;
  },
};

const fallbackFontFamilies = [
  "Microsoft YaHei",
  "SimHei",
  "SimSun",
  "KaiTi",
  "Arial",
  "sans-serif",
  "serif",
  "monospace",
];
const fontOptions = ref(fallbackFontFamilies.map((font) => ({ label: font, value: font })));
let localFontsRequested = false;

interface LocalFontData {
  family: string;
}

const loadLocalFonts = async () => {
  if (localFontsRequested) return;
  localFontsRequested = true;
  const queryLocalFonts = (
    globalThis as unknown as { queryLocalFonts?: () => Promise<LocalFontData[]> }
  ).queryLocalFonts;
  if (!queryLocalFonts) return;

  try {
    const localFonts = await queryLocalFonts.call(globalThis);
    const families = new Map<string, string>();
    for (const { family } of localFonts) {
      const normalizedFamily = family.trim();
      if (normalizedFamily) families.set(normalizedFamily.toLocaleLowerCase(), normalizedFamily);
    }
    if (!families.size) return;
    for (const family of ["sans-serif", "serif", "monospace"]) {
      families.set(family, family);
    }
    fontOptions.value = [...families.values()]
      .sort((left, right) => left.localeCompare(right, "zh-CN", { sensitivity: "base" }))
      .map((font) => ({ label: font, value: font }));
  } catch {
    // Unsupported contexts and denied permissions keep using the fallback list.
  }
};
const alignOptions = [
  { label: "左对齐", value: "left" },
  { label: "居中", value: "center" },
  { label: "右对齐", value: "right" },
];

const selectedLayer = computed(() => layers.value.find((layer) => layer.id === selectedId.value));
const reversedLayers = computed(() => [...layers.value].reverse());

useResizeObserver(canvasHostRef, (entries) => {
  const width = entries[0]?.contentRect.width ?? 0;
  if (!width) return;
  stageScale.value = Math.min(1, Math.max(0.2, (width - 24) / CANVAS_WIDTH));
});

watch(selectedId, async () => {
  await nextTick();
  updateTransformer();
});

watch(
  () => visible.value,
  async (show, previous) => {
    if (show && !previous) {
      void loadLocalFonts();
      await resetCanvas();
    }
  },
);

const textConfig = (layer: TextLayer) => ({
  ...layer,
  name: `cover-layer-${layer.id}`,
  draggable: true,
  fontStyle: layer.bold ? "bold" : "normal",
  lineHeight: 1.15,
  wrap: "char",
  fillAfterStrokeEnabled: true,
  shadowEnabled: layer.shadowBlur > 0 || layer.shadowOffsetX !== 0 || layer.shadowOffsetY !== 0,
});

const imageConfig = (layer: ImageLayer) => ({
  ...layer,
  name: `cover-layer-${layer.id}`,
  draggable: true,
});

const layerName = (layer: CoverLayer) => {
  if (layer.type === "image") return layer.name;
  return layer.text.trim().slice(0, 14) || "文字";
};

const updateTransformer = () => {
  const transformer = transformerRef.value?.getNode?.();
  const stage = stageRef.value?.getNode?.();
  if (!transformer || !stage) return;
  const node = selectedId.value ? stage.findOne(`.cover-layer-${selectedId.value}`) : null;
  transformer.nodes(node?.visible() ? [node] : []);
  transformer.getLayer()?.batchDraw();
};

const handleStagePointer = (event: any) => {
  const stage = event.target.getStage();
  if (event.target === stage) selectedId.value = null;
};

const selectLayer = (id: string, event: any) => {
  event.cancelBubble = true;
  selectedId.value = id;
};

interface Position {
  x: number;
  y: number;
}

const getCoverMinScale = (layer: ImageLayer, rotation = layer.rotation) => {
  const radians = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const requiredWidth = CANVAS_WIDTH * cos + CANVAS_HEIGHT * sin;
  const requiredHeight = CANVAS_WIDTH * sin + CANVAS_HEIGHT * cos;
  return Math.max(requiredWidth / layer.width, requiredHeight / layer.height);
};

const constrainCoverPosition = (
  layer: ImageLayer,
  position: Position,
  scale = layer.scaleX,
  rotation = layer.rotation,
) => {
  const radians = (rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const canvasCorners = [
    { x: 0, y: 0 },
    { x: CANVAS_WIDTH, y: 0 },
    { x: 0, y: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH, y: CANVAS_HEIGHT },
  ];
  const horizontalProjections = canvasCorners.map(({ x, y }) => x * cos + y * sin);
  const verticalProjections = canvasCorners.map(({ x, y }) => -x * sin + y * cos);
  const projectedX = position.x * cos + position.y * sin;
  const projectedY = -position.x * sin + position.y * cos;
  const minX = Math.max(...horizontalProjections) - layer.width * scale;
  const maxX = Math.min(...horizontalProjections);
  const minY = Math.max(...verticalProjections) - layer.height * scale;
  const maxY = Math.min(...verticalProjections);
  const boundedX = Math.min(maxX, Math.max(minX, projectedX));
  const boundedY = Math.min(maxY, Math.max(minY, projectedY));

  return {
    x: boundedX * cos - boundedY * sin,
    y: boundedX * sin + boundedY * cos,
  };
};

const applyCoverBounds = (layer: ImageLayer, node: any) => {
  const scale = Math.max(node.scaleX(), node.scaleY(), getCoverMinScale(layer, node.rotation()));
  node.scale({ x: scale, y: scale });
  node.position(constrainCoverPosition(layer, node.position(), scale, node.rotation()));
};

const constrainImageDrag = (layer: ImageLayer, event: any) => {
  if (layer.constrainToCanvas) applyCoverBounds(layer, event.target);
};

const handleImageWheel = (layer: ImageLayer, event: any) => {
  if (!layer.constrainToCanvas || event.evt.deltaY === 0) return;
  event.evt.preventDefault();
  event.cancelBubble = true;

  const node = event.target;
  const stage = node.getStage();
  const pointer = stage?.getRelativePointerPosition?.();
  if (!pointer) return;

  const oldScale = node.scaleX();
  const minScale = getCoverMinScale(layer, node.rotation());
  const scaleFactor = 1.08;
  const requestedScale = event.evt.deltaY < 0 ? oldScale * scaleFactor : oldScale / scaleFactor;
  const newScale = Math.min(minScale * 10, Math.max(minScale, requestedScale));
  const ratio = newScale / oldScale;
  node.scale({ x: newScale, y: newScale });
  node.position({
    x: pointer.x - (pointer.x - node.x()) * ratio,
    y: pointer.y - (pointer.y - node.y()) * ratio,
  });
  applyCoverBounds(layer, node);

  layer.x = node.x();
  layer.y = node.y();
  layer.scaleX = node.scaleX();
  layer.scaleY = node.scaleY();
  node.getLayer()?.batchDraw();
  transformerRef.value?.getNode?.()?.forceUpdate();
};

const updatePosition = (layer: CoverLayer, event: any) => {
  if (layer.type === "image" && layer.constrainToCanvas) {
    applyCoverBounds(layer, event.target);
    layer.scaleX = event.target.scaleX();
    layer.scaleY = event.target.scaleY();
    layer.rotation = event.target.rotation();
  }
  layer.x = event.target.x();
  layer.y = event.target.y();
};

const updateTransform = (layer: CoverLayer, event: any) => {
  const node = event.target;
  if (layer.type === "image" && layer.constrainToCanvas) applyCoverBounds(layer, node);
  layer.x = node.x();
  layer.y = node.y();
  layer.scaleX = node.scaleX();
  layer.scaleY = node.scaleY();
  layer.rotation = node.rotation();
};

const addText = () => {
  const layer: TextLayer = {
    id: uuid(),
    type: "text",
    text: "双击右侧文字框编辑",
    x: 300,
    y: 350,
    width: 600,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    opacity: 1,
    visible: true,
    fontFamily: "Microsoft YaHei",
    fontSize: 60,
    bold: true,
    fill: "#ffffff",
    align: "center",
    stroke: "#000000",
    strokeWidth: 4,
    shadowColor: "rgba(0, 0, 0, 0.65)",
    shadowBlur: 8,
    shadowOffsetX: 4,
    shadowOffsetY: 4,
  };
  layers.value.push(layer);
  selectedId.value = layer.id;
};

const selectImages = () => {
  if (!imageInputRef.value) return;
  imageInputRef.value.value = "";
  imageInputRef.value.click();
};

const handleImageFiles = async (event: Event) => {
  const files = Array.from((event.target as HTMLInputElement).files ?? []);
  for (const file of files) {
    try {
      const source = URL.createObjectURL(file);
      objectUrls.add(source);
      const layer = await createImageLayer(source, file.name);
      layers.value.push(layer);
      fitImage(layer, "contain", 0.65);
      selectedId.value = layer.id;
    } catch (error) {
      notice.error({ title: `图片加载失败：${file.name}`, content: String(error) });
    }
  }
};

const loadHtmlImage = (source: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    if (/^https?:/i.test(source)) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("无法读取图片"));
    image.src = source;
  });

const createImageLayer = async (
  source: string,
  name: string,
  constrainToCanvas = false,
): Promise<ImageLayer> => {
  const image = await loadHtmlImage(source);
  return {
    id: uuid(),
    type: "image",
    name,
    source,
    constrainToCanvas,
    image,
    x: 0,
    y: 0,
    width: image.naturalWidth,
    height: image.naturalHeight,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    opacity: 1,
    visible: true,
  };
};

const fitImage = (layer: ImageLayer, fit: ImageFit, maxRatio = 1) => {
  const scale =
    fit === "cover"
      ? Math.max(CANVAS_WIDTH / layer.width, CANVAS_HEIGHT / layer.height)
      : Math.min(CANVAS_WIDTH / layer.width, CANVAS_HEIGHT / layer.height) * maxRatio;
  layer.scaleX = scale;
  layer.scaleY = scale;
  layer.rotation = 0;
  layer.x = (CANVAS_WIDTH - layer.width * scale) / 2;
  layer.y = (CANVAS_HEIGHT - layer.height * scale) / 2;
};

const fitSelectedImage = (fit: ImageFit) => {
  if (selectedLayer.value?.type !== "image") return;
  fitImage(selectedLayer.value, fit);
  nextTick(updateTransformer);
};

const moveLayer = (id: string, direction: -1 | 1) => {
  const index = layers.value.findIndex((layer) => layer.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= layers.value.length) return;
  const [layer] = layers.value.splice(index, 1);
  layers.value.splice(target, 0, layer);
  nextTick(updateTransformer);
};

const removeLayer = (id: string) => {
  const index = layers.value.findIndex((layer) => layer.id === id);
  if (index < 0) return;
  const [layer] = layers.value.splice(index, 1);
  if (layer.type === "image" && objectUrls.has(layer.source)) {
    URL.revokeObjectURL(layer.source);
    objectUrls.delete(layer.source);
  }
  if (selectedId.value === id) selectedId.value = null;
};

const removeSelected = () => {
  if (selectedId.value) removeLayer(selectedId.value);
};

const clearObjectUrls = () => {
  objectUrls.forEach((source) => URL.revokeObjectURL(source));
  objectUrls.clear();
};

const resetCanvas = async () => {
  clearObjectUrls();
  layers.value = [];
  selectedId.value = null;
  safeAreaVisible.value = true;
  if (!props.initialSrc) return;
  try {
    const layer = await createImageLayer(props.initialSrc, "当前封面", true);
    layers.value.push(layer);
    fitImage(layer, "cover");
  } catch (error) {
    notice.warning({ title: "当前封面加载失败，将使用空白画布", content: String(error) });
  }
};

const canvasToBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("封面导出失败"))),
      "image/jpeg",
      0.92,
    );
  });

const complete = async () => {
  const stage = stageRef.value?.getNode?.();
  if (!stage || exporting.value || props.saving) return;
  const transformer = transformerRef.value?.getNode?.();
  exporting.value = true;
  const previousSelection = selectedId.value;
  const previousSafeArea = safeAreaVisible.value;
  const previousTransformerVisible = transformer?.visible();
  selectedId.value = null;
  safeAreaVisible.value = false;
  transformer?.visible(false);
  try {
    await nextTick();
    const canvas = stage.toCanvas({ pixelRatio: 1 / stageScale.value });
    const blob = await canvasToBlob(canvas);
    emit("complete", new File([blob], "cover-design.jpg", { type: "image/jpeg" }));
  } catch (error) {
    notice.error({ title: "封面导出失败", content: String(error) });
  } finally {
    selectedId.value = previousSelection;
    safeAreaVisible.value = previousSafeArea;
    if (previousTransformerVisible !== undefined) {
      transformer?.visible(previousTransformerVisible);
    }
    exporting.value = false;
  }
};

const close = () => {
  if (props.saving) return;
  visible.value = false;
  clearObjectUrls();
};

onBeforeUnmount(clearObjectUrls);
</script>

<style scoped lang="less">
.designer-card {
  width: min(1500px, 96vw);
  // height: min(920px, 94vh);

  :deep(.n-card__content) {
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
}

.toolbar,
.footer-actions,
.image-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar {
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.designer-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 16px;
  min-height: 0;
  flex: 1;
}

.canvas-host {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  overflow: hidden;
  padding: 12px;
  border-radius: 6px;
  background: #4b4b4b;
}

.stage-shell {
  flex: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.sidebar {
  overflow: auto;
}

.sidebar h3 {
  margin: 0 0 12px;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: var(--text-color-2);
  font-size: 12px;
}

.field-wide {
  margin-bottom: 10px;
}

.layer-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
}

.layer-item.active {
  border-color: var(--primary-color);
  background: var(--hover-color);
}

.layer-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.footer-actions {
  justify-content: flex-end;
}

.canvas-size {
  margin-right: auto;
  color: var(--text-color-3);
}

.hidden-input {
  display: none;
}

@media (max-width: 900px) {
  .designer-card {
    width: 100vw;
    height: 100vh;
  }

  .designer-body {
    display: flex;
    flex-direction: column;
    height: auto;
    overflow-y: auto;
  }

  .canvas-host {
    min-height: 260px;
  }

  .sidebar {
    height: auto;
    overflow: visible;
  }
}
</style>
