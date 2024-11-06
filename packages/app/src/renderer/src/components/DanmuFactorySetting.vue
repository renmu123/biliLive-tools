<template>
  <div class="content">
    <div class="card">
      <h2>文字</h2>
      <n-form ref="formRef" inline :model="config" label-placement="left" label-align="right">
        <n-form-item label="文字大小">
          <n-input-number v-model:value.number="config.fontsize" class="input-number" :min="0" />
        </n-form-item>
        <n-form-item v-if="isAdvancedMode" label="阴影">
          <n-input-number
            v-model:value.number="config.shadow"
            class="input-number"
            :min="0"
            :max="4"
          />
        </n-form-item>
        <n-form-item v-if="isAdvancedMode" label="描边">
          <n-input-number
            v-model:value.number="config.outline"
            class="input-number"
            :min="0"
            :max="4"
          />
        </n-form-item>
        <n-form-item label="不透明度">
          <n-input-number
            v-model:value.number="config.opacity100"
            class="input-number"
            :min="0"
            :max="100"
            style="width: 130px"
            :precision="2"
          >
            <template #suffix> % </template></n-input-number
          >
        </n-form-item>
        <n-form-item>
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
      <h2>弹幕</h2>
      <n-form ref="formRef" inline :model="config" label-placement="left" label-align="right">
        <n-form-item v-if="isAdvancedMode" label="弹幕密度">
          <n-radio-group v-model:value="config.density" name="density">
            <n-space>
              <n-radio :value="0"> 无限 </n-radio>
              <n-radio :value="-1"> 不重叠 </n-radio>
              <n-radio :value="-2"> 按条数 </n-radio>
            </n-space>
          </n-radio-group>
          <n-input-number
            v-if="config.density === -2"
            v-model:value.number="config.customDensity"
            class="input-number"
            :min="1"
          >
            <template #suffix> 条 </template></n-input-number
          >
        </n-form-item>
        <n-form-item v-if="isAdvancedMode" label="滚动弹幕通过时间">
          <n-input-number v-model:value.number="config.scrolltime" class="input-number" :min="0">
            <template #suffix> 秒 </template></n-input-number
          >
        </n-form-item>
        <n-form-item v-if="isAdvancedMode" label="固定弹幕停留时间">
          <n-input-number v-model:value.number="config.fixtime" class="input-number" :min="0">
            <template #suffix> 秒 </template></n-input-number
          >
        </n-form-item>
        <n-form-item v-if="isAdvancedMode" label="时间偏移">
          <n-input-number
            v-model:value.number="config.timeshift"
            class="input-number"
            style="width: 120px"
            :precision="2"
          >
            <template #suffix> 秒 </template></n-input-number
          >
        </n-form-item>
        <n-form-item title="如果有用户名的话">
          <n-checkbox v-model:checked="config.showusernames"> 显示用户名 </n-checkbox>
        </n-form-item>
        <n-form-item title="只支持部分屏蔽弹幕">
          <n-checkbox v-model:checked="config.saveblocked"> 保存屏蔽弹幕 </n-checkbox>
        </n-form-item>
        <!-- <n-form-item v-if="isAdvancedMode" label="时间轴偏移量" path="density">
              <n-input-number v-model:value.number="config.density" class="input-number" />&nbsp;秒
            </n-form-item> -->
        <div>
          <n-form-item
            v-if="isAdvancedMode"
            label="按类型屏蔽"
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
        </div>
      </n-form>
    </div>
    <n-divider v-if="isAdvancedMode" />

    <div class="card">
      <h2>画面</h2>
      <n-form ref="formRef" inline :model="config" label-placement="left" label-align="right">
        <n-form-item v-if="isAdvancedMode" label="滚动弹幕显示区域">
          <n-input-number
            v-model:value.number="config.scrollarea"
            class="input-number"
            :min="0"
            :max="1"
            :precision="1"
            :step="0.1"
          />
        </n-form-item>
        <n-form-item v-if="isAdvancedMode" label="全部弹幕显示区域">
          <n-input-number
            v-model:value.number="config.displayarea"
            class="input-number"
            :min="0"
            :max="1"
            :precision="1"
            :step="0.1"
          />
        </n-form-item>
        <n-form-item label="分辨率">
          <n-input-number
            v-model:value.number="config.resolution[0]"
            class="input-number"
            :min="-1"
            :step="100"
            placeholder="宽"
          />&nbsp;X&nbsp;
          <n-input-number
            v-model:value.number="config.resolution[1]"
            class="input-number"
            :min="-1"
            :step="100"
            placeholder="高"
          />
          <n-checkbox
            v-model:checked="config.resolutionResponsive"
            style="margin-left: 20px"
            title="启用后在压制弹幕至视频中时，以视频的分辨率为主，开启分辨率缩放后会失效"
          >
            自适应视频分辨率
          </n-checkbox>
        </n-form-item>
        <div>
          <n-form-item v-if="isAdvancedMode" label="调试">
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
      <h2 title="仅限blrec&录播姬弹幕格式">礼物栏</h2>
      <n-form ref="formRef" inline :model="config" label-placement="left" label-align="right">
        <n-form-item>
          <n-checkbox v-model:checked="config.showmsgbox"> 显示礼物框 </n-checkbox>
        </n-form-item>
        <template v-if="config.showmsgbox">
          <n-form-item v-if="isAdvancedMode" label="礼物框尺寸">
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
          <n-form-item
            v-if="isAdvancedMode"
            label="礼物框位置"
            title="第二个输入框修改为负数，可以向上调节位置"
          >
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
          <n-form-item label="礼物框文字大小">
            <n-input-number
              v-model:value.number="config.msgboxfontsize"
              class="input-number"
              :min="0"
            />
          </n-form-item>
          <n-form-item label="礼物框持续时间">
            <n-input-number
              v-model:value.number="config.msgboxduration"
              class="input-number"
              :min="0"
              style="width: 140px"
            >
              <template #suffix> 秒 </template></n-input-number
            >
          </n-form-item>
          <n-form-item label="礼物最小价值">
            <n-input-number
              v-model:value.number="config.giftminprice"
              class="input-number"
              :min="0"
              style="width: 140px"
            >
              <template #suffix> RMB </template>
            </n-input-number>
          </n-form-item>
        </template>
      </n-form>
    </div>

    <div class="card">
      <h2>其他</h2>
      <n-form-item style="width: 100%">
        <template #label>
          <Tip
            text="屏蔽词"
            tip="
              目前支持三种屏蔽方式，分别是弹幕内容，uid，用户名，需以英文逗号分隔<br/>
              弹幕内容：部分匹配，包含sc内容<br/>
              uid：全匹配，格式为<10995238>，弹幕姬用户注意，即是你开启了记录raw，出于性能原因，此过滤也是无法使用的，请使用用户名替代<br/>
              用户名：全匹配，格式为<暮色312><br/>
              此功能正在测试，如果出现开启后无法转换的情况请反馈"
          ></Tip>
        </template>
        <n-input
          v-model:value="config.blacklist"
          type="textarea"
          placeholder="请输入需要屏蔽的关键词，以英文逗号分隔"
          style="width: 100%"
          :input-props="{ spellcheck: 'false' }"
        />
      </n-form-item>
    </div>
  </div>
</template>

<script setup lang="ts">
import Tip from "./Tip.vue";
import type { DanmuConfig } from "@biliLive-tools/types";

const config = defineModel<DanmuConfig>({ required: true, default: {} });

const emits = defineEmits<{
  (event: "change", value: DanmuConfig): void;
}>();

const props = defineProps<{
  simpledMode?: boolean;
}>();
const isAdvancedMode = computed(() => {
  return !props.simpledMode;
});

const fontOptions = ref([]);
const getFonts = async () => {
  // TODO:修改为从接口获取
  if (!window.isWeb) {
    // @ts-ignore
    const data = await window.queryLocalFonts();
    fontOptions.value = data.map((item) => {
      return {
        label: item.fullName,
        value: item.postscriptName,
      };
    });
  }
};
onMounted(async () => {
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
