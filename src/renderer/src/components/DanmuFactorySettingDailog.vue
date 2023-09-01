<template>
  <n-modal v-model:show="showModal" :mask-closable="false" auto-focus>
    <n-card
      style="width: calc(100% - 60px)"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
    >
      <div class="content">
        <div class="card">
          <h2>文字设置</h2>
          <n-form ref="formRef" inline :model="config" label-placement="left" label-align="right">
            <n-form-item label="文字大小" path="msgboxFontsize">
              <n-input-number
                v-model:value.number="config.msgboxFontsize"
                class="input-number"
                :min="0"
              />
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
            <n-form-item v-if="isAdvancedMode" label="滚动弹幕显示区域" path="scrollArea">
              <n-input-number
                v-model:value.number="config.scrollArea"
                class="input-number"
                :min="0"
                :max="1"
                :precision="1"
                :step="0.1"
              />
            </n-form-item>
            <n-form-item v-if="isAdvancedMode" label="全部弹幕显示区域" path="displayArea">
              <n-input-number
                v-model:value.number="config.displayArea"
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
              />&nbsp;X&nbsp;
              <n-input-number
                v-model:value.number="config.resolution[1]"
                class="input-number"
                :min="0"
                :step="100"
              />
            </n-form-item>
            <div>
              <n-form-item v-if="isAdvancedMode" label="调试" path="phone">
                <n-checkbox-group v-model:value="config.blockmode">
                  <n-space>
                    <n-checkbox value="TABLE"> 统计图 </n-checkbox>
                    <n-checkbox value="HISTOGRAM"> 直方图 </n-checkbox>
                  </n-space>
                </n-checkbox-group>
              </n-form-item>
            </div>
          </n-form>
        </div>
      </div>

      <template #footer>
        <div class="footer">
          <n-checkbox v-model:checked="simpledMode"> 简易模式 </n-checkbox>
          <n-button class="btn" @click="close">取消</n-button>
          <n-button type="primary" class="btn" @click="saveConfig"> 确认 </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
const showModal = defineModel<boolean>({ required: true, default: false });
import type { DanmuConfig } from "@/types";

const simpledMode = ref(true);
const isAdvancedMode = computed(() => {
  return !simpledMode.value;
});

const config = ref<DanmuConfig>({
  resolution: [],
});
const getConfig = async () => {
  const data = await window.api.getDanmuConfig();
  config.value = data;
  console.log(data);
};

const saveConfig = async () => {
  console.log(config.value);

  // await window.api.saveDanmuConfig(config.value);
  // close();
};

const close = () => {
  showModal.value = false;
};

watch(
  () => showModal.value,
  (value) => {
    if (value) {
      getConfig();
    }
  },
  { immediate: true },
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

.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 10px;
  }
}
</style>
