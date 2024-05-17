<template>
  <div class="">
    <n-form label-placement="left" :label-width="120">
      <n-form-item label="llm类型">
        <n-select
          v-model:value="config.translate.type"
          :options="typeOptions"
          placeholder="请选择"
        />
      </n-form-item>

      <template v-if="config.translate.type === LLMType.ollama">
        <n-form-item>
          <template #label>
            <span class="inline-flex">
              <span> 接口地址 </span>
              <Tip tip="填入 Ollama 接口代理地址，本地未额外指定可留空"></Tip>
            </span>
          </template>
          <n-input
            v-model:value="config.translate.ollama.server"
            placeholder="请输入接口地址"
          ></n-input>
        </n-form-item>
        <n-form-item>
          <template #label>
            <span class="inline-flex"> 模型 </span>
          </template>
          <n-select
            v-model:value="config.translate.ollama.model"
            :options="ollamaModelList"
            placeholder="请选择"
          /><n-button @click="getOllamaModelList">刷新</n-button>
        </n-form-item>
      </template>

      <n-form-item>
        <template #label>
          <span class="inline-flex"> Function call (暂未支持) </span>
        </template>
        <n-switch v-model:value="config.translate.functionCall" />
      </n-form-item>
      <n-form-item>
        <template #label>
          <span class="inline-flex"> 自定义提示词 (暂未支持) </span>
          <Tip tip="传递给模型的prompt。用于调整不同翻译参数"></Tip>
        </template>
        <n-input
          v-model:value="config.translate.prompt"
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
          <Tip tip="按句子计算，-1为全部关联"></Tip>
        </template>
        <n-input-number
          v-model:value.number="config.translate.contextLength"
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
        <n-input
          v-model:value="config.translate.noTranslate"
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
// import { cloneDeep } from "lodash-es";
import { getModelList } from "@renderer/apis/llm";
import type { AppConfig } from "@biliLive-tools/types";
import { LLMType } from "@biliLive-tools/types/enum";

const config = defineModel<AppConfig>("data", {
  default: () => {},
});

const typeOptions = [{ value: LLMType.ollama, label: "ollama" }];

const notice = useNotification();

// const notifyTest = async () => {
//   await window.api.task.notifyTest("我是一条测试信息", "我是一条测试信息", cloneDeep(config.value));
//   notice.info({
//     title: "已尝试发送测试信息，请注意查收",
//     duration: 2000,
//   });
// };
const ollamaModelList = ref<
  {
    value: string;
    label: string;
  }[]
>([]);
const getOllamaModelList = async () => {
  // console.log("getOllamaModelList", await getModelList());
  try {
    ollamaModelList.value = (await getModelList(config.value.translate.ollama.server)).map(
      (item) => ({
        value: item,
        label: item,
      }),
    );
  } catch (e) {
    console.log(e);
    notice.error({
      title: "获取模型列表失败，请检查接口地址是否正确",
      duration: 1000,
    });
  }
};

const init = () => {
  if (config.value.translate.type === LLMType.ollama) {
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
