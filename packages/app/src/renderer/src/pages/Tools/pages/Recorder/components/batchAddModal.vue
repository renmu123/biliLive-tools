<template>
  <n-modal v-model:show="showModal" :show-icon="false" :closable="false">
    <n-card
      style="width: 700px"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
      class="card"
    >
      <h3>批量添加直播间</h3>

      <n-form label-placement="left" :label-width="120">
        <n-form-item>
          <template #label> 直播间链接({{ urlList.length }}) </template>
          <n-input
            v-model:value="urlsText"
            type="textarea"
            placeholder="请输入直播间链接，每行一个，最多二十个&#10;例如：&#10;https://live.bilibili.com/123456&#10;https://www.douyu.com/123456&#10;https://www.huya.com/123456&#10;https://live.douyin.com/123456"
            :rows="10"
          />
        </n-form-item>

        <n-alert v-if="urlList.length > 20" type="error" style="margin-bottom: 16px">
          链接数量超过限制，只会处理前20个链接
        </n-alert>
      </n-form>

      <template #footer>
        <div class="footer">
          <n-button class="btn" @click="cancel">取消</n-button>
          <n-button
            type="primary"
            class="btn"
            @click="parseUrls"
            :loading="parsing"
            :disabled="urlList.length === 0"
          >
            解析
          </n-button>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { recoderApi } from "@renderer/apis";

const showModal = defineModel<boolean>("visible", { required: true, default: false });

const emits = defineEmits<{
  (event: "parsed", results: ParseResult[]): void;
}>();

interface ParseResult {
  url: string;
  success: boolean;
  data?: {
    providerId: string;
    channelId: string;
    owner: string;
    uid?: number;
    avatar?: string;
  };
  error?: string;
}

const urlsText = ref("");
const parsing = ref(false);

const urlList = computed(() => {
  if (!urlsText.value.trim()) return [];
  return urlsText.value
    .split("\n")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
});

const parseUrls = async () => {
  if (urlList.value.length === 0) return;

  parsing.value = true;

  try {
    // 限制最多20个链接
    const urlsToProcess = urlList.value.slice(0, 20);

    // 调用后端批量解析API
    const batchResult = await recoderApi.batchResolveChannel(urlsToProcess);

    emits("parsed", batchResult.results);
    showModal.value = false;
  } catch (error: any) {
    // 如果批量API失败，回退到单个解析
    console.warn("批量解析API失败，回退到单个解析:", error);

    const urlsToProcess = urlList.value.slice(0, 20);
    const results: ParseResult[] = [];

    for (const url of urlsToProcess) {
      try {
        const data = await recoderApi.resolveChannel(url);
        if (data) {
          results.push({
            url,
            success: true,
            data,
          });
        } else {
          results.push({
            url,
            success: false,
            error: "解析失败，无法识别此链接",
          });
        }
      } catch (error: any) {
        results.push({
          url,
          success: false,
          error: error.message || "解析过程中发生错误",
        });
      }
    }

    emits("parsed", results);
    showModal.value = false;
  } finally {
    parsing.value = false;
  }
};

const cancel = () => {
  showModal.value = false;
};

// 当弹窗打开时重置状态
watch(showModal, (val) => {
  if (val) {
    urlsText.value = "";
  }
});
</script>

<style scoped lang="less">
.footer {
  text-align: right;
  .btn + .btn {
    margin-left: 10px;
  }
}
</style>
