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
        </n-form-item></template
      >
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
getOllamaModelList();
</script>

<style scoped lang="less">
.item {
  display: flex;
}
</style>
