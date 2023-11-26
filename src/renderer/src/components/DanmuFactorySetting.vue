<template>
  <div class="content">
    <div class="card">
      <h2>文字设置</h2>
      <n-form ref="formRef" inline :model="config" label-placement="left" label-align="right">
        <n-form-item label="文字大小" path="fontsize">
          <n-input-number v-model:value.number="config.fontsize" class="input-number" :min="0" />
        </n-form-item>
        <n-form-item v-if="isAdvancedMode" label="阴影" path="shadow">
          <n-input-number
            v-model:value.number="config.shadow"
            class="input-number"
            :min="0"
            :max="4"
          />
        </n-form-item>
        <n-form-item v-if="isAdvancedMode" label="描边" path="outline">
          <n-input-number
            v-model:value.number="config.outline"
            class="input-number"
            :min="0"
            :max="4"
          />
        </n-form-item>
        <n-form-item label="不透明度" path="opacity">
          <n-input-number
            v-model:value.number="config.opacity"
            class="input-number"
            :min="0"
            :max="255"
          />
        </n-form-item>
        <n-form-item path="bold">
          <n-checkbox v-model:checked="config.bold"> 粗体 </n-checkbox>
        </n-form-item>
        <n-form-item label="字体">
          <n-select
            v-model:value="config.fontname"
            :options="fontOptions"
            style="width: 300px"
            filterable
            virtual-scroll
          />
        </n-form-item>
      </n-form>
    </div>
    <n-divider />
    <div v-if="isAdvancedMode" class="card">
      <h2>弹幕设置</h2>
      <n-form ref="formRef" inline :model="config" label-placement="left" label-align="right">
        <n-form-item v-if="isAdvancedMode" label="弹幕密度" path="density">
          <n-radio-group v-model:value="config.density" name="density">
            <n-space>
              <n-radio value="0"> 无限 </n-radio>
              <n-radio value="-1"> 不重叠 </n-radio>
              <!-- <n-radio value="Radio 3"> 按条数 </n-radio> -->
            </n-space>
          </n-radio-group>
        </n-form-item>
        <n-form-item v-if="isAdvancedMode" label="滚动弹幕通过时间" path="scrolltime">
          <n-input-number
            v-model:value.number="config.scrolltime"
            class="input-number"
            :min="0"
          />&nbsp;秒
        </n-form-item>
        <n-form-item v-if="isAdvancedMode" label="固定弹幕停留时间" path="fixtime">
          <n-input-number
            v-model:value.number="config.fixtime"
            class="input-number"
            :min="0"
          />&nbsp;秒
        </n-form-item>
        <!-- <n-form-item v-if="isAdvancedMode" label="时间轴偏移量" path="density">
              <n-input-number v-model:value.number="config.density" class="input-number" />&nbsp;秒
            </n-form-item> -->

        <n-form-item
          v-if="isAdvancedMode"
          label="按类型屏蔽"
          path="blockmode"
          label-placement="top"
          label-align="left"
        >
          <n-checkbox-group v-model:value="config.blockmode">
            <n-space>
              <n-checkbox value="R2L"> 右左滚动 </n-checkbox>
              <n-checkbox value="L2R"> 左右滚动 </n-checkbox>
              <n-checkbox value="TOP"> 顶部固定 </n-checkbox>
              <n-checkbox value="BOTTOM"> 底部固定 </n-checkbox>
              <n-checkbox value="SPECIAL"> 特殊 </n-checkbox>
              <n-checkbox value="COLOR"> 非白色 </n-checkbox>
              <n-checkbox value="REPEAT"> 内容重复 </n-checkbox>
            </n-space>
          </n-checkbox-group>
        </n-form-item>
      </n-form>
    </div>
    <n-divider v-if="isAdvancedMode" />

    <div class="card">
      <h2>画面设置</h2>
      <n-form ref="formRef" inline :model="config" label-placement="left" label-align="right">
        <n-form-item v-if="isAdvancedMode" label="滚动弹幕显示区域" path="scrollarea">
          <n-input-number
            v-model:value.number="config.scrollarea"
            class="input-number"
            :min="0"
            :max="1"
            :precision="1"
            :step="0.1"
          />
        </n-form-item>
        <n-form-item v-if="isAdvancedMode" label="全部弹幕显示区域" path="displayarea">
          <n-input-number
            v-model:value.number="config.displayarea"
            class="input-number"
            :min="0"
            :max="1"
            :precision="1"
            :step="0.1"
          />
        </n-form-item>
        <n-form-item label="分辨率" path="phone">
          <n-input-number
            v-model:value.number="config.resolution[0]"
            class="input-number"
            :min="0"
            :step="100"
            placeholder="宽"
          />&nbsp;X&nbsp;
          <n-input-number
            v-model:value.number="config.resolution[1]"
            class="input-number"
            :min="0"
            :step="100"
            placeholder="高"
          />
        </n-form-item>
        <div>
          <n-form-item v-if="isAdvancedMode" label="调试" path="phone">
            <n-checkbox-group v-model:value="config.statmode">
              <n-space>
                <n-checkbox value="TABLE"> 统计图 </n-checkbox>
                <n-checkbox value="HISTOGRAM"> 直方图 </n-checkbox>
              </n-space>
            </n-checkbox-group>
          </n-form-item>
        </div>
      </n-form>
    </div>
    <n-divider />

    <div class="card">
      <h2>礼物栏设置</h2>
      <n-form ref="formRef" inline :model="config" label-placement="left" label-align="right">
        <n-form-item path="showmsgbox">
          <n-checkbox v-model:checked="config.showmsgbox"> 显示礼物框 </n-checkbox>
        </n-form-item>
        <template v-if="config.showmsgbox">
          <n-form-item v-if="isAdvancedMode" label="礼物框尺寸" path="msgboxsize">
            <n-input-number
              v-model:value.number="config.msgboxsize[0]"
              class="input-number"
              :min="0"
              :step="100"
            />&nbsp;X&nbsp;
            <n-input-number
              v-model:value.number="config.msgboxsize[1]"
              class="input-number"
              :min="0"
              :step="100"
            />
          </n-form-item>
          <n-form-item v-if="isAdvancedMode" label="礼物框位置" path="msgboxpos">
            <n-input-number
              v-model:value.number="config.msgboxpos[0]"
              class="input-number"
              :step="10"
            />&nbsp;X&nbsp;
            <n-input-number
              v-model:value.number="config.msgboxpos[1]"
              class="input-number"
              :step="10"
            />
          </n-form-item>
          <n-form-item label="礼物框文字大小" path="msgboxfontsize">
            <n-input-number
              v-model:value.number="config.msgboxfontsize"
              class="input-number"
              :min="0"
            />
          </n-form-item>
          <n-form-item label="礼物框持续时间" path="msgboxduration">
            <n-input-number
              v-model:value.number="config.msgboxduration"
              class="input-number"
              :min="0"
            >
              <template #suffix> 秒 </template></n-input-number
            >
          </n-form-item>
          <n-form-item label="礼物最小价值" path="giftminprice">
            <n-input-number
              v-model:value.number="config.giftminprice"
              class="input-number"
              :min="0"
            >
            </n-input-number>
          </n-form-item>
          <n-form-item
            v-if="isAdvancedMode"
            label="同一用户相同礼物自动合并的时间窗"
            path="giftmergetolerance"
          >
            <n-input-number
              v-model:value.number="config.giftmergetolerance"
              class="input-number"
              :min="0"
            />
          </n-form-item>
        </template>
      </n-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DanmuConfig } from "../../../types";

const emits = defineEmits<{
  (event: "change", value: DanmuConfig): void;
}>();

const props = defineProps<{
  simpledMode?: boolean;
}>();
const isAdvancedMode = computed(() => {
  return !props.simpledMode;
});

// @ts-ignore
const config: Ref<DanmuConfig> = ref({
  resolution: [1920, 1080],
  msgboxsize: [500, 1080],
  msgboxpos: [20, 0],
});

const getConfig = async () => {
  const data = await window.api.getDanmuConfig();
  config.value = data;
};

const fontOptions = ref([]);
const getFonts = async () => {
  // @ts-ignore
  const data = await window.queryLocalFonts();
  fontOptions.value = data.map((item) => {
    return {
      label: item.fullName,
      value: item.postscriptName,
    };
  });
};
onMounted(async () => {
  await getConfig();
  getFonts();
});

watch(
  () => config.value,
  (val) => {
    emits("change", val);
  },
  {
    deep: true,
  },
);
</script>

<style scoped lang="less">
.input-number {
  width: 100px;
}
.card {
  :deep(.n-form) {
    display: block;
  }
  :deep(.n-form-item) {
    display: inline-grid;
  }
}
</style>
