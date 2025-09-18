<template>
  <div class="content">
    <div class="card">
      <h2>文字</h2>
      <n-form ref="formRef" inline :model="config" label-placement="left" label-align="right">
        <n-form-item label="文字大小">
          <n-input-number v-model:value.number="config.fontsize" class="input-number" :min="0" />
          <n-checkbox v-model:checked="config.fontSizeResponsive" style="margin-left: 10px">
            自适应分辨率
          </n-checkbox>
          <n-button
            v-if="config.fontSizeResponsive"
            type="primary"
            @click="changeFontSizeResponsive"
            >修改配置</n-button
          >
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

        <n-form-item v-if="isAdvancedMode" label="描边模糊半径">
          <n-input-number
            v-model:value.number="config['outline-blur']"
            class="input-number"
            :min="0"
          />
        </n-form-item>

        <n-form-item label="文字不透明度">
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
        <n-form-item label="描边不透明度">
          <n-input-number
            v-model:value.number="config['outline-opacity-percentage']"
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
        <n-form-item v-if="isAdvancedMode" label="行间距">
          <n-input-number
            v-model:value.number="config['line-spacing']"
            class="input-number"
            :step="1"
          />
        </n-form-item>
        <n-form-item label="分辨率">
          <n-input-number
            v-model:value.number="config.resolution[0]"
            class="input-number"
            :min="1"
            :step="100"
            placeholder="宽"
          />&nbsp;X&nbsp;
          <n-input-number
            v-model:value.number="config.resolution[1]"
            class="input-number"
            :min="1"
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
          <n-popover trigger="hover">
            <template #trigger>
              <n-checkbox v-model:checked="config.showmsgbox"> 显示礼物框 </n-checkbox>
            </template>
            <div>
              <div>
                <img width="450" height="300" src="../../src/assets/images/gift-postion.png" />
              </div>
              <h3>注意礼物框高度不要高过分辨率</h3>
            </div>
          </n-popover>
        </n-form-item>
        <template v-if="config.showmsgbox">
          <n-form-item v-if="isAdvancedMode" label="礼物框尺寸">
            <n-input-number
              v-model:value.number="config.msgboxsize[0]"
              class="input-number"
              :min="0"
              :step="100"
              title="宽"
            />&nbsp;X&nbsp;
            <n-input-number
              v-model:value.number="config.msgboxsize[1]"
              class="input-number"
              :min="0"
              :step="100"
              title="高"
            />
          </n-form-item>
          <n-form-item v-if="isAdvancedMode" label="礼物框位置">
            <n-input-number
              v-model:value.number="config.msgboxpos[0]"
              class="input-number"
              title="X轴"
              :step="10"
            />&nbsp;X&nbsp;
            <n-input-number
              v-model:value.number="config.msgboxpos[1]"
              class="input-number"
              title="Y轴，负值向上"
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
            text="屏蔽规则"
            tip="
              目前支持四种屏蔽规则，分别是：<br/>
              <ol>
                <li>关键词屏蔽：弹幕（包括SC）内容中包含屏蔽词的，将会被屏蔽</li>
                <li>UID屏蔽：弹幕由指定的UID发送的，将会被屏蔽。格式示例：<10995238></li>
                <li>用户名屏蔽：弹幕由指定的用户名发送的，将会被屏蔽。格式示例：[暮色312]</li>
                <li>正则表达式屏蔽：弹幕内容符合正则表达式的，将会被屏蔽</li>
              </ol>

              Ps: 弹幕姬用户注意：出于性能原因，即使已开启了记录raw，UID屏蔽也是<strong>无法使用</strong>的，请使用用户名屏蔽替代<br/>"
          ></Tip>
        </template>
        <n-input
          v-model:value="config.blacklist"
          type="textarea"
          placeholder="请输入自定义屏蔽规则，使用英文逗号分隔"
          style="width: 100%"
          :input-props="{ spellcheck: 'false' }"
        />
      </n-form-item>
      <n-form-item label-placement="left">
        <template #label> 正则表达式匹配 </template>
        <n-switch v-model:value="config['blacklist-regex']"></n-switch>
        <Tip
          tip="开启后，<strong>所有屏蔽规则</strong>将被视为正则表达式，<strong>UID屏蔽和用户名屏蔽</strong>将会失效！"
        ></Tip>
      </n-form-item>
    </div>

    <n-modal v-model:show="fontSizeResponsiveVisible">
      <n-card style="width: 600px" :bordered="false" role="dialog" aria-modal="true">
        <h3>
          可以为不同分辨率高度设置不同的字体大小，如果最后高度在你设置的两个高度之间，会采用线性方法计算。
          第一个参数为高度，第二个为字体大小
        </h3>
        <div
          v-for="(item, index) in sizeResponsiveParams"
          :key="index"
          style="display: flex; gap: 10px; margin-bottom: 10px"
        >
          <n-input-number
            v-model:value="item[0]"
            placeholder="请输入预定的分辨率高度"
            min="0"
            step="100"
          >
          </n-input-number>
          <n-input-number
            v-model:value="item[1]"
            placeholder="请输入分辨率高度下的字体大小"
            min="0"
            step="1"
          >
          </n-input-number>
          <n-button
            type="error"
            v-if="sizeResponsiveParams.length !== 1"
            @click="sizeResponsiveParams.splice(index, 1)"
            >删除</n-button
          >
          <n-button type="primary" @click="sizeResponsiveParams.splice(index + 1, 0, [0, 0])"
            >新增</n-button
          >
        </div>
        <template #footer>
          <div style="text-align: right">
            <n-button @click="fontSizeResponsiveVisible = false">取消</n-button>
            <n-button type="primary" style="margin-left: 10px" @click="fontSizeResponsiveConfirm"
              >确认</n-button
            >
          </div>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import Tip from "./Tip.vue";
import { commonApi } from "@renderer/apis";

import type { DanmuConfig } from "@biliLive-tools/types";

const config = defineModel<DanmuConfig>({ required: true, default: {} });
const notice = useNotice();

const emits = defineEmits<{
  (event: "change", value: DanmuConfig): void;
}>();

const props = defineProps<{
  simpledMode?: boolean;
}>();
const isAdvancedMode = computed(() => {
  return !props.simpledMode;
});

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
        value: item.postscriptName,
      };
    });
  } else {
    try {
      const data = await commonApi.getFontList();
      fontOptions.value = data.map((item) => {
        return {
          label: item.fullName,
          value: item.postscriptName,
        };
      });
    } catch (error) {
      fontOptions.value = [];
      console.error(error);
    }
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

const fontSizeResponsiveVisible = ref(false);
const sizeResponsiveParams = ref<[number, number][]>([]);
const changeFontSizeResponsive = () => {
  fontSizeResponsiveVisible.value = true;
  sizeResponsiveParams.value = config.value.fontSizeResponsiveParams;
};

const fontSizeResponsiveConfirm = () => {
  const data = sizeResponsiveParams.value.toSorted((a, b) => a[0] - b[0]);
  // 分辨率不能重复
  for (let i = 0; i < data.length - 1; i++) {
    if (data[i][0] === data[i + 1][0]) {
      notice.error("分辨率高度不能重复");
      return;
    }
  }

  // 分辨率较大的字体大小需大于分辨率较小的字体大小
  for (let i = 0; i < data.length - 1; i++) {
    if (data[i][1] >= data[i + 1][1]) {
      notice.error("分辨率高度较大的字体大小需大于等于分辨率高度较小的字体大小");
      return;
    }
  }

  config.value.fontSizeResponsiveParams = data;
  fontSizeResponsiveVisible.value = false;
};
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
