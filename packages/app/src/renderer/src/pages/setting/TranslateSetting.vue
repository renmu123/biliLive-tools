<template>
  <div class="">
    <n-form label-placement="left" :label-width="120">
      <n-form-item label="llm类型">
        <n-select v-model:value="config.type" :options="typeOptions" placeholder="请选择" />
      </n-form-item>

      <template v-if="config.type === LLMType.ollama">
        <n-form-item>
          <template #label>
            <span class="inline-flex">
              <span> 接口地址 </span>
              <Tip tip="填入 Ollama 接口代理地址，本地未额外指定可留空"></Tip>
            </span>
          </template>
          <n-input v-model:value="config.ollama.server" placeholder="请输入接口地址"></n-input>
        </n-form-item>
        <n-form-item>
          <template #label>
            <span class="inline-flex"> 模型 </span>
          </template>
          <n-select
            v-model:value="config.ollama.model"
            :options="ollamaModelList"
            placeholder="请选择"
          /><n-button @click="getOllamaModelList">刷新</n-button>
        </n-form-item>
      </template>

      <n-form-item>
        <template #label>
          <span class="inline-flex"> 创造性 </span>
          <Tip tip="也就是temperature参数，越大创造性越强"></Tip>
        </template>
        <n-input-number
          v-model:value.number="config.temperature"
          class="input-number"
          :min="0"
          :max="10"
          step="0.1"
        />
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> Function call (暂未支持) </span>
          <Tip tip="此功能使生成更加稳定，能否使用与模型相关"></Tip>
        </template>
        <n-switch v-model:value="config.functionCall" />
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 自定义提示词 (暂未支持) </span>
          <Tip tip="传递给模型的prompt。用于调整不同翻译参数"></Tip>
        </template>
        <n-input
          v-model:value="config.prompt"
          placeholder="自定义提示词"
          clearable
          :maxlength="8000"
          type="textarea"
          :autosize="{
            minRows: 2,
          }"
        />
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 上下文长度 (暂未支持) </span>
          <Tip tip="按句子计算，-1为全部关联，此参数和token强相关"></Tip>
        </template>
        <n-input-number
          v-model:value.number="config.contextLength"
          class="input-number"
          :min="-1"
          :max="1000"
        />
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 无需翻译的词汇 (暂未支持) </span>
          <Tip
            tip="请输入不需要翻译的词汇，将会以某些形式传递给模型，不能确保一定不被翻译，用英文逗号分隔"
          ></Tip>
        </template>
        <n-switch v-model:value="config.functionCall" />

        <!-- <n-input
          v-model:value="config.noTranslate"
          placeholder="请输入不需要翻译的词汇，用英文逗号分隔"
          clearable
          :maxlength="1000"
          type="textarea"
          :autosize="{
            minRows: 2,
          }"
        /> -->
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 移除句尾标点 (暂未支持) </span>
          <Tip tip="移除句尾标点，包括中文句号和逗号"></Tip>
        </template>
        <n-input
          v-model:value="config.noTranslate"
          placeholder="请输入不需要翻译的词汇，用英文逗号分隔"
          clearable
          :maxlength="1000"
          type="textarea"
          :autosize="{
            minRows: 2,
          }"
        />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { getModelList } from "@renderer/apis/llm";
import { LLMType } from "@biliLive-tools/shared/enum.js";

interface Config {
  type: any;
  ollama: {
    server: string;
    model: string;
  };
  temperature: number;
  functionCall: boolean;
  prompt: string;
  contextLength: number;
  noTranslate: string;
}

const config = defineModel<Config>("data", {
  default: () => {},
});

const typeOptions = [{ value: LLMType.ollama, label: "ollama" }];

const notice = useNotification();

const ollamaModelList = ref<
  {
    value: string;
    label: string;
  }[]
>([]);
const getOllamaModelList = async () => {
  // console.log("getOllamaModelList", await getModelList());
  try {
    ollamaModelList.value = (await getModelList(config.value.ollama.server)).map((item) => ({
      value: item,
      label: item,
    }));
  } catch (e) {
    console.log(e);
    notice.error({
      title: "获取模型列表失败，请检查接口地址是否正确",
      duration: 1000,
    });
  }
};

const init = () => {
  if (config.value.type === LLMType.ollama) {
    getOllamaModelList();
  }
};
init();
</script>

<style scoped lang="less">
.item {
  display: flex;
}
</style>
