<template>
  <n-modal v-model:show="showModal" transform-origin="center" :mask-closable="true">
    <n-card style="width: 500px" :bordered="false" :title="dialogTitle">
      <div class="update-content">
        <!-- 检查中状态 -->
        <div v-if="loading" class="check-loading">
          <n-spin size="medium" />
          <div class="loading-text">正在检查更新...</div>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="updateResult && updateResult.error" class="error-content">
          <n-icon size="48" color="#d03050">
            <svg viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM13 17h-2v-6h2v6zm0-8h-2V7h2v2z"
              />
            </svg>
          </n-icon>
          <div class="message">{{ updateResult.message }}</div>
          <div class="actions">
            <n-button @click="close">取消</n-button>
            <n-button type="primary" @click="openGitHub">确认</n-button>
          </div>
        </div>

        <!-- 无需更新状态 -->
        <div v-else-if="updateResult && !updateResult.needUpdate" class="no-update-content">
          <n-icon size="48" color="#18a058">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </n-icon>
          <div class="message">{{ updateResult.message || "当前已是最新版本" }}</div>
          <div class="actions">
            <n-button type="primary" @click="close">确定</n-button>
          </div>
        </div>

        <!-- 有新版本状态 -->
        <div v-else-if="updateResult && updateResult.needUpdate" class="has-update-content">
          <n-icon size="48" color="#2080f0">
            <svg viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
              />
            </svg>
          </n-icon>
          <div class="message">{{ updateResult.message || "发现新版本" }}</div>
          <div class="actions">
            <n-button @click="close">稍后更新</n-button>
            <n-button v-if="updateResult.backupUrl" @click="openBackupUrl">备用下载</n-button>
            <n-button type="primary" @click="openDownloadUrl">立即查看</n-button>
          </div>
        </div>
      </div>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { commonApi } from "@renderer/apis";

interface UpdateResult {
  message: string;
  error: boolean;
  needUpdate: boolean;
  downloadUrl: string;
  backupUrl: string;
}

const showModal = defineModel<boolean>("visible", { required: true, default: false });

const loading = ref(false);
const updateResult = ref<UpdateResult | null>(null);

const dialogTitle = computed(() => {
  if (loading.value) return "检查更新";
  if (updateResult.value?.error) return "检查更新失败";
  if (updateResult.value?.needUpdate) return "发现新版本";
  return "检查更新";
});

// 检查更新
const checkForUpdates = async () => {
  loading.value = true;
  updateResult.value = null;

  try {
    const result = await commonApi.checkUpdate();
    updateResult.value = result;
  } catch (error) {
    updateResult.value = {
      message: "检查更新失败，请检查网络连接",
      error: true,
      needUpdate: false,
      downloadUrl: "",
      backupUrl: "",
    };
  } finally {
    loading.value = false;
  }
};

// 打开下载链接
const openDownloadUrl = () => {
  if (updateResult.value?.downloadUrl) {
    if (window.isWeb) {
      window.open(updateResult.value.downloadUrl, "_blank");
    } else {
      window.api.openExternal(updateResult.value.downloadUrl);
    }
  }
};

// 打开备用下载链接
const openBackupUrl = () => {
  if (updateResult.value?.backupUrl) {
    if (window.isWeb) {
      window.open(updateResult.value.backupUrl, "_blank");
    } else {
      window.api.openExternal(updateResult.value.backupUrl);
    }
  }
};

// 打开GitHub
const openGitHub = () => {
  const githubUrl = "https://github.com/renmu123/biliLive-tools/releases";
  if (window.isWeb) {
    window.open(githubUrl, "_blank");
  } else {
    window.api.openExternal(githubUrl);
  }
};

// 关闭弹框
const close = () => {
  showModal.value = false;
  loading.value = false;
  updateResult.value = null;
};

// 当弹框显示时自动检查更新
watch(showModal, (visible) => {
  if (visible) {
    checkForUpdates();
  }
});

// 暴露方法供外部调用
defineExpose({
  checkForUpdates,
});
</script>

<style scoped lang="less">
.update-content {
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.check-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  .loading-text {
    color: #666;
    font-size: 14px;
  }
}

.error-content,
.no-update-content,
.has-update-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;

  .message {
    font-size: 16px;
    line-height: 1.5;
    color: #333;
    margin: 8px 0;
  }

  .actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }
}

@media screen and (prefers-color-scheme: dark) {
  .error-content .message,
  .no-update-content .message,
  .has-update-content .message {
    color: #fff;
  }

  .check-loading .loading-text {
    color: #ccc;
  }
}
</style>
